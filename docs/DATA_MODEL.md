# Data Model

## Entity Relationship Summary

```
PROJECT ──1:N──> SPRINT ──1:N──> TASK ──1:N──> SOURCE
   │                │               │
   │                │               └──1:N──> TRACE_EVENT
   │                │
   │                ├──1:N──> TRACE_EVENT
   │                └──1:N──> CHECKPOINT
   │
   └──1:1──> ARTIFACT ──1:N──> ARTIFACT_VERSION
```

## Tables

### projects

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, default uuid4 |
| name | VARCHAR(255) | Required |
| description | TEXT | Optional, user-provided project description |
| roadmap | JSON | Project orchestrator's evolving plan. Structure: `{"sprints_completed": [...], "gaps": [...], "suggested_next": {...}}` |
| status | VARCHAR(50) | Enum: `active`, `paused`, `completed`, `archived` |
| orchestrator_context | JSON | Accumulated context for project orchestrator: key findings, user preferences, cross-sprint learnings |
| autonomy_mode | VARCHAR(20) | Default autonomy for new sprints: `supervised`, `adaptive`, `autonomous`. Default: `adaptive` |
| created_at | TIMESTAMP | UTC |
| updated_at | TIMESTAMP | UTC, auto-updated |

### sprints

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| project_id | UUID | FK → projects.id, ON DELETE CASCADE |
| sprint_number | INTEGER | Auto-incrementing within project (1, 2, 3...) |
| goal | TEXT | What this sprint aims to accomplish |
| status | VARCHAR(50) | Enum: `planning`, `running`, `awaiting_input`, `synthesizing`, `completed`, `failed`, `cancelled` |
| autonomy_mode | VARCHAR(20) | Inherited from project, can be overridden per sprint |
| plan | JSON | Current task plan. Structure: `[{"title": "...", "agent_type": "researcher", "status": "done", "depends_on": []}]` |
| orchestrator_state | JSON | Sprint orchestrator's current context: cycle count, accumulated observations, current confidence |
| total_tokens | INTEGER | Running total of tokens consumed across all tasks |
| total_cost_cents | INTEGER | Running cost estimate in cents |
| started_at | TIMESTAMP | When execution began |
| completed_at | TIMESTAMP | When sprint finished (null if running) |
| created_at | TIMESTAMP | UTC |

### tasks

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| sprint_id | UUID | FK → sprints.id, ON DELETE CASCADE |
| parent_task_id | UUID | FK → tasks.id, nullable. For subtasks spawned by orchestrator |
| agent_type | VARCHAR(50) | Enum: `researcher`, `fact_checker`, `synthesizer`, `project_orchestrator`, `sprint_orchestrator` |
| title | VARCHAR(255) | Human-readable task name (e.g., "Research Cursor pricing") |
| status | VARCHAR(50) | Enum: `pending`, `running`, `completed`, `failed`, `cancelled` |
| agent_config | JSON | Optional overrides for agent: `{"model": "...", "temperature": 0.3, "extra_tools": [...]}` |
| input_prompt | TEXT | The full prompt sent to the agent (assembled by orchestrator) |
| output | TEXT | The agent's final text output |
| output_structured | JSON | Structured data extracted from agent output, if applicable |
| confidence | FLOAT | Agent's self-reported confidence in its output (0.0–1.0) |
| tokens_used | INTEGER | Total tokens for this task (input + output + tool use) |
| duration_ms | INTEGER | Wall clock time for task execution |
| error_message | TEXT | If status=failed, the error detail |
| created_at | TIMESTAMP | UTC |

### trace_events

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| sprint_id | UUID | FK → sprints.id, ON DELETE CASCADE. Indexed. |
| task_id | UUID | FK → tasks.id, nullable. Null for orchestrator-level events |
| event_type | VARCHAR(50) | See Event Types below |
| source_type | VARCHAR(50) | What produced this event: `orchestrator`, `agent`, `tool`, `user`, `system` |
| payload | JSON | Full event data. Structure varies by event_type |
| token_count | INTEGER | Tokens consumed by this specific event (if applicable) |
| created_at | TIMESTAMP | UTC. Indexed for timeline queries. |

**Event Types:**
- `sprint_started`, `sprint_completed`, `sprint_failed`
- `plan_created`, `plan_updated`
- `task_spawned`, `task_started`, `task_completed`, `task_failed`
- `tool_call`, `tool_result`
- `orchestrator_decision` — payload includes the full decision JSON + reasoning
- `checkpoint_surfaced`, `checkpoint_resolved`
- `user_input` — freeform interjection
- `artifact_updated`
- `confidence_assessment` — orchestrator's confidence evaluation

