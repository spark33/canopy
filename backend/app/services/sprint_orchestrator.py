import asyncio
import json
from datetime import datetime, timezone

import structlog
from anthropic import AsyncAnthropic
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.websocket import broadcast
from app.config import settings
from app.database import async_session
from app.models import Checkpoint, Project, Sprint, Task
from app.services.trace_service import log_event

log = structlog.get_logger()

AUTONOMY_THRESHOLDS = {
    "supervised": 1.0,
    "adaptive": 0.6,
    "autonomous": 0.1,
}


async def run_sprint(sprint_id: str):
    """Main orchestrator loop for a sprint."""
    log.info("Starting sprint orchestrator", sprint_id=sprint_id)

    try:
        async with async_session() as db:
            result = await db.execute(
                select(Sprint).options(selectinload(Sprint.tasks)).where(Sprint.id == sprint_id)
            )
            sprint = result.scalar_one()
            sprint.status = "running"
            await db.commit()

        await broadcast(sprint_id, "sprint_status", {"status": "running"})
        await log_event(sprint_id=sprint_id, event_type="sprint_started", source_type="system", payload={})

        max_cycles = 50  # Safety limit
        cycle = 0

        while cycle < max_cycles:
            cycle += 1

            # Load fresh state
            async with async_session() as db:
                result = await db.execute(
                    select(Sprint)
                    .options(selectinload(Sprint.tasks), selectinload(Sprint.checkpoints))
                    .where(Sprint.id == sprint_id)
                )
                sprint = result.scalar_one()

                if sprint.status in ("completed", "failed", "cancelled"):
                    break

                result = await db.execute(select(Project).where(Project.id == sprint.project_id))
                project = result.scalar_one()

            await broadcast(sprint_id, "orchestrator_thinking", {
                "cycle": cycle,
                "message": f"Evaluating state (cycle {cycle})...",
            })

            # Build context and call LLM
            context = await _build_context(sprint, project)
            decision = await _call_orchestrator_llm(context)

            if not decision:
                log.error("Failed to get orchestrator decision", sprint_id=sprint_id)
                break

            await log_event(
                sprint_id=sprint_id,
                event_type="orchestrator_decision",
                source_type="orchestrator",
                payload=decision,
            )

            await broadcast(sprint_id, "orchestrator_decision", {
                "action": decision.get("action"),
                "confidence": decision.get("confidence"),
                "reasoning": decision.get("reasoning"),
            })

            # Apply confidence threshold
            confidence = decision.get("confidence", 1.0)
            threshold = AUTONOMY_THRESHOLDS.get(sprint.autonomy_mode, 0.6)

            if confidence < threshold and decision.get("action") != "ask_user":
                decision = _force_checkpoint(decision)

            action = decision.get("action")

            if action == "delegate":
                await _handle_delegate(sprint_id, sprint, decision)

            elif action == "ask_user":
                await _handle_ask_user(sprint_id, decision)

            elif action == "synthesize":
                await _handle_synthesize(sprint_id, sprint, project, decision)

            elif action == "replan":
                await _handle_replan(sprint_id, decision)

            elif action == "complete":
                await _handle_complete(sprint_id, sprint, project, decision)
                return

            # Update cycle count
            async with async_session() as db:
                result = await db.execute(select(Sprint).where(Sprint.id == sprint_id))
                s = result.scalar_one()
                state = s.orchestrator_state or {}
                state["cycle_count"] = cycle
                state["current_confidence"] = confidence
                s.orchestrator_state = state
                await db.commit()

        log.warning("Sprint orchestrator hit max cycles", sprint_id=sprint_id, cycles=max_cycles)

    except Exception as e:
        log.error("Sprint orchestrator failed", sprint_id=sprint_id, error=str(e))
        async with async_session() as db:
            result = await db.execute(select(Sprint).where(Sprint.id == sprint_id))
            sprint = result.scalar_one()
            sprint.status = "failed"
            await db.commit()

        await broadcast(sprint_id, "error", {"message": str(e), "recoverable": False})
        await log_event(sprint_id=sprint_id, event_type="sprint_failed", source_type="system", payload={"error": str(e)})


