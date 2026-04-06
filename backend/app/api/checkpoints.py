from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Checkpoint
from app.schemas.checkpoint import CheckpointRead, CheckpointResolve

router = APIRouter(tags=["checkpoints"])


@router.post("/checkpoints/{checkpoint_id}/resolve", response_model=CheckpointRead)
async def resolve_checkpoint(
    checkpoint_id: str,
    data: CheckpointResolve,
    db: AsyncSession = Depends(get_db),
):
    from app.services.checkpoint_service import resolve_checkpoint as resolve_cp

    checkpoint = await resolve_cp(checkpoint_id, data.resolution, data.user_input, db)
    if not checkpoint:
        raise HTTPException(status_code=404, detail=f"Checkpoint {checkpoint_id} not found")
    return checkpoint
