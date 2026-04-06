from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: str
    title: str | None = None
    source_type: str
    snippet: str | None = None
    relevance_score: float | None = None
    fetched_at: datetime


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sprint_id: str
    parent_task_id: str | None = None
    agent_type: str
    title: str
    status: str
    input_prompt: str | None = None
    output: str | None = None
    output_structured: dict | None = None
    confidence: float | None = None
    tokens_used: int | None = None
    duration_ms: int | None = None
    error_message: str | None = None
    created_at: datetime
    sources: list[SourceRead] = []
