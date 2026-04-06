# Architecture

## System Overview

AgentOps is structured as three layers: **orchestration** (the brain), **execution** (the hands), and **observability** (the eyes).

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                 │
│  Projects List → Project View → Active Sprint        │
│  [Dashboard Tab] [Output Tab] [Trace Tab]            │
└──────────┬───────────────────────────┬───────────────┘
           │ REST API                  │ WebSocket
┌──────────▼───────────────────────────▼───────────────┐
│                   Backend (FastAPI)                   │
│                                                      │
│  ┌─────────────────────────────────────────────┐     │
│  │            Orchestration Layer               │     │
│  │  Project Orchestrator ←→ Sprint Orchestrator │     │
│  │       (roadmap)              (plan/replan)   │     │
│  └──────────────┬──────────────────────────────┘     │
│                 │                                     │
│  ┌──────────────▼──────────────────────────────┐     │
│  │             Execution Layer                  │     │
│  │  Agent Runner → [Researcher, Fact Checker,   │     │
│  │                   Synthesizer, ...]          │     │
│  │  Each agent: system prompt + tools + LLM call│     │
│  └──────────────┬──────────────────────────────┘     │
│                 │                                     │
│  ┌──────────────▼──────────────────────────────┐     │
│  │           Observability Layer                │     │
│  │  Trace Service → SQLite/Postgres             │     │
│  │  Every event logged with run context         │     │
│  └─────────────────────────────────────────────┘     │
│                                                      │
│  Anthropic Claude API (claude-sonnet-4-20250514)     │
└──────────────────────────────────────────────────────┘
```

## Orchestrator Loop

The sprint orchestrator is a recursive loop. Each cycle:

1. **Build context**: Assemble the current state — original goal, current plan, all completed task outputs, all user decisions, the latest event.
2. **LLM call**: Send context to Claude with a system prompt that instructs it to output a structured JSON decision.
3. **Parse decision**: The response is one of:
   - `{"action": "delegate", "agent_type": "researcher", "task": {...}}` → spawn an agent
   - `{"action": "ask_user", "checkpoint": {...}}` → surface a checkpoint
   - `{"action": "synthesize", "instructions": "..."}` → produce/update the artifact
   - `{"action": "replan", "updated_plan": [...]}` → revise the plan, then continue
   - `{"action": "complete", "summary": "..."}` → sprint is done
4. **Execute**: Route the decision to the appropriate service.
5. **Log**: Write a trace event for the decision.
6. **Loop**: Go back to step 1 with the updated state.

The loop pauses (awaits) in two cases:
- An agent is running (async, resume when agent completes)
- A checkpoint is surfaced (await user response via REST endpoint)

### Confidence and Autonomy

The orchestrator's decision output always includes a `confidence` field (0.0–1.0). The autonomy mode sets a threshold:

| Mode        | Threshold | Behavior |
|-------------|-----------|----------|
| Supervised  | 1.0       | Always checkpoint before proceeding |
| Adaptive    | 0.6       | Checkpoint when confidence < 0.6 |
| Autonomous  | 0.1       | Checkpoint only on critical failures |

When `confidence < threshold`, the orchestrator is forced to output `ask_user` instead of proceeding. This is enforced in the sprint orchestrator service, not in the prompt — the prompt asks for honest confidence, the service applies the policy.

## Project Orchestrator vs Sprint Orchestrator

Two distinct orchestrator roles:

**Project Orchestrator** runs when:
- A new project is created (generates initial roadmap)
- A sprint completes (updates roadmap based on outcomes)
- The user requests a new sprint (suggests sprint goal based on roadmap gaps)

Its context includes: project description, full roadmap, all sprint summaries, the current artifact state.

**Sprint Orchestrator** runs continuously during an active sprint. Its context includes: sprint goal, current plan, all task outputs, all user decisions, inherited project context (artifact + roadmap).

The project orchestrator is stateless across calls — it reads the project's current state and produces an updated roadmap/suggestion. The sprint orchestrator is stateful within a sprint — it maintains an accumulating context window.

## Agent Architecture

Each specialist agent is:
- A system prompt (loaded from `prompts/`)
- A set of tool definitions (defined in `agents/tools.py`)
- A single Claude API call with tool use

Agents do NOT have multi-turn conversations with Claude. Each agent call is one-shot: system prompt + user message (the task description from the orchestrator) → response (possibly with tool calls that get resolved, then a final text output).

Tool calls within an agent ARE multi-turn — if the agent calls `web_search`, the tool result is appended and Claude continues. But the agent itself doesn't maintain conversation history across orchestrator cycles.

### Agent Types

| Agent       | Tools                          | Purpose |
|-------------|--------------------------------|---------|
| Researcher  | web_search, web_fetch          | Gather information from the web |
| Fact Checker | web_search, web_fetch         | Verify claims against sources |
| Synthesizer | (none — text generation only) | Produce/update the artifact document |

Additional agent types can be added by creating a new prompt file and tool set. The agent runner is generic — it takes an agent_type string, loads the corresponding prompt and tools, and executes.

## WebSocket Protocol

The frontend connects to `ws://localhost:8000/ws/sprints/{sprint_id}` when viewing an active sprint.

### Server → Client Events

```json
{"type": "sprint_status", "status": "running", "plan": [...]}
{"type": "task_started", "task": {...}}
{"type": "task_progress", "task_id": "...", "message": "Searching..."}
{"type": "task_completed", "task": {...}}
{"type": "checkpoint_surfaced", "checkpoint": {...}}
{"type": "checkpoint_resolved", "checkpoint": {...}}
{"type": "trace_event", "event": {...}}
{"type": "artifact_updated", "version": 3, "content": "..."}
{"type": "sprint_completed", "summary": "..."}
{"type": "orchestrator_thinking", "message": "Evaluating results..."}
```

### Client → Server Events

```json
{"type": "user_input", "content": "Also look at VS Code...", "references": []}
{"type": "resolve_checkpoint", "checkpoint_id": "...", "resolution": "use_acquired", "user_input": "..."}
```

Checkpoint resolution can also happen via REST POST to avoid WebSocket-only dependency.

## Data Flow Example

User creates project "AI Code Editors" → Project orchestrator generates roadmap → User starts Sprint 1 with goal "Initial research" → Sprint orchestrator plans 3 research tasks + cross-reference + synthesis → Researcher agents run in parallel → One finds conflicting data → Sprint orchestrator confidence drops to 0.3 → Checkpoint surfaced → User resolves → Orchestrator replans → Remaining agents complete → Synthesizer produces briefing → Artifact v1 created → Sprint completes → Project orchestrator updates roadmap: "Sprint 1 covered basics. Gaps: enterprise pricing, user sentiment. Suggested Sprint 2: deep dive on enterprise features."
