from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CheckpointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sprint_id: str
    task_id: str | None = None
    checkpoint_type: str
    title: str
    description: str | None = None
    options: list | None = None
    context: dict | None = None
    resolution: str | None = None
    user_input: str | None = None
    status: str
    surfaced_at: datetime
    resolved_at: datetime | None = None


class CheckpointResolve(BaseModel):
    resolution: str
    user_input: str | None = None


class UserInput(BaseModel):
    content: str
    references: list[str] = []


class TraceEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sprint_id: str
    task_id: str | None = None
    event_type: str
    source_type: str
    payload: dict | None = None
    token_count: int | None = None
    created_at: datetime
