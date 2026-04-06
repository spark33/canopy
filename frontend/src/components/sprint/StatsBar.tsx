"use client";

import { formatTokens, formatCost, formatElapsed } from "@/lib/utils";
import type { Sprint } from "@/lib/types";

interface StatsBarProps {
  sprint: Sprint;
}

export function StatsBar({ sprint }: StatsBarProps) {
  const completedTasks = sprint.tasks.filter((t) => t.status === "completed").length;
  const runningTasks = sprint.tasks.filter((t) => t.status === "running").length;
  const totalSteps = sprint.plan?.length || 0;
  const completedSteps = sprint.plan?.filter((s) => s.status === "completed").length || 0;
  const blockedSteps = sprint.plan?.filter((s) => s.status === "blocked").length || 0;

  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="bg-surface border border-border rounded-lg px-4 py-3.5">
        <div className="text-[11px] text-text-tertiary font-medium uppercase tracking-[0.3px]">Agents</div>
        <div className="text-[22px] font-medium mt-1">{sprint.tasks.length}</div>
        <div className="text-[11px] text-text-tertiary mt-0.5">
          {completedTasks} done{runningTasks > 0 ? `, ${runningTasks} running` : ""}
        </div>
      </div>
      <div className="bg-surface border border-border rounded-lg px-4 py-3.5">
        <div className="text-[11px] text-text-tertiary font-medium uppercase tracking-[0.3px]">Steps</div>
        <div className="text-[22px] font-medium mt-1">{completedSteps} / {totalSteps}</div>
        <div className="text-[11px] text-text-tertiary mt-0.5">
          {blockedSteps > 0 ? `${blockedSteps} blocked` : "On track"}
        </div>
      </div>
      <div className="bg-surface border border-border rounded-lg px-4 py-3.5">
        <div className="text-[11px] text-text-tertiary font-medium uppercase tracking-[0.3px]">Tokens</div>
        <div className="text-[22px] font-medium mt-1">{formatTokens(sprint.total_tokens)}</div>
        <div className="text-[11px] text-text-tertiary mt-0.5">~{formatCost(sprint.total_cost_cents)}</div>
      </div>
      <div className="bg-surface border border-border rounded-lg px-4 py-3.5">
        <div className="text-[11px] text-text-tertiary font-medium uppercase tracking-[0.3px]">Elapsed</div>
        <div className="text-[22px] font-medium mt-1">
          {sprint.started_at ? formatElapsed(sprint.started_at) : "--"}
        </div>
        <div className="text-[11px] text-text-tertiary mt-0.5">
          {sprint.status === "completed" ? "Done" : sprint.status === "running" ? "In progress" : sprint.status}
        </div>
      </div>
    </div>
  );
}
