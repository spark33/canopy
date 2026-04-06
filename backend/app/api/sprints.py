import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Sprint, TraceEvent
from app.schemas.checkpoint import TraceEventRead, UserInput
from app.schemas.sprint import SprintCreate, SprintRead, SprintUpdate

router = APIRouter(tags=["sprints"])


@router.post("/projects/{project_id}/sprints", response_model=SprintRead, status_code=201)
async def create_sprint(project_id: str, data: SprintCreate, db: AsyncSession = Depends(get_db)):
    # Get next sprint number
    result = await db.execute(
        select(func.max(Sprint.sprint_number)).where(Sprint.project_id == project_id)
    )
    max_num = result.scalar() or 0
    sprint_number = max_num + 1

    sprint = Sprint(
        project_id=project_id,
        sprint_number=sprint_number,
        goal=data.goal,
        autonomy_mode=data.autonomy_mode or "adaptive",
        status="planning",
        started_at=datetime.now(timezone.utc),
        orchestrator_state={"cycle_count": 0, "current_confidence": 1.0, "accumulated_context": "", "pending_decisions": [], "blocked_on": None},
    )
    db.add(sprint)
    await db.flush()

    sprint_id = sprint.id
    await db.commit()

    # Kick off orchestrator loop in background
    from app.services.sprint_orchestrator import run_sprint

    asyncio.create_task(run_sprint(sprint_id))

    result = await db.execute(
        select(Sprint)
        .options(selectinload(Sprint.tasks), selectinload(Sprint.checkpoints))
        .where(Sprint.id == sprint_id)
    )
    return result.scalar_one()


@router.get("/projects/{project_id}/sprints/{sprint_id}", response_model=SprintRead)
async def get_sprint(project_id: str, sprint_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Sprint)
        .options(selectinload(Sprint.tasks), selectinload(Sprint.checkpoints))
        .where(Sprint.id == sprint_id, Sprint.project_id == project_id)
    )
    sprint = result.scalar_one_or_none()
    if not sprint:
        raise HTTPException(status_code=404, detail=f"Sprint {sprint_id} not found")
    return sprint


@router.patch("/projects/{project_id}/sprints/{sprint_id}", response_model=SprintRead)
async def update_sprint(project_id: str, sprint_id: str, data: SprintUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Sprint).where(Sprint.id == sprint_id, Sprint.project_id == project_id))
    sprint = result.scalar_one_or_none()
    if not sprint:
        raise HTTPException(status_code=404, detail=f"Sprint {sprint_id} not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(sprint, field, value)

    if data.status == "cancelled":
        sprint.completed_at = datetime.now(timezone.utc)

    await db.commit()
    result = await db.execute(
        select(Sprint)
        .options(selectinload(Sprint.tasks), selectinload(Sprint.checkpoints))
        .where(Sprint.id == sprint_id)
    )
    return result.scalar_one()


@router.get("/projects/{project_id}/sprints/{sprint_id}/tasks")
async def list_sprint_tasks(project_id: str, sprint_id: str, db: AsyncSession = Depends(get_db)):
    from app.models import Task
    from app.schemas.sprint import TaskBrief

    result = await db.execute(select(Task).where(Task.sprint_id == sprint_id).order_by(Task.created_at))
    tasks = result.scalars().all()
    return [TaskBrief.model_validate(t) for t in tasks]


@router.get("/projects/{project_id}/sprints/{sprint_id}/trace")
async def get_trace_events(
    project_id: str,
    sprint_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    event_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(TraceEvent).where(TraceEvent.sprint_id == sprint_id)
    count_query = select(func.count()).select_from(TraceEvent).where(TraceEvent.sprint_id == sprint_id)

    if event_type:
        query = query.where(TraceEvent.event_type == event_type)
        count_query = count_query.where(TraceEvent.event_type == event_type)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    result = await db.execute(
        query.order_by(TraceEvent.created_at.desc()).offset(offset).limit(limit)
    )
    events = result.scalars().all()

    return {
        "events": [TraceEventRead.model_validate(e) for e in events],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.post("/projects/{project_id}/sprints/{sprint_id}/input")
async def send_user_input(
    project_id: str,
    sprint_id: str,
    data: UserInput,
    db: AsyncSession = Depends(get_db),
):
    from app.services.trace_service import log_event

    await log_event(
        sprint_id=sprint_id,
        event_type="user_input",
        source_type="user",
        payload={"content": data.content, "references": data.references},
    )

    return {"acknowledged": True, "message": "Input queued for next orchestrator cycle"}
