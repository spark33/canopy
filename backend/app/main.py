from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.models import Base

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.dev.ConsoleRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting AgentOps backend")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()
    log.info("AgentOps backend stopped")


app = FastAPI(title="AgentOps", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import checkpoints, projects, sprints, tasks, websocket  # noqa: E402

app.include_router(projects.router, prefix="/api/v1")
app.include_router(sprints.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(checkpoints.router, prefix="/api/v1")
app.include_router(websocket.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
