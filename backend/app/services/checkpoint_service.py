import asyncio
from datetime import datetime, timezone

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models import Checkpoint, Sprint

log = structlog.get_logger()

# Event registry for orchestrator to wait on checkpoint resolution
_checkpoint_events: dict[str, asyncio.Event] = {}


def get_checkpoint_event(checkpoint_id: str) -> asyncio.Event:
    if checkpoint_id not in _checkpoint_events:
        _checkpoint_events[checkpoint_id] = asyncio.Event()
    return _checkpoint_events[checkpoint_id]


async def create_checkpoint(
    sprint_id: str,
    task_id: str | None,
    checkpoint_type: str,
    title: str,
    description: str,
    options: list,
    context: dict | None = None,
) -> Checkpoint:
    async with async_session() as db:
        checkpoint = Checkpoint(
            sprint_id=sprint_id,
            task_id=task_id,
            checkpoint_type=checkpoint_type,
            title=title,
            description=description,
            options=options,
            context=context,
            status="pending",
        )
        db.add(checkpoint)

        # Update sprint status
        result = await db.execute(select(Sprint).where(Sprint.id == sprint_id))
        sprint = result.scalar_one_or_none()
        if sprint:
            sprint.status = "awaiting_input"

        await db.commit()
        await db.refresh(checkpoint)

        from app.api.websocket import broadcast
        from app.services.trace_service import log_event

        await log_event(
            sprint_id=sprint_id,
            event_type="checkpoint_surfaced",
            source_type="orchestrator",
            task_id=task_id,
            payload={"checkpoint_id": checkpoint.id, "type": checkpoint_type, "title": title},
        )

        await broadcast(sprint_id, "checkpoint_surfaced", {
            "id": checkpoint.id,
            "checkpoint_type": checkpoint_type,
            "title": title,
            "description": description,
            "options": options,
            "context": context,
            "status": "pending",
            "task_id": task_id,
            "surfaced_at": checkpoint.surfaced_at.isoformat(),
        })

        return checkpoint


async def resolve_checkpoint(
    checkpoint_id: str,
    resolution: str,
    user_input: str | None,
    db: AsyncSession,
) -> Checkpoint | None:
    result = await db.execute(select(Checkpoint).where(Checkpoint.id == checkpoint_id))
    checkpoint = result.scalar_one_or_none()
    if not checkpoint:
        return None

    if checkpoint.status == "resolved":
        return checkpoint

    checkpoint.resolution = resolution
    checkpoint.user_input = user_input
    checkpoint.status = "resolved"
    checkpoint.resolved_at = datetime.now(timezone.utc)

    # Update sprint status back to running
    result = await db.execute(select(Sprint).where(Sprint.id == checkpoint.sprint_id))
    sprint = result.scalar_one_or_none()
    if sprint and sprint.status == "awaiting_input":
        sprint.status = "running"

    await db.commit()

    from app.api.websocket import broadcast
    from app.services.trace_service import log_event

    await log_event(
        sprint_id=checkpoint.sprint_id,
        event_type="checkpoint_resolved",
        source_type="user",
        payload={"checkpoint_id": checkpoint_id, "resolution": resolution, "user_input": user_input},
    )

    await broadcast(checkpoint.sprint_id, "checkpoint_resolved", {
        "id": checkpoint.id,
        "status": "resolved",
        "resolution": resolution,
        "user_input": user_input,
        "resolved_at": checkpoint.resolved_at.isoformat(),
    })

    # Signal the orchestrator to resume
    event = get_checkpoint_event(checkpoint_id)
    event.set()

    return checkpoint
