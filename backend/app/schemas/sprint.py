from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SprintCreate(BaseModel):
    goal: str
    autonomy_mode: str | None = None


class SprintUpdate(BaseModel):
    status: str | None = None
    autonomy_mode: str | None = None


class TaskBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    agent_type: str
    title: str
    status: str
    confidence: float | None = None
    tokens_used: int | None = None
    duration_ms: int | None = None
    output: str | None = None


class CheckpointBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    checkpoint_type: str
    title: str
    description: str | None = None
    options: list | None = None
    context: dict | None = None
    status: str
    resolution: str | None = None
    user_input: str | None = None
    surfaced_at: datetime
    resolved_at: datetime | None = None


class SprintRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    sprint_number: int
    goal: str
    status: str
    autonomy_mode: str
    plan: list | None = None
    orchestrator_state: dict | None = None
    total_tokens: int
    total_cost_cents: int
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime
    tasks: list[TaskBrief] = []
    checkpoints: list[CheckpointBrief] = []
