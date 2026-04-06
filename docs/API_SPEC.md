# API Specification

Base URL: `http://localhost:8000/api/v1`

## REST Endpoints

### Projects

```
GET    /projects                    → List all projects
POST   /projects                    → Create project
GET    /projects/:id                → Get project with latest artifact + sprint history
PATCH  /projects/:id                → Update project (name, description, autonomy_mode)
DELETE /projects/:id                → Soft delete (archive)
```

**POST /projects**
```json
// Request
{
  "name": "AI Code Editor Landscape",
  "description": "Competitive analysis of Cursor, Windsurf, and GitHub Copilot",
  "autonomy_mode": "adaptive"  // optional, defaults to "adaptive"
}

// Response 201
{
  "id": "uuid",
  "name": "AI Code Editor Landscape",
  "description": "...",
  "roadmap": null,  // populated after first sprint planning
  "status": "active",
  "autonomy_mode": "adaptive",
  "artifact": null,
  "sprints": [],
  "created_at": "2026-04-07T..."
}
```

**GET /projects/:id**
```json
// Response 200
{
  "id": "uuid",
  "name": "AI Code Editor Landscape",
  "roadmap": { "current_focus": "...", "suggested_next_sprint": {...} },
  "status": "active",
  "artifact": {
    "id": "uuid",
    "title": "AI Code Editor Landscape: Competitive Analysis",
    "content": "# ...",
    "version": 2,
    "sections": [...]
  },
  "sprints": [
    {"id": "uuid", "sprint_number": 1, "goal": "...", "status": "completed", "started_at": "...", "completed_at": "..."},
    {"id": "uuid", "sprint_number": 2, "goal": "...", "status": "running", "started_at": "..."}
  ]
}
```

### Sprints

```
POST   /projects/:pid/sprints              → Create + start a sprint
GET    /projects/:pid/sprints/:sid          → Get sprint with tasks, checkpoints
PATCH  /projects/:pid/sprints/:sid          → Update sprint (cancel, change autonomy)
GET    /projects/:pid/sprints/:sid/tasks    → List tasks for sprint
GET    /projects/:pid/sprints/:sid/trace    → Get trace events (paginated)
```

**POST /projects/:pid/sprints**
```json
// Request
{
  "goal": "Research pricing, features, and funding for Cursor, Windsurf, and GitHub Copilot",
  "autonomy_mode": "adaptive"  // optional, inherits from project
}

// Response 201 — sprint is created and execution begins immediately
{
  "id": "uuid",
  "project_id": "uuid",
  "sprint_number": 1,
  "goal": "...",
  "status": "planning",
  "autonomy_mode": "adaptive",
  "plan": null,  // populated by orchestrator within seconds
  "total_tokens": 0,
  "total_cost_cents": 0,
  "started_at": "2026-04-07T...",
  "tasks": [],
  "checkpoints": []
}
```

**GET /projects/:pid/sprints/:sid**
```json
// Response 200
{
  "id": "uuid",
  "sprint_number": 1,
  "goal": "...",
  "status": "awaiting_input",
  "plan": [
    {"step_number": 1, "title": "Research Cursor", "agent_type": "researcher", "status": "completed", "task_id": "uuid"},
    {"step_number": 2, "title": "Research Windsurf", "agent_type": "researcher", "status": "completed", "task_id": "uuid"},
    {"step_number": 3, "title": "Resolve data conflict", "agent_type": null, "status": "blocked"},
    {"step_number": 4, "title": "Research Copilot", "agent_type": "researcher", "status": "running", "task_id": "uuid"},
    {"step_number": 5, "title": "Cross-reference", "agent_type": "fact_checker", "status": "pending"},
    {"step_number": 6, "title": "Synthesize briefing", "agent_type": "synthesizer", "status": "pending"}
  ],
  "tasks": [...],
  "checkpoints": [
    {
      "id": "uuid",
      "checkpoint_type": "data_conflict",
      "title": "Conflicting acquisition data",
      "description": "...",
      "options": [...],
      "status": "pending",
      "surfaced_at": "..."
    }
  ],
  "total_tokens": 4220,
  "total_cost_cents": 6
}
```

