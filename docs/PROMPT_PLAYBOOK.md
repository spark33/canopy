# Claude Code Prompt Playbook

Run these prompts in order. Each builds on the previous. Start each session by making sure Claude Code has read CLAUDE.md and the relevant docs.

---

## Phase 1: Project Scaffolding

### Prompt 1.1 — Backend scaffold
```
Read CLAUDE.md and docs/ARCHITECTURE.md. Set up the backend project:

1. Create backend/pyproject.toml with dependencies: fastapi, uvicorn, sqlalchemy[asyncio], aiosqlite, alembic, pydantic, pydantic-settings, anthropic, httpx, structlog, python-dotenv. Dev deps: pytest, pytest-asyncio, httpx (for test client).
2. Create backend/app/config.py with a Settings class using pydantic-settings. Load from .env: ANTHROPIC_API_KEY, DATABASE_URL (default sqlite+aiosqlite:///./agentops.db), HOST, PORT, LOG_LEVEL.
3. Create backend/app/database.py with async SQLAlchemy engine, sessionmaker, and a get_db dependency.
4. Create backend/app/main.py with the FastAPI app, CORS middleware (allow localhost:3000), lifespan that creates tables on startup, and include routers for projects, sprints, tasks, checkpoints, websocket.
5. Create .env.example with all required vars.
6. Create a Makefile with targets: install, dev, test, migrate, seed.

Don't create the models, routes, or services yet — just the scaffold.
```

### Prompt 1.2 — Frontend scaffold
```
Read CLAUDE.md and docs/UI_DESIGN_SYSTEM.md. Set up the frontend project:

1. Initialize a Next.js 14 project with App Router, TypeScript, and Tailwind CSS in frontend/.
2. Configure tailwind.config.ts with a custom design system:
   - Font: DM Sans (import from Google Fonts in layout.tsx)
   - Colors: a custom palette based on warm neutrals (bg: #FAFAF8, surface: #FFFFFF, text: #1A1A18) with accent colors for agent types (purple for orchestrator, teal for agents, amber for checkpoints, coral for errors, green for success).
   - Border radius tokens: sm (6px), md (8px), lg (12px), xl (16px)
3. Create the App Router file structure with placeholder pages:
   - src/app/page.tsx (projects list)
   - src/app/projects/new/page.tsx
   - src/app/projects/[projectId]/page.tsx
   - src/app/projects/[projectId]/sprints/[sprintId]/page.tsx
   - src/app/settings/page.tsx
4. Create src/app/layout.tsx with the font import, global styles, and a minimal shell.
5. Create src/lib/types.ts with TypeScript interfaces matching the data model in docs/DATA_MODEL.md — Project, Sprint, Task, TraceEvent, Checkpoint, Artifact, ArtifactVersion, Source.
6. Create src/lib/api.ts with a base fetch wrapper that prepends the API base URL and handles errors.

Don't build any components yet — just the scaffold and types.
```

---

## Phase 2: Database Models & Migrations

### Prompt 2.1 — SQLAlchemy models
```
Read CLAUDE.md and docs/DATA_MODEL.md. Create all SQLAlchemy ORM models in backend/app/models/:

1. Create models for: Project, Sprint, Task, TraceEvent, Checkpoint, Artifact, ArtifactVersion, Source.
2. Use SQLAlchemy 2.0 style with mapped_column and Mapped types.
3. Use UUID primary keys (use uuid4 default).
4. Define all relationships:
   - Project has many Sprints (cascade delete)
   - Project has one Artifact (one-to-one)
   - Sprint has many Tasks, TraceEvents, Checkpoints
   - Task has many TraceEvents, Sources
   - Task self-references via parent_task_id
   - Artifact has many ArtifactVersions
5. JSON columns should use SQLAlchemy's JSON type.
6. Add all indexes from DATA_MODEL.md.
7. Create __init__.py that imports all models.
8. Set up Alembic: create alembic.ini and alembic/env.py configured for async SQLAlchemy. Generate the initial migration.

Follow the exact column names and types from DATA_MODEL.md.
```

### Prompt 2.2 — Pydantic schemas
```
Read docs/API_SPEC.md. Create Pydantic v2 schemas in backend/app/schemas/:

1. For each entity (Project, Sprint, Task, Checkpoint), create:
   - A Create schema (for POST requests)
   - A Read schema (for GET responses, includes id and timestamps)
   - An Update schema (for PATCH requests, all fields optional)
2. Sprint read schema should include nested task and checkpoint lists.
3. Project read schema should include nested sprint list and artifact.
4. Checkpoint resolve schema with resolution string and optional user_input.
5. UserInput schema with content string and optional references list.
6. TraceEvent read schema with all fields.
7. Use ConfigDict(from_attributes=True) for ORM compatibility.

Match the exact request/response shapes from API_SPEC.md.
```

