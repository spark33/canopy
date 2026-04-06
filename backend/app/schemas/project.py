from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    autonomy_mode: str = "adaptive"


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    autonomy_mode: str | None = None


class ArtifactBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    content: str | None = None
    version: int
    sections: list | None = None


class SprintBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sprint_number: int
    goal: str
    status: str
    started_at: datetime | None = None
    completed_at: datetime | None = None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str | None = None
    roadmap: dict | None = None
    status: str
    orchestrator_context: dict | None = None
    autonomy_mode: str
    artifact: ArtifactBrief | None = None
    sprints: list[SprintBrief] = []
    created_at: datetime
    updated_at: datetime
