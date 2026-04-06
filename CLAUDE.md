# AgentOps — Multi-Agent Orchestration Platform

## What is this?

AgentOps is a multi-agent orchestration platform with adaptive autonomy and full execution observability. Users create **projects**, run **sprints** within them (each sprint is an orchestrated multi-agent workflow), and produce evolving **artifacts** (documents, reports, analyses). The system features a persistent orchestrator loop that plans, delegates to specialist agents, observes results, and replans — surfacing human checkpoints only when confidence drops below a threshold.

## Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy (async), SQLite (dev) / PostgreSQL (prod)
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514) with tool use
- **Real-time**: WebSockets via FastAPI for live sprint updates
- **Testing**: pytest (backend), vitest (frontend)

## Project Structure

```
agentops/
├── CLAUDE.md                    # This file
├── README.md                    # Setup instructions + architecture overview
├── docs/
│   ├── ARCHITECTURE.md          # Detailed system architecture
│   ├── DATA_MODEL.md            # Database schema + relationships
│   ├── API_SPEC.md              # REST + WebSocket API specification
│   ├── ORCHESTRATOR.md          # Orchestrator loop design + prompts
│   ├── AGENT_DEFINITIONS.md     # Specialist agent configs + tools
│   ├── UI_DESIGN_SYSTEM.md      # Visual specs, color system, component patterns
│   └── prototypes/              # HTML reference prototypes (open in browser)
│       ├── prototype-a-task-dashboard.html  # PRIMARY — dashboard layout
│       ├── prototype-b-canvas.html          # Dark canvas view (reference only)
│       └── prototype-c-document.html        # Document-first view (Output tab ref)
├── backend/
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings + env vars
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── project.py
│   │   │   ├── sprint.py
│   │   │   ├── task.py
│   │   │   ├── trace_event.py
│   │   │   ├── checkpoint.py
│   │   │   ├── artifact.py
│   │   │   └── source.py
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── project.py
│   │   │   ├── sprint.py
│   │   │   ├── task.py
│   │   │   └── checkpoint.py
│   │   ├── api/                 # Route handlers
│   │   │   ├── __init__.py
│   │   │   ├── projects.py
│   │   │   ├── sprints.py
│   │   │   ├── tasks.py
│   │   │   ├── checkpoints.py
│   │   │   └── websocket.py
│   │   ├── services/            # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── project_orchestrator.py   # Project-level planning
│   │   │   ├── sprint_orchestrator.py    # Sprint-level execution loop
│   │   │   ├── agent_runner.py           # Runs individual agents
│   │   │   ├── checkpoint_service.py     # Checkpoint lifecycle
│   │   │   ├── artifact_service.py       # Artifact versioning
│   │   │   └── trace_service.py          # Trace event logging
│   │   ├── agents/              # Agent definitions
│   │   │   ├── __init__.py
│   │   │   ├── base.py          # Base agent class
│   │   │   ├── researcher.py    # Web research agent
│   │   │   ├── fact_checker.py  # Cross-reference agent
│   │   │   ├── synthesizer.py   # Document synthesis agent
│   │   │   └── tools.py         # Tool definitions for agents
│   │   └── prompts/             # System prompts (text files)
│   │       ├── project_orchestrator.txt
│   │       ├── sprint_orchestrator.txt
│   │       ├── researcher.txt
│   │       ├── fact_checker.txt
│   │       └── synthesizer.txt
│   └── tests/
│       ├── conftest.py
│       ├── test_models.py
│       ├── test_orchestrator.py
│       ├── test_agents.py
│       └── test_api.py
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                          # Projects list
│   │   │   ├── projects/
│   │   │   │   ├── new/page.tsx                  # New project
│   │   │   │   └── [projectId]/
│   │   │   │       ├── page.tsx                  # Project view
│   │   │   │       └── sprints/
│   │   │   │           └── [sprintId]/
│   │   │   │               └── page.tsx          # Active sprint
│   │   │   └── settings/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                               # Primitives
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── Tabs.tsx
│   │   │   ├── project/
│   │   │   │   ├── ProjectCard.tsx
│   │   │   │   ├── ProjectHeader.tsx
│   │   │   │   ├── SprintHistory.tsx
│   │   │   │   └── ArtifactViewer.tsx
│   │   │   ├── sprint/
│   │   │   │   ├── SprintDashboard.tsx           # Main dashboard tab
│   │   │   │   ├── PlanSidebar.tsx               # Left: execution plan
│   │   │   │   ├── AgentCard.tsx                 # Individual agent output
│   │   │   │   ├── CheckpointCard.tsx            # Decision card
│   │   │   │   ├── SprintOutput.tsx              # Output/document tab
│   │   │   │   ├── SprintTrace.tsx               # Trace/timeline tab
│   │   │   │   ├── TraceEvent.tsx                # Single trace event
│   │   │   │   ├── StatsBar.tsx                  # Persistent stats
│   │   │   │   └── InputBar.tsx                  # Persistent input
│   │   │   └── layout/
│   │   │       ├── TopBar.tsx
│   │   │       └── Breadcrumb.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts                   # WS connection + state
│   │   │   ├── useProject.ts                     # Project CRUD
│   │   │   ├── useSprint.ts                      # Sprint state
│   │   │   └── useCheckpoint.ts                  # Checkpoint actions
│   │   ├── lib/
│   │   │   ├── api.ts                            # REST client
│   │   │   ├── types.ts                          # TypeScript types
│   │   │   └── utils.ts
│   │   └── styles/
│   │       └── globals.css
│   └── tests/
│       └── components/
├── .env.example
├── docker-compose.yml
└── Makefile
```