**GET /projects/:pid/sprints/:sid/trace**
```json
// Query params: ?limit=50&offset=0&event_type=orchestrator_decision
// Response 200
{
  "events": [
    {
      "id": "uuid",
      "event_type": "checkpoint_surfaced",
      "source_type": "orchestrator",
      "task_id": "uuid",
      "payload": {...},
      "token_count": 0,
      "created_at": "2026-04-07T..."
    }
  ],
  "total": 23,
  "limit": 50,
  "offset": 0
}
```

### Tasks

```
GET    /tasks/:tid                  → Get task detail with sources
```

**GET /tasks/:tid**
```json
{
  "id": "uuid",
  "agent_type": "researcher",
  "title": "Research Cursor",
  "status": "completed",
  "input_prompt": "Research Cursor AI code editor...",
  "output": "Cursor Pro is $20/mo...",
  "confidence": 0.85,
  "tokens_used": 1240,
  "duration_ms": 38000,
  "sources": [
    {"id": "uuid", "url": "https://cursor.com/pricing", "title": "Cursor Pricing", "snippet": "..."}
  ]
}
```

### Checkpoints

```
POST   /checkpoints/:cid/resolve   → Resolve a checkpoint
```

**POST /checkpoints/:cid/resolve**
```json
// Request
{
  "resolution": "mark_unconfirmed",  // matches an option id
  "user_input": "The Verge article is more recent, let's be cautious"  // optional freeform
}

// Response 200
{
  "id": "uuid",
  "status": "resolved",
  "resolution": "mark_unconfirmed",
  "user_input": "...",
  "resolved_at": "2026-04-07T..."
}
```

### User Input (Interjections)

```
POST   /projects/:pid/sprints/:sid/input   → Send freeform input to orchestrator
```

**POST /projects/:pid/sprints/:sid/input**
```json
// Request
{
  "content": "Also look at VS Code with GitHub Copilot integration",
  "references": []  // optional task_ids or checkpoint_ids for context
}

// Response 202
{
  "acknowledged": true,
  "message": "Input queued for next orchestrator cycle"
}
```

### Artifacts

```
GET    /projects/:pid/artifact              → Get current artifact
GET    /projects/:pid/artifact/versions     → List all versions
GET    /projects/:pid/artifact/versions/:v  → Get specific version
```

## WebSocket

### Connection

```
ws://localhost:8000/ws/sprints/{sprint_id}
```

Connect when entering the active sprint page. Disconnects are handled gracefully — reconnection fetches current state via REST, then resumes WS for live updates.

### Server → Client Messages

All messages follow the format:
```json
{
  "type": "event_type_string",
  "timestamp": "ISO8601",
  "data": { ... }
}
```

**Event types:**

| Type | When | Data |
|------|------|------|
| `sprint_status` | On connect + status changes | `{status, plan}` |
| `orchestrator_thinking` | Each orchestrator cycle starts | `{cycle, message}` |
| `orchestrator_decision` | Each orchestrator decision | `{action, confidence, reasoning}` |
| `task_started` | Agent begins execution | `{task_id, title, agent_type}` |
| `task_progress` | Agent intermediate update | `{task_id, message, sources_found}` |
| `task_completed` | Agent finishes | `{task}` (full task object) |
| `task_failed` | Agent errors | `{task_id, error}` |
| `checkpoint_surfaced` | New checkpoint | `{checkpoint}` (full object) |
| `checkpoint_resolved` | Checkpoint answered | `{checkpoint}` |
| `plan_updated` | Orchestrator replans | `{plan}` |
| `artifact_updated` | Artifact content changed | `{version, content, change_summary}` |
| `sprint_completed` | Sprint finishes | `{summary, total_tokens, total_cost}` |
| `error` | System error | `{message, recoverable}` |

### Client → Server Messages

```json
{"type": "user_input", "content": "...", "references": []}
{"type": "resolve_checkpoint", "checkpoint_id": "...", "resolution": "...", "user_input": "..."}
```

These mirror the REST endpoints but allow real-time interaction without HTTP overhead. The server accepts both — REST for reliability, WS for speed.

## Error Handling

All REST errors follow:
```json
{
  "error": {
    "code": "CHECKPOINT_NOT_FOUND",
    "message": "Checkpoint with id 'uuid' not found",
    "details": {}
  }
}
```

HTTP status codes:
- 400: Bad request (validation error)
- 404: Resource not found
- 409: Conflict (e.g., resolving already-resolved checkpoint)
- 422: Unprocessable entity (valid JSON but invalid semantics)
- 500: Internal server error
- 503: Anthropic API unavailable
