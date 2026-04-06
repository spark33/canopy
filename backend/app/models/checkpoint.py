import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Checkpoint(Base):
    __tablename__ = "checkpoints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sprint_id: Mapped[str] = mapped_column(String(36), ForeignKey("sprints.id"), index=True)
    task_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("tasks.id"), nullable=True)
    checkpoint_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    options: Mapped[list | None] = mapped_column(JSON, nullable=True)
    context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    resolution: Mapped[str | None] = mapped_column(String(100), nullable=True)
    user_input: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)
    surfaced_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[datetime | None] = mapped_column(nullable=True)

    sprint: Mapped["Sprint"] = relationship(back_populates="checkpoints")  # noqa: F821
    task: Mapped["Task | None"] = relationship()