## Coding Conventions

### Backend (Python)
- Use `async/await` throughout — all DB operations, all API calls
- Type hints on all function signatures
- Pydantic models for all API request/response schemas
- SQLAlchemy 2.0 style (mapped_column, not Column)
- Keep services thin: orchestrator logic in services/, agent logic in agents/
- System prompts live in prompts/ as plain text files, loaded at runtime
- All trace events are fire-and-forget (don't await DB write in hot path)
- Structured logging with structlog

### Frontend (TypeScript/React)
- Functional components only, hooks for state
- Tailwind for styling, no CSS modules
- Collocate types with their components when specific, shared types in lib/types.ts
- WebSocket hook manages reconnection and optimistic updates
- Server components for data fetching, client components for interactivity
- Use React Server Components where possible (Next.js App Router)

### General
- No comments explaining obvious code
- Meaningful variable names over comments
- Error messages should be user-facing quality
- Git commits: imperative mood, scope prefix (e.g., "feat(orchestrator): add replan cycle")

## Key Design Decisions

1. **Orchestrator is an LLM call, not hardcoded logic.** Each cycle, the orchestrator receives full context and outputs a structured JSON decision. The backend parses and routes. This means the orchestrator can reason about novel situations rather than following a fixed state machine.

2. **Checkpoints are first-class entities, not just trace events.** They have a lifecycle (surfaced → awaiting → resolved) and are the primary UI interaction point. They get their own DB table, API endpoints, and component.

3. **Artifacts version across sprints, not within them.** Each sprint that modifies the artifact creates a new version. This keeps sprint-level changes atomic and diffable.

4. **Trace events are immutable and append-only.** Never update or delete a trace event. The trace is the source of truth for what happened.

5. **WebSocket for sprint execution, REST for everything else.** Creating a project, listing sprints, resolving checkpoints — all REST. Live sprint updates (agent progress, new trace events, checkpoint surfaced) — WebSocket.

6. **Adaptive autonomy is a confidence threshold, not a toggle.** The orchestrator always outputs a confidence score. The autonomy mode just shifts the threshold at which a checkpoint is surfaced vs. proceeding automatically.

## Dev Commands

```bash
# Backend
cd backend && pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install
npm run dev  # port 3000

# Tests
cd backend && pytest
cd frontend && npm test

# Database
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Environment Variables

See `.env.example` — the only required variable is `ANTHROPIC_API_KEY`. Everything else has sensible defaults for local development.