---

## Phase 3: API Routes

### Prompt 3.1 — CRUD routes
```
Read docs/API_SPEC.md. Implement REST API routes in backend/app/api/:

1. projects.py: GET /projects, POST /projects, GET /projects/:id, PATCH /projects/:id, DELETE /projects/:id
2. sprints.py: POST /projects/:pid/sprints, GET /projects/:pid/sprints/:sid, PATCH /projects/:pid/sprints/:sid, GET /projects/:pid/sprints/:sid/trace (paginated)
3. tasks.py: GET /tasks/:tid (with sources)
4. checkpoints.py: POST /checkpoints/:cid/resolve

All routes should:
- Use the async get_db dependency
- Return proper Pydantic response models
- Handle 404s with descriptive error messages
- POST /projects/:pid/sprints should create the sprint and kick off the orchestrator loop in a background task (use asyncio.create_task for now)

Add a route for user input: POST /projects/:pid/sprints/:sid/input

Also add: GET /projects/:pid/artifact, GET /projects/:pid/artifact/versions
```

### Prompt 3.2 — WebSocket endpoint
```
Read docs/API_SPEC.md WebSocket section. Implement the WebSocket endpoint in backend/app/api/websocket.py:

1. Endpoint: ws://localhost:8000/ws/sprints/{sprint_id}
2. On connect: send current sprint state (sprint_status event)
3. Manage a connection registry: map sprint_id → set of WebSocket connections
4. Create a broadcast function that sends a message to all connections for a sprint
5. Handle client messages: user_input and resolve_checkpoint (delegate to the same services as REST)
6. Handle disconnection gracefully (remove from registry)
7. Export the broadcast function so services can import and call it

The broadcast function is the key integration point — services will call broadcast(sprint_id, event_type, data) to push real-time updates.
```

---

## Phase 4: Agent System

### Prompt 4.1 — Base agent and tools
```
Read docs/AGENT_DEFINITIONS.md. Implement the agent system in backend/app/agents/:

1. base.py: BaseAgent class with:
   - Loads system prompt from prompts/{agent_type}.txt
   - run(task_prompt) method that calls the Anthropic API with tool use
   - Handles the tool use loop: if Claude responds with tool_use, execute the tool and send the result back
   - Returns AgentResult dataclass with: output (str), confidence (float), tokens_used (int), duration_ms (int), sources (list), tool_calls (list)
   - Logs each tool call and result to the trace service

2. tools.py: Implement tool execution:
   - web_search: Use httpx to call a search API. For the MVP, use a simple implementation that calls the Brave Search API (or mock it with a function that returns placeholder results for demo purposes). Define a SEARCH_API_KEY env var.
   - web_fetch: Use httpx to fetch a URL, extract text content using a simple HTML-to-text approach (regex strip tags is fine for MVP, or use beautifulsoup4). Truncate to 3000 tokens.

3. researcher.py, fact_checker.py, synthesizer.py: Extend BaseAgent with the correct agent_type string and any agent-specific configuration (e.g., synthesizer has no tools, higher temperature).

4. __init__.py: Agent registry — a dict mapping agent_type string to agent class. Export a get_agent(agent_type) function.

Create the prompt text files in backend/app/prompts/ using the prompts from AGENT_DEFINITIONS.md.
```

### Prompt 4.2 — Agent runner service
```
Read docs/ARCHITECTURE.md. Create backend/app/services/agent_runner.py:

1. run_agent(sprint_id, task_id, agent_type, task_prompt, db) function:
   - Update task status to "running"
   - Broadcast task_started via WebSocket
   - Instantiate the agent via get_agent(agent_type)
   - Call agent.run(task_prompt)
   - On success: update task with output, confidence, tokens, duration. Create Source records for any sources found. Update sprint total_tokens. Broadcast task_completed.
   - On failure: update task status to "failed" with error_message. Broadcast task_failed.
   - Log trace events throughout

2. Handle tool call tracing — each tool call during agent execution should produce a trace event with event_type "tool_call" and "tool_result".

This service is called by the sprint orchestrator when it decides to delegate.
```