async def _build_context(sprint: Sprint, project: Project) -> str:
    """Assemble the orchestrator context string."""
    parts = [
        f"## Sprint Goal\n{sprint.goal}\n",
        f"## Project\nName: {project.name}\nDescription: {project.description or 'N/A'}\n",
    ]

    # Current plan
    if sprint.plan:
        parts.append("## Current Plan")
        for step in sprint.plan:
            parts.append(f"  Step {step.get('step_number', '?')}: {step.get('title', 'Untitled')} [{step.get('status', 'pending')}] (agent: {step.get('agent_type', 'N/A')})")
        parts.append("")

    # Task outputs (summarized)
    completed_tasks = [t for t in sprint.tasks if t.status == "completed"]
    if completed_tasks:
        parts.append("## Completed Task Outputs")
        for task in completed_tasks:
            output = task.output or ""
            if len(output) > 2000:
                output = output[:2000] + "... [truncated]"
            parts.append(f"### {task.title} ({task.agent_type})\nConfidence: {task.confidence}\n{output}\n")

    # Running tasks
    running_tasks = [t for t in sprint.tasks if t.status == "running"]
    if running_tasks:
        parts.append("## Currently Running Tasks")
        for task in running_tasks:
            parts.append(f"- {task.title} ({task.agent_type})")
        parts.append("")

    # Checkpoint resolutions
    resolved_checkpoints = [c for c in sprint.checkpoints if c.status == "resolved"]
    if resolved_checkpoints:
        parts.append("## User Decisions")
        for cp in resolved_checkpoints:
            parts.append(f"- {cp.title}: User chose '{cp.resolution}'" + (f" — {cp.user_input}" if cp.user_input else ""))
        parts.append("")

    # Pending checkpoints
    pending_checkpoints = [c for c in sprint.checkpoints if c.status == "pending"]
    if pending_checkpoints:
        parts.append("## Pending Checkpoints (awaiting user)")
        for cp in pending_checkpoints:
            parts.append(f"- {cp.title}")
        parts.append("")

    # Project artifact summary
    if project.artifact and project.artifact.content:
        parts.append(f"## Current Artifact\nTitle: {project.artifact.title}\nVersion: {project.artifact.version}\nSections: {json.dumps(project.artifact.sections or [])}\n")

    return "\n".join(parts)


async def _call_orchestrator_llm(context: str) -> dict | None:
    """Call Claude with the sprint orchestrator prompt."""
    from pathlib import Path

    prompt_file = Path(__file__).parent.parent / "prompts" / "sprint_orchestrator.txt"
    system_prompt = prompt_file.read_text()

    client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    for attempt in range(2):
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

            # Extract JSON from response
            text = text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

            return json.loads(text)

        except (json.JSONDecodeError, Exception) as e:
            log.warning("Orchestrator LLM parse failed", attempt=attempt, error=str(e))
            if attempt == 1:
                return None

    return None


def _force_checkpoint(decision: dict) -> dict:
    """Convert a low-confidence decision into a checkpoint."""
    return {
        "action": "ask_user",
        "confidence": decision.get("confidence", 0.5),
        "reasoning": f"Low confidence ({decision.get('confidence', 0.5)}) — requesting user guidance. Original plan: {decision.get('reasoning', 'N/A')}",
        "checkpoint_type": "low_confidence",
        "title": "Orchestrator needs guidance",
        "description": f"The orchestrator wanted to '{decision.get('action')}' but confidence is low. Reasoning: {decision.get('reasoning', 'N/A')}",
        "options": [
            {"id": "proceed", "label": "Proceed anyway", "primary": True},
            {"id": "modify", "label": "Let me adjust the approach"},
            {"id": "cancel", "label": "Cancel this sprint"},
        ],
        "context": {"original_decision": decision},
    }


async def _handle_delegate(sprint_id: str, sprint: Sprint, decision: dict):
    """Handle a delegate action from the orchestrator."""
    from app.services.agent_runner import run_agent

    agent_type = decision.get("agent_type", "researcher")
    task_title = decision.get("task_title", "Untitled task")
    task_prompt = decision.get("task_prompt", "")
    parallel_group = decision.get("parallel_group")

    # Create the task
    async with async_session() as db:
        task = Task(
            sprint_id=sprint_id,
            agent_type=agent_type,
            title=task_title,
            status="pending",
        )
        db.add(task)
        await db.flush()

        # Update plan
        result = await db.execute(select(Sprint).where(Sprint.id == sprint_id))
        s = result.scalar_one()
        plan = s.plan or []
        step_number = len(plan) + 1
        plan.append({
            "step_number": step_number,
            "title": task_title,
            "agent_type": agent_type,
            "status": "running",
            "task_id": task.id,
            "depends_on": decision.get("depends_on", []),
            "parallel_group": parallel_group,
        })
        s.plan = plan
        task_id = task.id
        await db.commit()

    await broadcast(sprint_id, "plan_updated", {"plan": plan})

    # Run the agent
    await run_agent(sprint_id, task_id, agent_type, task_prompt)

    # Update plan step status
    async with async_session() as db:
        result = await db.execute(select(Sprint).where(Sprint.id == sprint_id))
        s = result.scalar_one()
        plan = s.plan or []
        for step in plan:
            if step.get("task_id") == task_id:
                step["status"] = "completed"
        s.plan = plan
        await db.commit()

    await broadcast(sprint_id, "plan_updated", {"plan": plan})


