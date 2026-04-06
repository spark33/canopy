import json

import structlog
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import async_session
from app.models import Sprint

log = structlog.get_logger()

router = APIRouter()

# Connection registry: sprint_id -> set of WebSocket connections
_connections: dict[str, set[WebSocket]] = {}


async def broadcast(sprint_id: str, event_type: str, data: dict):
    """Broadcast a message to all WebSocket connections for a sprint."""
    connections = _connections.get(sprint_id, set())
    message = json.dumps({"type": event_type, "data": data})
    disconnected = set()
    for ws in connections:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.add(ws)
    for ws in disconnected:
        connections.discard(ws)


@router.websocket("/ws/sprints/{sprint_id}")
async def sprint_websocket(websocket: WebSocket, sprint_id: str):
    await websocket.accept()

    if sprint_id not in _connections:
        _connections[sprint_id] = set()
    _connections[sprint_id].add(websocket)

    log.info("WebSocket connected", sprint_id=sprint_id)

    # Send current state on connect
    try:
        async with async_session() as db:
            result = await db.execute(
                select(Sprint)
                .options(selectinload(Sprint.tasks), selectinload(Sprint.checkpoints))
                .where(Sprint.id == sprint_id)
            )
            sprint = result.scalar_one_or_none()
            if sprint:
                await websocket.send_text(json.dumps({
                    "type": "sprint_status",
                    "data": {
                        "status": sprint.status,
                        "plan": sprint.plan,
                        "total_tokens": sprint.total_tokens,
                        "total_cost_cents": sprint.total_cost_cents,
                    },
                }))
    except Exception as e:
        log.error("Error sending initial state", error=str(e))

    try:
        while True:
            text = await websocket.receive_text()
            msg = json.loads(text)

            if msg.get("type") == "user_input":
                from app.services.trace_service import log_event

                await log_event(
                    sprint_id=sprint_id,
                    event_type="user_input",
                    source_type="user",
                    payload={"content": msg.get("content", ""), "references": msg.get("references", [])},
                )

            elif msg.get("type") == "resolve_checkpoint":
                from app.services.checkpoint_service import resolve_checkpoint

                async with async_session() as db:
                    await resolve_checkpoint(
                        msg["checkpoint_id"],
                        msg["resolution"],
                        msg.get("user_input"),
                        db,
                    )
                    await db.commit()

    except WebSocketDisconnect:
        log.info("WebSocket disconnected", sprint_id=sprint_id)
    except Exception as e:
        log.error("WebSocket error", error=str(e))
    finally:
        _connections.get(sprint_id, set()).discard(websocket)
