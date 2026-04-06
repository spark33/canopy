# AgentOps

Multi-agent orchestration platform with adaptive autonomy and full execution observability.

> Build multi-step AI workflows where agents plan, execute, and surface decisions to you only when it matters.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and set the required variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | **Yes** | Your Anthropic API key (`sk-ant-...`). Required for the orchestrator and all agents. |
| `DATABASE_URL` | No | Database connection string. Defaults to `sqlite+aiosqlite:///./agentops.db` (local SQLite file). |
| `HOST` | No | Backend host. Defaults to `0.0.0.0`. |
| `PORT` | No | Backend port. Defaults to `8000`. |
| `LOG_LEVEL` | No | Logging level. Defaults to `INFO`. |
| `BRAVE_SEARCH_API_KEY` | No | [Brave Search API](https://api.search.brave.com) key for the researcher agent's web search tool. Without this, search returns mock results. |
| `NEXT_PUBLIC_API_URL` | No | Frontend API base URL. Defaults to `http://localhost:8000/api/v1`. |
| `NEXT_PUBLIC_WS_URL` | No | Frontend WebSocket URL. Defaults to `ws://localhost:8000/ws`. |

### 2. Install and run the backend

```bash
cd backend
pip install -e ".[dev]"
python scripts/seed.py        # Optional: load demo data
uvicorn app.main:app --reload --port 8000
```

### 3. Install and run the frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

Go to [http://localhost:3000](http://localhost:3000)

If you ran the seed script, you'll see a pre-populated "AI Code Editor Landscape" project with a completed sprint, full trace history, and a synthesized competitive analysis document.

## Architecture

```
Frontend (Next.js)  ──REST + WebSocket──>  Backend (FastAPI)
                                              │
                               ┌──────────────┼──────────────┐
                               │              │              │
                          Orchestration   Execution     Observability
                          (LLM planning)  (Agents)     (Trace events)
                               │              │              │
                               └──────────────┼──────────────┘
                                              │
                                        Claude API
```

**Orchestration layer** — Two LLM-driven orchestrators (project + sprint) that plan, delegate, and replan based on results. The sprint orchestrator runs a recursive loop: build context, call Claude for a JSON decision, execute, log, repeat.

**Execution layer** — Specialist agents (researcher, fact checker, synthesizer) each with their own system prompt and tool set. Agents make one-shot Claude API calls with tool use for web search and page fetching.

**Observability layer** — Every decision, tool call, and state change is logged as an immutable trace event. The full execution history is viewable in the Trace tab.

**Adaptive autonomy** — The orchestrator always reports a confidence score. The autonomy mode sets a threshold:
- **Supervised** (threshold 1.0) — always asks before proceeding
- **Adaptive** (threshold 0.6) — asks when confidence drops below 0.6
- **Autonomous** (threshold 0.1) — asks only on critical failures

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design.

## Usage

1. **Create a project** — Give it a name and description (e.g., "AI Code Editor Landscape")
2. **Start a sprint** — Define a goal (e.g., "Research pricing and features for Cursor, Windsurf, and Copilot")
3. **Watch the dashboard** — See the orchestrator plan tasks, agents execute, and results stream in
4. **Resolve checkpoints** — When the orchestrator finds conflicting data or low confidence, it surfaces a decision card
5. **Review the artifact** — Switch to the Output tab to see the synthesized document
6. **Inspect the trace** — The Trace tab shows every orchestrator decision, tool call, and state change

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, SQLAlchemy (async), SQLite/PostgreSQL |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) with tool use |
| Real-time | WebSockets via FastAPI |
| Testing | pytest (backend) |

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response types
│   │   ├── api/                 # REST routes + WebSocket
│   │   ├── services/            # Orchestrators, agent runner, trace/checkpoint/artifact services
│   │   ├── agents/              # Base agent, researcher, fact checker, synthesizer, tools
│   │   └── prompts/             # System prompts (plain text)
│   ├── tests/                   # pytest test suite
│   └── scripts/seed.py          # Demo data seeder
├── frontend/
│   └── src/
│       ├── app/                 # Next.js pages (projects, sprints, settings)
│       ├── components/          # UI primitives, layout, sprint, project components
│       ├── hooks/               # useWebSocket, useSprint, useProject
│       └── lib/                 # API client, types, utilities
├── docs/                        # Architecture, data model, API spec, design system
└── docker-compose.yml
```

## Dev Commands

```bash
make install          # Install backend + frontend dependencies
make backend          # Start backend (port 8000)
make frontend         # Start frontend (port 3000)
make test             # Run all tests
make seed             # Seed demo data
```

## License

MIT
