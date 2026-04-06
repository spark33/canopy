"use client";

import { Badge } from "@/components/ui/Badge";
import { CheckpointCard } from "./CheckpointCard";
import { cn, formatDuration, formatTokens } from "@/lib/utils";
import type { Task, Checkpoint } from "@/lib/types";

interface AgentCardProps {
  task: Task;
  checkpoint?: Checkpoint;
  onResolveCheckpoint: (checkpointId: string, resolution: string, userInput?: string) => void;
}

const agentColors: Record<string, string> = {
  researcher: "bg-teal",
  fact_checker: "bg-teal",
  synthesizer: "bg-accent",
};

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="success">Done</Badge>;
    case "running":
      return <Badge variant="warning" pulse>Running</Badge>;
    case "failed":
      return <Badge variant="danger">Failed</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function AgentCard({ task, checkpoint, onResolveCheckpoint }: AgentCardProps) {
  const hasCheckpoint = checkpoint && checkpoint.status === "pending";

  return (
    <div
      className={cn(
        "bg-surface border rounded-[14px] p-[18px_20px] transition-[border-color] duration-150",
        hasCheckpoint ? "border-amber-dot border-[1.5px]" : "border-border hover:border-border-strong"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-2 h-2 rounded-full", agentColors[task.agent_type] || "bg-text-tertiary")} />
        <span className="text-[13px] font-medium">{task.title}</span>
        <span className="ml-auto">{statusBadge(task.status)}</span>
      </div>

      {/* Body */}
      {task.status === "running" ? (
        <div className="text-[13px] text-text-tertiary leading-relaxed mb-3">
          <div className="animate-shimmer h-3 rounded-sm w-[90%] mb-2" />
          <div className="animate-shimmer h-3 rounded-sm w-[70%] mb-2" />
          <div className="animate-shimmer h-3 rounded-sm w-[50%]" />
        </div>
      ) : task.output ? (
        <div className="text-[13px] text-text-secondary leading-relaxed mb-3 line-clamp-4">
          {task.output.slice(0, 300)}{task.output.length > 300 ? "..." : ""}
        </div>
      ) : task.error_message ? (
        <div className="text-[13px] text-red leading-relaxed mb-3">
          {task.error_message}
        </div>
      ) : null}

      {/* Footer meta */}
      <div className="flex gap-4 text-[11px] text-text-tertiary">
        {task.sources && task.sources.length > 0 && <span>{task.sources.length} sources</span>}
        {task.duration_ms && <span>{formatDuration(task.duration_ms)}</span>}
        {task.tokens_used && <span>{formatTokens(task.tokens_used)} tok</span>}
      </div>

      {/* Checkpoint */}
      {checkpoint && <CheckpointCard checkpoint={checkpoint} onResolve={onResolveCheckpoint} />}
    </div>
  );
}