---

## Phase 5: Orchestrator Services

### Prompt 5.1 — Sprint orchestrator
```
Read docs/ORCHESTRATOR.md carefully — it has the full system prompt and loop pseudocode. Implement backend/app/services/sprint_orchestrator.py:

1. run_sprint(sprint_id, db) — the main loop function:
   - Load sprint and project
   - First cycle: call the orchestrator LLM with just the goal to generate the initial plan
   - Loop: build context → call LLM → parse decision → execute → log → repeat
   - Handle each action type: delegate, ask_user, synthesize, replan, complete
   - For delegate with parallel_group: collect all delegations in the same group, run them concurrently with asyncio.gather, then resume the loop
   - For ask_user: create checkpoint, broadcast, then await resolution (poll DB or use an asyncio.Event)
   - For synthesize: run the synthesizer agent, then call artifact_service to update
   - For complete: update sprint status, call project_orchestrator to update roadmap
   - Apply confidence threshold policy from ORCHESTRATOR.md

2. build_orchestrator_context(sprint, project, latest_event) — assembles the full context string:
   - Sprint goal
   - Current plan with statuses
   - Summarized task outputs (first 500 tokens each)
   - All checkpoint resolutions
   - All user inputs
   - Project artifact summary (if exists)
   - Latest event description

3. call_orchestrator_llm(context) — calls Claude with the sprint orchestrator system prompt + context as user message. Parses the JSON response. Handles malformed JSON gracefully (retry once).

Use the exact system prompt from ORCHESTRATOR.md.
```

### Prompt 5.2 — Project orchestrator
```
Read docs/ORCHESTRATOR.md project orchestrator section. Implement backend/app/services/project_orchestrator.py:

1. initialize_project_roadmap(project_id, db) — called when a project is created:
   - Calls Claude with the project orchestrator system prompt, trigger=PROJECT_CREATED
   - Parses the roadmap JSON
   - Saves to project.roadmap
   - Creates the artifact record (empty, version 0)

2. update_roadmap_after_sprint(project_id, sprint_id, db) — called when a sprint completes:
   - Loads project, completed sprint summary, current artifact
   - Calls Claude with trigger=SPRINT_COMPLETED
   - Updates project.roadmap
   - Logs a trace event

3. suggest_next_sprint(project_id, db) — called when user wants to start a new sprint:
   - Calls Claude with trigger=NEW_SPRINT_REQUESTED
   - Returns the suggested sprint goal and rationale
```

### Prompt 5.3 — Supporting services
```
Implement the remaining services in backend/app/services/:

1. trace_service.py:
   - log_event(sprint_id, event_type, source_type, payload, task_id=None, token_count=None) — creates a TraceEvent record
   - get_events(sprint_id, limit, offset, event_type=None) — paginated query
   - Fire-and-forget pattern: use asyncio.create_task so logging doesn't block the hot path

2. checkpoint_service.py:
   - create_checkpoint(sprint_id, task_id, checkpoint_type, title, description, options, context) — creates and returns checkpoint
   - resolve_checkpoint(checkpoint_id, resolution, user_input) — updates checkpoint, broadcasts resolution, notifies the orchestrator loop to resume

3. artifact_service.py:
   - create_artifact(project_id, title, content_type) — initial empty artifact
   - update_artifact(project_id, sprint_id, new_content, change_summary) — creates new version, updates current content
   - get_artifact(project_id) — returns current artifact with version history
   - get_version(artifact_id, version_number) — specific version
```

---

## Phase 6: Frontend Components

### Prompt 6.1 — UI primitives
```
Read CLAUDE.md and docs/UI_DESIGN_SYSTEM.md. Open docs/prototypes/prototype-a-task-dashboard.html in a browser as your primary visual reference. Create the UI primitive components in frontend/src/components/ui/:

1. Button.tsx — variants: primary (dark bg), secondary (outlined), ghost (no border). Sizes: sm, md, lg. Loading state with spinner.
2. Badge.tsx — variants matching status colors: success (green), warning (amber), danger (red), info (purple), neutral (gray). Size: sm, md.
3. Card.tsx — simple container with border, rounded corners, padding. Hover state optional.
4. Input.tsx — text input with label, placeholder, error state.
5. Tabs.tsx — horizontal tab bar with active state. Controlled component (value + onChange).

Style everything with Tailwind using the custom color palette from the tailwind config. Components should be clean, minimal, no shadows — 0.5px borders, generous spacing. Match the aesthetic from the prototype HTML files.
```

