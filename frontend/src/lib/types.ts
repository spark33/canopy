export interface Project {
  id: string;
  name: string;
  description: string | null;
  roadmap: Record<string, unknown> | null;
  status: "active" | "paused" | "completed" | "archived";
  orchestrator_context: Record<string, unknown> | null;
  autonomy_mode: "supervised" | "adaptive" | "autonomous";
  artifact: Artifact | null;
  sprints: SprintBrief[];
  created_at: string;
  updated_at: string;
}

export interface SprintBrief {
  id: string;
  sprint_number: number;
  goal: string;
  status: SprintStatus;
  started_at: string | null;
  completed_at: string | null;
}

export type SprintStatus =
  | "planning"
  | "running"
  | "awaiting_input"
  | "synthesizing"
  | "completed"
  | "failed"
  | "cancelled";

export interface Sprint {
  id: string;
  project_id: string;
  sprint_number: number;
  goal: string;
  status: SprintStatus;
  autonomy_mode: string;
  plan: PlanStep[] | null;
  orchestrator_state: Record<string, unknown> | null;
  total_tokens: number;
  total_cost_cents: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  tasks: Task[];
  checkpoints: Checkpoint[];
}

export interface PlanStep {
  step_number: number;
  title: string;
  agent_type: string | null;
  status: "pending" | "running" | "completed" | "blocked";
  task_id?: string;
  depends_on?: number[];
  parallel_group?: string | null;
}

export interface Task {
  id: string;
  sprint_id: string;
  parent_task_id: string | null;
  agent_type: string;
  title: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  input_prompt: string | null;
  output: string | null;
  output_structured: Record<string, unknown> | null;
  confidence: number | null;
  tokens_used: number | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
  sources: Source[];
}

export interface Source {
  id: string;
  url: string;
  title: string | null;
  source_type: string;
  snippet: string | null;
  relevance_score: number | null;
  fetched_at: string;
}

export interface Checkpoint {
  id: string;
  sprint_id: string;
  task_id: string | null;
  checkpoint_type: string;
  title: string;
  description: string | null;
  options: CheckpointOption[] | null;
  context: Record<string, unknown> | null;
  resolution: string | null;
  user_input: string | null;
  status: "pending" | "resolved" | "expired" | "skipped";
  surfaced_at: string;
  resolved_at: string | null;
}

export interface CheckpointOption {
  id: string;
  label: string;
  primary?: boolean;
}

export interface Artifact {
  id: string;
  title: string;
  content: string | null;
  content_type?: string;
  version: number;
  sections: ArtifactSection[] | null;
  updated_at?: string;
}

export interface ArtifactSection {
  id: string;
  title: string;
  status: "complete" | "draft" | "pending";
  sprint_id?: string;
}

export interface ArtifactVersion {
  id: string;
  version: number;
  sprint_id: string;
  content: string | null;
  change_summary: string | null;
  created_at: string;
}

export interface TraceEvent {
  id: string;
  sprint_id: string;
  task_id: string | null;
  event_type: string;
  source_type: string;
  payload: Record<string, unknown> | null;
  token_count: number | null;
  created_at: string;
}

export interface WSMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp?: string;
}
