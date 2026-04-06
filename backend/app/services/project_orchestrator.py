import json
from pathlib import Path

import structlog
from anthropic import AsyncAnthropic
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import async_session
from app.models import Artifact, Project, Sprint

log = structlog.get_logger()


async def _call_project_orchestrator(context: str) -> dict | None:
    prompt_file = Path(__file__).parent.parent / "prompts" / "project_orchestrator.txt"
    system_prompt = prompt_file.read_text()

    client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    try:
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            temperature=0.3,
            system=system_prompt,
            messages=[{"role": "user", "content": context}],
        )

        text = ""
        for block in response.content:
            if block.type == "text":
                text += block.text

        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        return json.loads(text)
    except Exception as e:
        log.error("Project orchestrator LLM call failed", error=str(e))
        return None


async def initialize_project_roadmap(project_id: str):
    """Called when a project is created. Generates initial roadmap."""
    try:
        async with async_session() as db:
            result = await db.execute(select(Project).where(Project.id == project_id))
            project = result.scalar_one_or_none()
            if not project:
                return

            context = f"""Trigger: PROJECT_CREATED

Project Name: {project.name}
Description: {project.description or 'No description provided'}
"""

            response = await _call_project_orchestrator(context)
            if response:
                project.roadmap = response.get("roadmap", {})
                project.orchestrator_context = {
                    "suggested_first_sprint": response.get("suggested_first_sprint"),
                }

            # Create empty artifact
            artifact = Artifact(
                project_id=project_id,
                title=project.name,
                content_type="markdown",
                content="",
                version=0,
                sections=[],
            )
            db.add(artifact)
            await db.commit()

    except Exception as e:
        log.error("Failed to initialize project roadmap", project_id=project_id, error=str(e))


async def update_roadmap_after_sprint(project_id: str, sprint_id: str):
    """Called when a sprint completes. Updates project roadmap."""
    try:
        async with async_session() as db:
            result = await db.execute(
                select(Project)
                .options(selectinload(Project.sprints), selectinload(Project.artifact))
                .where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()
            if not project:
                return

            result = await db.execute(
                select(Sprint).options(selectinload(Sprint.tasks)).where(Sprint.id == sprint_id)
            )
            sprint = result.scalar_one_or_none()
            if not sprint:
                return

            # Build sprint summary
            task_summaries = []
            for t in sprint.tasks:
                if t.status == "completed":
                    task_summaries.append(f"- {t.title} ({t.agent_type}): confidence {t.confidence}")

            context = f"""Trigger: SPRINT_COMPLETED

Project Name: {project.name}
Description: {project.description or 'N/A'}

Current Roadmap: {json.dumps(project.roadmap or {})}

Sprint {sprint.sprint_number} Summary:
Goal: {sprint.goal}
Status: {sprint.status}
Tasks completed:
{chr(10).join(task_summaries) if task_summaries else 'None'}

Current Artifact: {project.artifact.title if project.artifact else 'None'} (version {project.artifact.version if project.artifact else 0})
"""

            response = await _call_project_orchestrator(context)
            if response:
                roadmap_update = response.get("roadmap_update", {})
                current_roadmap = project.roadmap or {}
                current_roadmap.update(roadmap_update)
                project.roadmap = current_roadmap

            await db.commit()

    except Exception as e:
        log.error("Failed to update roadmap", project_id=project_id, error=str(e))


async def suggest_next_sprint(project_id: str) -> dict | None:
    """Called when user wants a new sprint. Returns suggestion."""
    try:
        async with async_session() as db:
            result = await db.execute(
                select(Project)
                .options(selectinload(Project.sprints), selectinload(Project.artifact))
                .where(Project.id == project_id)
            )
            project = result.scalar_one_or_none()
            if not project:
                return None

            sprint_summaries = []
            for s in project.sprints:
                if s.status == "completed":
                    sprint_summaries.append(f"Sprint {s.sprint_number}: {s.goal} [{s.status}]")

            context = f"""Trigger: NEW_SPRINT_REQUESTED

Project Name: {project.name}
Description: {project.description or 'N/A'}

Current Roadmap: {json.dumps(project.roadmap or {})}

Completed Sprints:
{chr(10).join(sprint_summaries) if sprint_summaries else 'None'}

Current Artifact: {project.artifact.title if project.artifact else 'None'} (version {project.artifact.version if project.artifact else 0})
"""

            return await _call_project_orchestrator(context)

    except Exception as e:
        log.error("Failed to suggest sprint", project_id=project_id, error=str(e))
        return None
