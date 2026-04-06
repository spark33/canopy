import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sprint_id: Mapped[str] = mapped_column(String(36), ForeignKey("sprints.id", ondelete="CASCADE"), index=True)
    parent_task_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("tasks.id"), nullable=True)
    agent_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)
    agent_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    input_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    output: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_structured: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    sprint: Mapped["Sprint"] = relationship(back_populates="tasks")  # noqa: F821
    parent_task: Mapped["Task | None"] = relationship(remote_side="Task.id")
    trace_events: Mapped[list["TraceEvent"]] = relationship(back_populates="task", cascade="all, delete-orphan")  # noqa: F821
    sources: Mapped[list["Source"]] = relationship(back_populates="task", cascade="all, delete-orphan")  # noqa: F821
