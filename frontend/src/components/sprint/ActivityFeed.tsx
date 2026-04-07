"use client";

import { useState } from "react";
import { cn, timeAgo } from "@/lib/utils";
import type { PlanStep, TraceEvent } from "@/lib/types";

interface ActivityFeedProps {
  steps: PlanStep[];
  events: TraceEvent[];
}

const dotColors: Record<string, string> = {
  orchestrator: "bg-accent",
  agent: "bg-teal",
  tool: "bg-text-tertiary",
  user: "bg-amber-dot",
  system: "bg-text-tertiary",
};

const eventLabels: Record<string, string> = {
  sprint_started: "Sprint started",
  sprint_completed: "Sprint completed",
  sprint_failed: "Sprint failed",
  plan_created: "Plan created",
  plan_updated: "Plan updated",
  task_started: "Task started",
  task_completed: "Task completed",
  task_failed: "Task failed",
  tool_call: "Tool call",
  tool_result: "Tool result",
  orchestrator_decision: "Decision",
  orchestrator_thinking: "Thinking",
  checkpoint_surfaced: "Checkpoint",
  checkpoint_resolved: "Resolved",
  user_input: "User input",
  artifact_updated: "Artifact updated",
  error: "Error",
};

function StepIndicator({ status }: { status: string }) {
  const base = "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0";
  switch (status) {
    case "completed":
      return <div className={cn(base, "bg-green-bg text-green-text")}>&#10003;</div>;
    case "running":
      return <div className={cn(base, "bg-amber-bg text-amber-text")}><span className="animate-pulse-gentle">&bull;</span></div>;
    case "blocked":
      return <div className={cn(base, "bg-red-bg text-red")}>!</div>;
    default:
      return <div className={cn(base, "bg-surface-alt text-text-tertiary")}>&mdash;</div>;
  }
}

export function ActivityFeed({ steps, events }: ActivityFeedProps) {
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Filter out noisy events (tool calls/results) unless expanded
  const filteredEvents = showAllEvents
    ? events
    : events.filter((e) => !["tool_call", "tool_result", "orchestrator_thinking"].includes(e.event_type));

  return (
    <div className="w-[300px] border-r border-border bg-surface overflow-y-auto flex-shrink-0 flex flex-col">
      {/* Plan steps */}
      <div className="p-4 pb-2">
        <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-3">
          Plan
        </div>
        {steps.length === 0 && (
          <div className="text-[11px] text-text-tertiary italic mb-2">Planning...</div>
        )}
        {steps.map((step, i) => (
          <div key={step.step_number} className="flex gap-2.5 mb-1.5">
            <StepIndicator status={step.status} />
            <div className="min-w-0 py-0.5">
              <div className="text-[12px] font-medium leading-tight truncate">{step.title}</div>
              <div className="text-[10px] text-text-tertiary">
                {step.agent_type || "checkpoint"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border mx-4" />

      {/* Activity stream */}
      <div className="p-4 pt-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px]">
            Activity
          </div>
          <button
            onClick={() => setShowAllEvents(!showAllEvents)}
            className="text-[10px] text-accent cursor-pointer hover:underline"
          >
            {showAllEvents ? "Hide details" : "Show all"}
          </button>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-[11px] text-text-tertiary italic">Waiting for events...</div>
        )}

        {filteredEvents.map((event) => (
          <ActivityEvent key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function ActivityEvent({ event }: { event: TraceEvent }) {
  const [expanded, setExpanded] = useState(false);
  const dotColor = dotColors[event.source_type] || "bg-text-tertiary";
  const label = eventLabels[event.event_type] || event.event_type;
  const payload = event.payload || {};

  let description = "";
  if (event.event_type === "orchestrator_decision") {
    description = (payload.reasoning as string) || `Action: ${payload.action}`;
  } else if (event.event_type === "task_started") {
    description = `${payload.agent_type}: ${payload.title}`;
  } else if (event.event_type === "task_completed") {
    description = `${payload.title || "Task"} finished`;
  } else if (event.event_type === "checkpoint_surfaced") {
    description = (payload.title as string) || "Needs input";
  } else if (event.event_type === "user_input") {
    description = (payload.content as string) || "";
  } else if (event.event_type === "error") {
    description = (payload.message as string) || (payload.error as string) || "";
  } else if (event.event_type === "artifact_updated") {
    description = `v${payload.version}: ${payload.change_summary || "updated"}`;
  } else if (event.event_type === "tool_call") {
    description = `${payload.tool_name}(${JSON.stringify(payload.arguments || {}).slice(0, 60)})`;
  }

  const isError = event.event_type === "error" || event.event_type === "sprint_failed" || event.event_type === "task_failed";

  return (
    <div className="flex gap-2 pb-2.5 mb-2.5 border-b border-border last:border-none">
      <div className={cn("w-1.5 h-1.5 rounded-full mt-[5px] flex-shrink-0", isError ? "bg-red" : dotColor)} />
      <div className="min-w-0 flex-1">
        <div className={cn("text-[11px] font-medium", isError ? "text-red" : "text-text-primary")}>{label}</div>
        {description && (
          <div className="text-[10px] text-text-tertiary leading-snug mt-0.5 line-clamp-2">
            {description}
          </div>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-text-tertiary">{timeAgo(event.created_at)}</span>
          {Object.keys(payload).length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[9px] text-accent cursor-pointer hover:underline"
            >
              {expanded ? "hide" : "details"}
            </button>
          )}
        </div>
        {expanded && (
          <pre className="mt-1.5 p-2 bg-surface-alt rounded text-[9px] font-mono text-text-secondary overflow-x-auto max-h-[150px]">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
