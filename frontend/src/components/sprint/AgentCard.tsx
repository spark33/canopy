"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { CheckpointCard } from "./CheckpointCard";
import { cn, formatDuration, formatTokens } from "@/lib/utils";
import type { Task, Checkpoint } from "@/lib/types";

interface AgentCardProps {
  task: Task;
  checkpoint?: Checkpoint;
  onResolveCheckpoint: (checkpointId: string, resolution: string, userInput?: string) => void;
}

const agentMeta: Record<string, { color: string; dotColor: string; icon: string; label: string }> = {
  researcher: { color: "text-teal-text", dotColor: "bg-teal", icon: "🔍", label: "Researcher" },
  fact_checker: { color: "text-amber-text", dotColor: "bg-amber", icon: "✓", label: "Fact Checker" },
  synthesizer: { color: "text-accent-text", dotColor: "bg-accent", icon: "✎", label: "Synthesizer" },
  sprint_orchestrator: { color: "text-accent-text", dotColor: "bg-accent", icon: "⚡", label: "Orchestrator" },
  project_orchestrator: { color: "text-accent-text", dotColor: "bg-accent", icon: "⚡", label: "Orchestrator" },
};

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="success" size="sm">Done</Badge>;
    case "running":
      return <Badge variant="warning" size="sm" pulse>Running</Badge>;
    case "failed":
      return <Badge variant="danger" size="sm">Failed</Badge>;
    case "pending":
      return <Badge variant="neutral" size="sm">Pending</Badge>;
    default:
      return <Badge variant="neutral" size="sm">{status}</Badge>;
  }
}

export function AgentCard({ task, checkpoint, onResolveCheckpoint }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasCheckpoint = checkpoint && checkpoint.status === "pending";
  const meta = agentMeta[task.agent_type] || { color: "text-text-tertiary", dotColor: "bg-text-tertiary", icon: "●", label: task.agent_type };

  const outputPreview = task.output
    ? expanded ? task.output : task.output.slice(0, 250)
    : null;
  const isLong = (task.output?.length || 0) > 250;

  return (
    <div
      className={cn(
        "bg-surface border rounded-[14px] p-[18px_20px] transition-[border-color] duration-150",
        hasCheckpoint ? "border-amber-dot border-[1.5px]" : "border-border hover:border-border-strong"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", meta.dotColor)} />
        <span className={cn("text-[11px] font-semibold uppercase tracking-[0.3px]", meta.color)}>
          {meta.label}
        </span>
        <span className="ml-auto">{statusBadge(task.status)}</span>
      </div>

      {/* Task title */}
      <div className="text-[13px] font-medium mb-2 pl-4">{task.title}</div>

      {/* Body */}
      {task.status === "running" ? (
        <div className="pl-4 mb-3">
          <div className="animate-shimmer h-3 rounded-sm w-[90%] mb-2" />
          <div className="animate-shimmer h-3 rounded-sm w-[70%] mb-2" />
          <div className="animate-shimmer h-3 rounded-sm w-[50%]" />
        </div>
      ) : outputPreview ? (
        <div className="pl-4 mb-3">
          <div className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">
            {outputPreview}{!expanded && isLong ? "..." : ""}
          </div>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-accent mt-1.5 cursor-pointer hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      ) : task.error_message ? (
        <div className="pl-4 text-[12px] text-red leading-relaxed mb-3">
          {task.error_message}
        </div>
      ) : null}

      {/* Footer meta */}
      <div className="flex items-center gap-3 pl-4 text-[11px] text-text-tertiary">
        {task.sources && task.sources.length > 0 && (
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            {task.sources.length} source{task.sources.length !== 1 ? "s" : ""}
          </span>
        )}
        {task.duration_ms != null && task.duration_ms > 0 && (
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            {formatDuration(task.duration_ms)}
          </span>
        )}
        {task.tokens_used != null && task.tokens_used > 0 && (
          <span>{formatTokens(task.tokens_used)} tok</span>
        )}
        {task.confidence != null && (
          <span className={cn(
            "ml-auto font-medium",
            task.confidence >= 0.8 ? "text-green-text" : task.confidence >= 0.5 ? "text-amber-text" : "text-red"
          )}>
            {Math.round(task.confidence * 100)}% conf
          </span>
        )}
      </div>

      {/* Checkpoint */}
      {checkpoint && <CheckpointCard checkpoint={checkpoint} onResolve={onResolveCheckpoint} />}
    </div>
  );
}