async def _handle_ask_user(sprint_id: str, decision: dict):
    """Handle an ask_user action — surface a checkpoint and wait."""
    from app.services.checkpoint_service import create_checkpoint, get_checkpoint_event

    checkpoint = await create_checkpoint(
        sprint_id=sprint_id,
        task_id=None,
        checkpoint_type=decision.get("checkpoint_type", "user_review"),
        title=decision.get("title", "Checkpoint"),
        description=decision.get("description", ""),
        options=decision.get("options", []),
        context=decision.get("context"),
    )

    # Wait for resolution
    event = get_checkpoint_event(checkpoint.id)
    await event.wait()


async def _handle_synthesize(sprint_id: str, sprint: Sprint, project: Project, decision: dict):
    """Handle a synthesize action — run the synthesizer and update artifact."""
    from app.services.agent_runner import run_agent
    from app.services.artifact_service import update_artifact

    task_title = decision.get("task_title", "Synthesize document")
    task_prompt = decision.get("task_prompt", "")
    artifact_title = decision.get("artifact_title", project.name)

    # Create the synthesis task
    async with async_session() as db:
        task = Task(
            sprint_id=sprint_id,
            agent_type="synthesizer",
            title=task_title,
            status="pending",
        )
        db.add(task)
        await db.flush()

        # Update plan
        result = await db.execute(select(Sprint).where(Sprint.id == sprint_id))
        s = result.scalar_one()
        plan = s.plan or []
        plan.append({
            "step_number": len(plan) + 1,
            "title": task_title,
            "agent_type": "synthesizer",
            "status": "running",
            "task_id": task.id,
        })
        s.plan = plan
        s.status = "synthesizing"
        task_id = task.id
        await db.commit()

    await broadcast(sprint_id, "plan_updated", {"plan": plan})
    await broadcast(sprint_id, "sprint_status", {"status": "synthesizing"})

    # Run synthesizer
    await run_agent(sprint_id, task_id, "synthesizer", task_prompt)

    # Get the output and update artifact
    async with async_session() as db:
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one()

        if task.output:
            await update_artifact(
                project_id=sprint.project_id,
                sprint_id=sprint_id,
                new_content=task.output,
                change_summary=f"Sprint {sprint.sprint_number}: {task_title}",
                title=artifact_title,
            )

        # Update plan step
        result = await db.execute(select(Sprint).where(Sprint.id == sprint_id))
        s = result.scalar_one()
        plan = s.plan or []
        for step in plan:
            if step.get("task_id") == task_id:
                step["status"] = "completed"
        s.plan = plan
        await db.commit()


async def _handle_replan(sprint_id: str, decision: dict):
    """Handle a replan action — update the sprint plan."""
    async with async_session() as db:
        result = await db.execute(select(Sprint).where(Sprint.id == sprint_id))
        sprint = result.scalar_one()
        sprint.plan = decision.get("updated_plan", [])
        await db.commit()

    await broadcast(sprint_id, "plan_updated", {"plan": decision.get("updated_plan", [])})
    await log_event(
        sprint_id=sprint_id,
        event_type="plan_updated",
        source_type="orchestrator",
        payload={"reason": decision.get("plan_change_reason", ""), "plan": decision.get("updated_plan")},
    )


async def _handle_complete(sprint_id: str, sprint: Sprint, project: Project, decision: dict):
    """Handle a complete action — finalize the sprint."""
    async with async_session() as db:
        result = await db.execute(select(Sprint).where(Sprint.id == sprint_id))
        s = result.scalar_one()
        s.status = "completed"
        s.completed_at = datetime.now(timezone.utc)
        await db.commit()

    summary = decision.get("summary", "Sprint completed")

    await broadcast(sprint_id, "sprint_completed", {
        "summary": summary,
        "total_tokens": sprint.total_tokens,
        "total_cost_cents": sprint.total_cost_cents,
    })

    await log_event(
        sprint_id=sprint_id,
        event_type="sprint_completed",
        source_type="system",
        payload={"summary": summary},
    )

    # Update project roadmap
    from app.services.project_orchestrator import update_roadmap_after_sprint

    asyncio.create_task(update_roadmap_after_sprint(project.id, sprint_id))