### Prompt 6.2 — Layout components
```
Create layout components in frontend/src/components/layout/:

1. TopBar.tsx — fixed top bar with:
   - Logo text "AgentOps" in purple
   - Breadcrumb: Project > Sprint > Tab (using React context or props)
   - Right side: mode badge (adaptive/supervised/autonomous), status badge
   
2. Breadcrumb.tsx — renders path segments with > separators. Each segment is a link except the last.

3. StatsBar.tsx — horizontal bar below the topbar showing sprint stats:
   - Agent count, step progress (3/6), token count, elapsed time, cost
   - Right-aligned status badge

4. InputBar.tsx — persistent bottom input bar:
   - Text input with placeholder "Tell the orchestrator..."
   - Send button (dark circle with arrow icon)
   - Fixed to bottom of the sprint view
```

### Prompt 6.3 — Sprint dashboard tab
```
Read docs/UI_DESIGN_SYSTEM.md and open docs/prototypes/prototype-a-task-dashboard.html in a browser. This is your visual target. Build the sprint dashboard components:

1. SprintDashboard.tsx — main dashboard layout: PlanSidebar on the left (300px), agent cards grid on the right

2. PlanSidebar.tsx — vertical list of plan steps:
   - Each step has a status indicator (checkmark for done, dot for running, ! for blocked, dash for pending)
   - Active step is highlighted
   - Shows agent type and timing info
   - Bottom section: orchestrator reasoning text

3. AgentCard.tsx — card for each task/agent:
   - Header: agent dot (colored by type), agent name, status badge
   - Body: output text (or loading skeleton if running)
   - Footer: metadata row (sources count, duration, tokens)
   - When a checkpoint is attached: render CheckpointCard inside

4. CheckpointCard.tsx — decision card with amber border:
   - Checkpoint type label with icon
   - Description text
   - Action buttons from checkpoint.options (first one is primary)
   - Calls POST /checkpoints/:id/resolve on button click
```

### Prompt 6.4 — Sprint output tab
```
Read docs/UI_DESIGN_SYSTEM.md and open docs/prototypes/prototype-c-document.html in a browser. This is your visual target for the output tab. Build the document/output view:

1. SprintOutput.tsx — renders the artifact as a live document:
   - Title and subtitle with draft indicator
   - Sections from artifact.sections, each with status
   - Completed sections render as formatted markdown (use a simple markdown renderer or dangerouslySetInnerHTML)
   - Pending sections show skeleton placeholders with a loading message
   - Inline conflict markers: when a section has an unresolved checkpoint, show an amber sidebar callout with the checkpoint description and action buttons
   - Source references as superscript badges

Keep the typography clean — use the serif font (Source Serif 4) for the document body, sans for UI elements.
```

### Prompt 6.5 — Sprint trace tab
```
Build the trace/timeline view:

1. SprintTrace.tsx — reverse-chronological event list:
   - Each event is a TraceEvent component
   - Color-coded dots by source_type (purple=orchestrator, teal=agent, gray=tool, amber=checkpoint, red=error)
   - Events are expandable — click to see full payload

2. TraceEvent.tsx — single event row:
   - Left: colored dot
   - Middle: title (derived from event_type), description (from payload), expandable detail
   - Right: timestamp
   - Expanded view shows the payload as formatted JSON (use a code-style block)

Fetch events from GET /sprints/:sid/trace on mount and via WebSocket for live updates.
```

### Prompt 6.6 — Project view
```
Build the project-level pages:

1. Projects list page (src/app/page.tsx):
   - Grid of ProjectCard components
   - Each card shows: project name, description, sprint count, status badge, last updated
   - "New project" button in the top right
   - Clicking a card navigates to /projects/[id]

2. ProjectCard.tsx:
   - Clean card with project name, description preview, sprint count, status badge
   - Subtle hover effect

3. Project view page (src/app/projects/[projectId]/page.tsx):
   - ProjectHeader: name, description, status, autonomy mode selector
   - Two-column layout:
     - Left: SprintHistory — timeline of sprints with status, goal, and timing
     - Right: ArtifactViewer — rendered markdown of the current artifact
   - "New sprint" button that opens a modal or navigates to sprint config
   - Each sprint in the history is clickable → navigates to the sprint view

4. ArtifactViewer.tsx:
   - Renders artifact content as markdown
   - Version selector dropdown
   - Shows which sprint produced each version
```

