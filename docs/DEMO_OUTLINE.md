# AgentOps Demo Outline

## Opening (1 min)

**Hook**: "What if you could hand a complex research task to a team of AI agents, watch them work in real time, and only step in when it actually matters?"

**One-liner**: AgentOps is a multi-agent orchestration platform with adaptive autonomy and full execution observability.

---

## Act 1: Create a Project (2 min)

1. **Projects list** — Show the home screen. Point out the clean, card-based layout.
2. **Create new project** — Click "New Project", enter:
   - Name: *"Q2 Competitive Landscape Analysis"*
   - Description: *"Research our top 3 competitors, fact-check claims, and produce a synthesized report with recommendations."*
3. **Roadmap generation** — After creation, the project orchestrator auto-generates a suggested roadmap of sprints. Walk through the roadmap briefly.

**Key point**: The project orchestrator is itself an LLM call — it reasons about how to break the work into sprints, not a hardcoded template.

---

## Act 2: Launch a Sprint (2 min)

1. **Sprint suggestions** — Show the AI-suggested sprint goals. Pick or customize one:
   - *"Research competitor product offerings, pricing, and recent announcements"*
2. **Autonomy mode selector** — Demonstrate the three modes on the ProjectHeader:
   - **Supervised** (threshold 1.0) — asks before every action
   - **Adaptive** (threshold 0.6) — asks only when confidence is low
   - **Autonomous** (threshold 0.1) — runs nearly hands-free
3. **Set to Adaptive** and launch the sprint.

**Key point**: Autonomy isn't a toggle — it's a confidence threshold. The orchestrator always outputs a confidence score; the mode just shifts where the human-in-the-loop boundary sits.

---

## Act 3: Watch the Orchestrator Work (3–4 min)

This is the centerpiece. Stay on the **Sprint Dashboard** tab.

1. **Orchestrator thinking** — Show the real-time "thinking" indicator as the orchestrator plans its first cycle.
2. **Plan sidebar** — Walk through the auto-generated plan steps (color-coded: green/done, amber/running, gray/pending). Steps update live via WebSocket.
3. **Agent delegation** — The orchestrator delegates to the **Researcher agent**:
   - An `AgentCard` appears, showing the agent type, assigned task, and a live progress indicator.
   - Point out token usage and confidence score updating in real time.
4. **Multiple agents** — As the researcher finishes, the orchestrator may spin up a **Fact Checker** to cross-reference findings. Show two AgentCards side by side.
5. **StatsBar** — Draw attention to the persistent stats bar: total tokens, estimated cost, cycle count, current confidence.

**Key point**: Each orchestrator cycle is a full LLM call that receives the entire sprint context and outputs a structured JSON decision (`delegate`, `ask_user`, `synthesize`, `replan`, `complete`). It's reasoning, not a state machine.

---

## Act 4: Human-in-the-Loop Checkpoint (2 min)

1. **Checkpoint surfaces** — The orchestrator's confidence drops below the adaptive threshold. A `CheckpointCard` appears with:
   - Context: why the orchestrator is uncertain
   - Options: buttons for the user to choose from (e.g., "Focus on pricing", "Focus on product features", "Cover both")
2. **Resolve the checkpoint** — Pick an option. Show the checkpoint transitioning from `awaiting` to `resolved`.
3. **Orchestrator replans** — After resolution, the orchestrator incorporates the decision and adjusts its plan. The PlanSidebar updates.

**Key point**: Checkpoints are first-class entities with a full lifecycle, not just log messages. They're the primary interaction point between human and system.

---

## Act 5: User Interjection (1 min)

1. **InputBar** — While agents are running, type a message in the bottom input bar:
   - *"Also look into their recent acquisitions"*
2. **Orchestrator absorbs it** — The next cycle picks up the user input and factors it into its decision. Show the trace event confirming it was received.

**Key point**: Users can steer the sprint at any time without stopping it.

---

## Act 6: Synthesis and Output (2 min)

1. **Synthesize action** — The orchestrator decides it has enough data and triggers the **Synthesizer agent** to produce the artifact.
2. **Switch to Output tab** — Show the rendered artifact (the competitive analysis report).
3. **Artifact versioning** — If this were a second sprint, show the version history. Each sprint that modifies the artifact creates a new version, keeping changes atomic and diffable.

**Key point**: Artifacts evolve across sprints, not within them. Version history gives you a clear audit trail.

---

## Act 7: Trace and Observability (1 min)

1. **Switch to Trace tab** — Show the full event timeline: every orchestrator decision, agent action, checkpoint, and user input.
2. **Filter by event type** — Demonstrate filtering to show only orchestrator decisions or only agent completions.
3. **Expand a trace event** — Show the detail: timestamp, event type, metadata.

**Key point**: Trace events are immutable and append-only. This is the source of truth for what happened and why.

---

## Act 8: Sprint Completion (1 min)

1. **Sprint completes** — The orchestrator issues a `complete` action. Sprint status updates to `completed`.
2. **Back to project view** — Show the sprint in the SprintHistory list with its status badge.
3. **Roadmap update** — The project orchestrator updates the roadmap based on what was learned, suggesting the next sprint.

---

## Closing (1 min)

**Recap the key differentiators**:

| Feature | AgentOps | Typical Agent UIs |
|---|---|---|
| Orchestration | LLM-driven reasoning per cycle | Hardcoded state machines |
| Autonomy | Confidence-based threshold | Binary on/off |
| Observability | Full trace + live WebSocket | Logs after the fact |
| Human interaction | First-class checkpoints | Chat-only |
| Output | Versioned artifacts across sprints | One-shot responses |

**Total demo time**: ~13–15 minutes

---

## Setup Checklist

- [ ] `ANTHROPIC_API_KEY` set in `.env`
- [ ] Backend running: `uvicorn app.main:app --reload --port 8000`
- [ ] Frontend running: `npm run dev` (port 3000)
- [ ] Database migrated: `alembic upgrade head`
- [ ] No existing projects (clean state) or pre-seed a project with one completed sprint to show artifact versioning
- [ ] Browser window sized to show full dashboard (1440px+ width recommended)

## Tips

- **If the demo stalls**: Use the InputBar to nudge the orchestrator. You can also pause and resume the sprint.
- **If an agent errors**: The trace tab will show the failure. Orchestrator should replan automatically.
- **For a shorter demo**: Skip Acts 5 and 7, focus on the create → run → checkpoint → output flow (~8 min).
