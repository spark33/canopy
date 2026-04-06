from datetime import datetime, timezone

import structlog
from sqlalchemy import select

from app.database import async_session
from app.models import Artifact, ArtifactVersion

log = structlog.get_logger()


async def create_artifact(project_id: str, title: str, content_type: str = "markdown") -> Artifact:
    async with async_session() as db:
        artifact = Artifact(
            project_id=project_id,
            title=title,
            content_type=content_type,
            content="",
            version=0,
            sections=[],
        )
        db.add(artifact)
        await db.commit()
        await db.refresh(artifact)
        return artifact


async def update_artifact(
    project_id: str,
    sprint_id: str,
    new_content: str,
    change_summary: str,
    title: str | None = None,
    sections: list | None = None,
) -> Artifact | None:
    async with async_session() as db:
        result = await db.execute(select(Artifact).where(Artifact.project_id == project_id))
        artifact = result.scalar_one_or_none()

        if not artifact:
            artifact = Artifact(
                project_id=project_id,
                title=title or "Untitled",
                content_type="markdown",
                content="",
                version=0,
                sections=[],
            )
            db.add(artifact)
            await db.flush()

        artifact.version += 1
        artifact.content = new_content
        artifact.updated_at = datetime.now(timezone.utc)
        if title:
            artifact.title = title
        if sections is not None:
            artifact.sections = sections

        version = ArtifactVersion(
            artifact_id=artifact.id,
            sprint_id=sprint_id,
            version=artifact.version,
            content=new_content,
            change_summary=change_summary,
        )
        db.add(version)
        await db.commit()
        await db.refresh(artifact)

        from app.api.websocket import broadcast
        from app.services.trace_service import log_event

        # Find sprint_id for broadcasting
        await broadcast(sprint_id, "artifact_updated", {
            "version": artifact.version,
            "content": new_content,
            "change_summary": change_summary,
        })

        await log_event(
            sprint_id=sprint_id,
            event_type="artifact_updated",
            source_type="system",
            payload={"version": artifact.version, "change_summary": change_summary},
        )

        return artifact


async def get_artifact(project_id: str) -> Artifact | None:
    async with async_session() as db:
        result = await db.execute(select(Artifact).where(Artifact.project_id == project_id))
        return result.scalar_one_or_none()
