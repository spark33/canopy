# AgentOps

Multi-agent orchestration platform with adaptive autonomy and full execution observability.

> Build multi-step AI workflows where agents plan, execute, and surface decisions to you only when it matters.

## Quick Start

```bash
# Clone and setup
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Backend
cd backend
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

See [docs/PROMPT_PLAYBOOK.md](docs/PROMPT_PLAYBOOK.md) for the Claude Code generation prompts.

## License

MIT
