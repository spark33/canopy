import structlog
from sqlalchemy import select

from app.agents import get_agent
from app.api.websocket import broadcast
from app.database import async_session
from app.models import Source, Sprint, Task
from app.services.trace_service import log_event

log = structlog.get_logger()


async def run_agent(sprint_id: str, task_id: str, agent_type: str, task_prompt: str) -> Task:
    """Run an agent for a task and update the task with results."""
    async with async_session() as db:
        result = await db.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one()
        task.status = "running"
        task.input_prompt = task_prompt
        await db.commit()

    await broadcast(sprint_id, "task_started", {
        "task_id": task_id,
        "title": task.title,
        "agent_type": agent_type,
    })

    await log_event(
        sprint_id=sprint_id,
        event_type="task_started",
        source_type="system",
        task_id=task_id,
        payload={"agent_type": agent_type, "title": task.title},
    )

    try:
        agent = get_agent(agent_type)
        agent_result = await agent.run(task_prompt, sprint_id=sprint_id, task_id=task_id)

        async with async_session() as db:
            result = await db.execute(select(Task).where(Task.id == task_id))
            task = result.scalar_one()
            task.status = "completed"
            task.output = agent_result.output
            task.confidence = agent_result.confidence
            task.tokens_used = agent_result.tokens_used
            task.duration_ms = agent_result.duration_ms

            # Create source records
            for source_data in agent_result.sources:
                source = Source(
                    task_id=task_id,
                    url=source_data.get("url", ""),
                    title=source_data.get("title"),
                    snippet=source_data.get("snippet"),
                    source_type="webpage",
                    relevance_score=0.8,
                )
                db.add(source)

            # Update sprint token count
            sprint_result = await db.execute(select(Sprint).where(Sprint.id == sprint_id))
            sprint = sprint_result.scalar_one()
            sprint.total_tokens += agent_result.tokens_used
            # Rough cost estimate: $3/M input tokens, $15/M output tokens -> average ~$6/M
            sprint.total_cost_cents += max(1, agent_result.tokens_used * 6 // 10000)

            await db.commit()
            await db.refresh(task)

        await broadcast(sprint_id, "task_completed", {
            "task_id": task_id,
            "title": task.title,
            "agent_type": agent_type,
            "output": task.output,
            "confidence": task.confidence,
            "tokens_used": task.tokens_used,
            "duration_ms": task.duration_ms,
            "status": "completed",
        })

        await log_event(
            sprint_id=sprint_id,
            event_type="task_completed",
            source_type="agent",
            task_id=task_id,
            token_count=agent_result.tokens_used,
            payload={"confidence": agent_result.confidence, "sources_count": len(agent_result.sources)},
        )

        return task

    except Exception as e:
        log.error("Agent execution failed", task_id=task_id, error=str(e))

        async with async_session() as db:
            result = await db.execute(select(Task).where(Task.id == task_id))
            task = result.scalar_one()
            task.status = "failed"
            task.error_message = str(e)
            await db.commit()

        await broadcast(sprint_id, "task_failed", {
            "task_id": task_id,
            "error": str(e),
        })

        await log_event(
            sprint_id=sprint_id,
            event_type="task_failed",
            source_type="system",
            task_id=task_id,
            payload={"error": str(e)},
        )

        raise
