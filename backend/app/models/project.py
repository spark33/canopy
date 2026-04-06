import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    roadmap: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    orchestrator_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    autonomy_mode: Mapped[str] = mapped_column(String(20), default="adaptive")
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    sprints: Mapped[list["Sprint"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # noqa: F821
    artifact: Mapped["Artifact | None"] = relationship(back_populates="project", uselist=False, cascade="all, delete-orphan")  # noqa: F821
