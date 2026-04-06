import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Sprint(Base):
    __tablename__ = "sprints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    sprint_number: Mapped[int] = mapped_column(Integer, nullable=False)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="planning", index=True)
    autonomy_mode: Mapped[str] = mapped_column(String(20), default="adaptive")
    plan: Mapped[list | None] = mapped_column(JSON, nullable=True)
    orchestrator_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_cost_cents: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime | None] = mapped_column(nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))

    project: Mapped["Project"] = relationship(back_populates="sprints")  # noqa: F821
    tasks: Mapped[list["Task"]] = relationship(back_populates="sprint", cascade="all, delete-orphan")  # noqa: F821
    trace_events: Mapped[list["TraceEvent"]] = relationship(back_populates="sprint", cascade="all, delete-orphan")  # noqa: F821
    checkpoints: Mapped[list["Checkpoint"]] = relationship(back_populates="sprint", cascade="all, delete-orphan")  # noqa: F821
