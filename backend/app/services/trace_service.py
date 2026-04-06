import asyncio

import structlog

from app.database import async_session
from app.models import TraceEvent

log = structlog.get_logger()


async def log_event(
    sprint_id: str,
    event_type: str,
    source_type: str,
    payload: dict | None = None,
    task_id: str | None = None,
    token_count: int | None = None,
):
    """Fire-and-forget trace event logging."""
    asyncio.create_task(_write_event(sprint_id, event_type, source_type, payload, task_id, token_count))


async def _write_event(
    sprint_id: str,
    event_type: str,
    source_type: str,
    payload: dict | None,
    task_id: str | None,
    token_count: int | None,
):
    try:
        async with async_session() as db:
            event = TraceEvent(
                sprint_id=sprint_id,
                task_id=task_id,
                event_type=event_type,
                source_type=source_type,
                payload=payload,
                token_count=token_count,
            )
            db.add(event)
            await db.commit()
    except Exception as e:
        log.error("Failed to write trace event", error=str(e), event_type=event_type)


async def get_events(
    sprint_id: str,
    limit: int = 50,
    offset: int = 0,
    event_type: str | None = None,
):
    from sqlalchemy import select, func

    async with async_session() as db:
        query = select(TraceEvent).where(TraceEvent.sprint_id == sprint_id)
        if event_type:
            query = query.where(TraceEvent.event_type == event_type)

        count_query = select(func.count()).select_from(TraceEvent).where(TraceEvent.sprint_id == sprint_id)
        if event_type:
            count_query = count_query.where(TraceEvent.event_type == event_type)

        total_result = await db.execute(count_query)
        total = total_result.scalar()

        result = await db.execute(
            query.order_by(TraceEvent.created_at.desc()).offset(offset).limit(limit)
        )
        events = result.scalars().all()

        return {"events": events, "total": total, "limit": limit, "offset": offset}
