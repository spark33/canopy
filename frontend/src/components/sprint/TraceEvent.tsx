"use client";

import { useState } from "react";
import { cn, timeAgo } from "@/lib/utils";
import type { TraceEvent as TraceEventType } from "@/lib/types";

const dotColors: Record<string, string> = {
  orchestrator: "bg-accent",
  agent: "bg-teal",
  tool: "bg-text-tertiary",
  user: "bg-amber-dot",
  system: "bg-text-tertiary",
};

const eventTitles: Record<string, string> = {
  sprint_started: "Sprint started",
  sprint_completed: "Sprint completed",
  sprint_failed: "Sprint failed",
  plan_created: "Plan created",
  plan_updated: "Plan updated",
  task_spawned: "Task spawned",
  task_started: "Task started",
  task_completed: "Task completed",
  task_failed: "Task failed",
  tool_call: "Tool call",
  tool_result: "Tool result",
  orchestrator_decision: "Orchestrator decision",
  checkpoint_surfaced: "Checkpoint surfaced",
  checkpoint_resolved: "Checkpoint resolved",
  user_input: "User input",
  artifact_updated: "Artifact updated",
  confidence_assessment: "Confidence assessment",
};

export function TraceEvent({ event }: { event: TraceEventType }) {
  const [expanded, setExpanded] = useState(false);

  const title = eventTitles[event.event_type] || event.event_type;
  const dotColor = dotColors[event.source_type] || "bg-text-tertiary";

  // Build description from payload
  let description = "";
  const payload = event.payload || {};
  if (event.event_type === "orchestrator_decision") {
    description = `Action: ${payload.action || "?"} — ${payload.reasoning || ""}`;
  } else if (event.event_type === "tool_call") {
    description = `${payload.tool_name}(${JSON.stringify(payload.arguments || {}).slice(0, 80)})`;
  } else if (event.event_type === "task_started" || event.event_type === "task_completed") {
    description = `${payload.agent_type || ""}: ${payload.title || ""}`;
  } else if (event.event_type === "checkpoint_surfaced") {
    description = `${payload.type || ""}: ${payload.title || ""}`;
  } else if (event.event_type === "user_input") {
    description = String(payload.content || "");
  } else if (event.event_type === "artifact_updated") {
    description = `Version ${payload.version || "?"}: ${payload.change_summary || ""}`;
  } else {
    description = JSON.stringify(payload).slice(0, 120);
  }

  return (
    <div className="flex gap-2.5 pb-3.5 mb-3.5 border-b border-border last:border-none">
      <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", dotColor)} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium">{title}</div>
        <div className="text-[11px] text-text-tertiary leading-snug mt-0.5 truncate">
          {description}
        </div>
        {event.token_count && (
          <div className="text-[10px] text-text-tertiary mt-0.5">{event.token_count} tokens</div>
        )}
        <div className="text-[10px] text-text-tertiary mt-1">
          {timeAgo(event.created_at)}
        </div>
        {payload && Object.keys(payload).length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-accent mt-1 cursor-pointer hover:underline"
          >
            {expanded ? "Hide details" : "View details"}
          </button>
        )}
        {expanded && (
          <pre className="mt-2 p-3 bg-surface-alt rounded-md text-[11px] font-mono text-text-secondary overflow-x-auto max-h-[300px]">
            {JSON.stringify(payload, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