---

## Phase 7: WebSocket Integration

### Prompt 7.1 — WebSocket hook
```
Create frontend/src/hooks/useWebSocket.ts:

1. Custom hook that connects to ws://localhost:8000/ws/sprints/{sprintId}
2. On message: parse JSON event and dispatch to appropriate state update
3. Reconnection logic: exponential backoff, max 5 retries
4. On disconnect: fetch current state via REST to resync
5. Return: { isConnected, lastEvent, sendMessage }
6. sendMessage for user_input and resolve_checkpoint client→server events

Create frontend/src/hooks/useSprint.ts:
1. Combines REST fetching (initial load) with WebSocket (live updates)
2. Maintains sprint state: sprint data, tasks, checkpoints, trace events
3. Updates state optimistically when user resolves a checkpoint
4. Exports: sprint, tasks, checkpoints, traceEvents, isLoading, error, resolveCheckpoint, sendInput
```

---

## Phase 8: Active Sprint Page Assembly

### Prompt 8.1 — Sprint page
```
Assemble the active sprint page at src/app/projects/[projectId]/sprints/[sprintId]/page.tsx:

1. Server component that fetches initial sprint data via REST
2. Client component wrapper that connects WebSocket and manages live state
3. Layout: TopBar + StatsBar + Tabs (Dashboard | Output | Trace) + InputBar
4. Tab content switches between SprintDashboard, SprintOutput, SprintTrace
5. StatsBar updates in real-time from WebSocket events
6. InputBar sends user_input via WebSocket
7. When a checkpoint is surfaced via WebSocket, auto-switch to Dashboard tab and scroll to the checkpoint card

Make sure the breadcrumb shows: Project Name > Sprint 1 > Dashboard
```

---

## Phase 9: Testing

### Prompt 9.1 — Backend tests
```
Write tests in backend/tests/:

1. test_models.py — test model creation, relationships, JSON field serialization
2. test_api.py — test all REST endpoints using FastAPI TestClient:
   - Create project, list projects, get project
   - Create sprint (mock the orchestrator so it doesn't actually run)
   - Resolve checkpoint
   - Get trace events with pagination
3. test_orchestrator.py — test the orchestrator loop:
   - Mock the Anthropic API to return predetermined decisions
   - Test: plan creation, delegation, checkpoint surfacing, completion
   - Test confidence threshold enforcement
4. test_agents.py — test agent execution:
   - Mock tool responses (web_search returns fake results)
   - Verify agent produces structured output
   - Verify tool calls are logged as trace events

Use pytest-asyncio for async tests. Create a conftest.py with a test database (in-memory SQLite) and fixtures for common test data.
```

---

## Phase 10: Polish & Demo

### Prompt 10.1 — README and demo setup
```
Create a comprehensive README.md:

1. Project title, one-line description, screenshot placeholder
2. Architecture overview (brief, link to docs/ARCHITECTURE.md for detail)
3. Setup instructions:
   - Prerequisites: Python 3.12, Node 18+, Anthropic API key
   - Backend setup: pip install, alembic upgrade, uvicorn
   - Frontend setup: npm install, npm run dev
   - Environment variables
4. Usage walkthrough:
   - Create a project
   - Start a sprint
   - Interact with checkpoints
   - Review the artifact
5. Tech stack summary
6. Project structure (abbreviated)
7. Design decisions (brief, link to docs/)
8. Link to the demo video (placeholder)

Also create a seed script (backend/scripts/seed.py) that populates the database with a sample project, completed sprint, and artifact — so a reviewer can see the app with data immediately.
```

### Prompt 10.2 — Demo scenario
```
Create a Claude Code command (.claude/commands/demo.md) that:

1. Starts the backend and frontend
2. Seeds the database with a compelling demo project: "AI Code Editor Landscape"
3. Creates Sprint 1 with pre-populated results showing the full lifecycle:
   - 3 completed researcher tasks (Cursor, Windsurf, Copilot)
   - 1 resolved checkpoint (the Windsurf acquisition conflict)
   - 1 completed synthesizer task
   - A full artifact with 3 sections
   - Complete trace event history
4. Leaves Sprint 2 ready to be triggered live during the demo

The demo narrative: "Here's a project I've been running. Sprint 1 researched the basics — let me show you the trace of what happened. Now watch as I kick off Sprint 2 to go deeper on enterprise features. See how the orchestrator plans, delegates, and pauses when it finds something uncertain."
```