### checkpoints

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| sprint_id | UUID | FK → sprints.id |
| task_id | UUID | FK → tasks.id, nullable. The task that triggered this checkpoint |
| checkpoint_type | VARCHAR(50) | Enum: `data_conflict`, `ambiguous_goal`, `low_confidence`, `tool_failure`, `user_review`, `plan_approval` |
| title | VARCHAR(255) | Short description for the UI |
| description | TEXT | Full explanation of why the checkpoint was surfaced |
| options | JSON | Action buttons: `[{"id": "use_acquired", "label": "Use 'acquired' framing", "primary": true}, ...]` |
| context | JSON | Supporting data: conflicting sources, agent reasoning, etc. |
| resolution | VARCHAR(100) | Which option the user chose (option id) |
| user_input | TEXT | Freeform text the user added alongside the resolution |
| status | VARCHAR(50) | Enum: `pending`, `resolved`, `expired`, `skipped` |
| surfaced_at | TIMESTAMP | UTC |
| resolved_at | TIMESTAMP | UTC, null until resolved |

### artifacts

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| project_id | UUID | FK → projects.id, UNIQUE (one artifact per project) |
| content_type | VARCHAR(50) | Enum: `markdown`, `structured_report`, `raw_text` |
| title | VARCHAR(255) | Document title |
| content | TEXT | Current version content (denormalized for fast reads) |
| sections | JSON | Structured breakdown: `[{"id": "...", "title": "...", "status": "complete"|"draft"|"pending", "sprint_id": "..."}]` |
| version | INTEGER | Current version number |
| updated_at | TIMESTAMP | UTC |

### artifact_versions

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| artifact_id | UUID | FK → artifacts.id |
| sprint_id | UUID | FK → sprints.id. Which sprint produced this version |
| version | INTEGER | Version number (1, 2, 3...) |
| content | TEXT | Full content at this version |
| change_summary | TEXT | What changed from previous version |
| created_at | TIMESTAMP | UTC |

### sources

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| task_id | UUID | FK → tasks.id |
| url | VARCHAR(2048) | Source URL |
| title | VARCHAR(500) | Page/article title |
| source_type | VARCHAR(50) | Enum: `webpage`, `article`, `api_response`, `document` |
| snippet | TEXT | Relevant excerpt |
| relevance_score | FLOAT | Agent-assessed relevance (0.0–1.0) |
| fetched_at | TIMESTAMP | UTC |

## Indexes

```sql
CREATE INDEX idx_sprints_project ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_trace_events_sprint ON trace_events(sprint_id);
CREATE INDEX idx_trace_events_created ON trace_events(created_at);
CREATE INDEX idx_trace_events_type ON trace_events(event_type);
CREATE INDEX idx_checkpoints_sprint ON checkpoints(sprint_id);
CREATE INDEX idx_checkpoints_status ON checkpoints(status);
CREATE INDEX idx_sources_task ON sources(task_id);
CREATE INDEX idx_artifact_versions_artifact ON artifact_versions(artifact_id);
```

## JSON Field Schemas

### Project.roadmap
```json
{
  "current_focus": "Initial competitive research",
  "sprints_completed": [
    {"sprint_number": 1, "goal": "...", "outcome": "...", "gaps_found": ["..."]}
  ],
  "known_gaps": ["Enterprise pricing details", "User sentiment analysis"],
  "suggested_next_sprint": {
    "goal": "Deep dive on enterprise features and pricing",
    "rationale": "Sprint 1 found basic pricing but missed enterprise tiers"
  }
}
```

### Sprint.plan
```json
[
  {
    "step_number": 1,
    "title": "Research Cursor",
    "agent_type": "researcher",
    "status": "completed",
    "task_id": "uuid-...",
    "depends_on": [],
    "parallel_group": "research"
  },
  {
    "step_number": 4,
    "title": "Cross-reference pricing",
    "agent_type": "fact_checker",
    "status": "pending",
    "depends_on": [1, 2, 3],
    "parallel_group": null
  }
]
```

### Sprint.orchestrator_state
```json
{
  "cycle_count": 4,
  "current_confidence": 0.3,
  "accumulated_context": "Cursor research complete. Windsurf has data conflict...",
  "pending_decisions": [],
  "blocked_on": "checkpoint-uuid"
}
```

### Checkpoint.options
```json
[
  {"id": "use_acquired", "label": "Use \"acquired\" framing", "primary": true},
  {"id": "mark_unconfirmed", "label": "Mark as unconfirmed"},
  {"id": "research_deeper", "label": "Research deeper"}
]
```

### TraceEvent.payload (varies by event_type)

**orchestrator_decision:**
```json
{
  "action": "ask_user",
  "confidence": 0.3,
  "reasoning": "Two primary sources contradict on acquisition status",
  "checkpoint": {"type": "data_conflict", "title": "..."},
  "context_size_tokens": 4200
}
```

**tool_call:**
```json
{
  "tool_name": "web_search",
  "arguments": {"query": "Cursor AI pricing 2025"},
  "agent_type": "researcher",
  "task_title": "Research Cursor"
}
```

**tool_result:**
```json
{
  "tool_name": "web_search",
  "result_count": 8,
  "top_result": {"title": "...", "url": "...", "snippet": "..."},
  "duration_ms": 1200
}
```
