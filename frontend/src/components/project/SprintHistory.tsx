"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import type { SprintBrief } from "@/lib/types";

interface SprintHistoryProps {
  projectId: string;
  sprints: SprintBrief[];
}

const statusVariant: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  planning: "info",
  running: "warning",
  awaiting_input: "warning",
  synthesizing: "info",
  completed: "success",
  failed: "danger",
  cancelled: "neutral",
};

export function SprintHistory({ projectId, sprints }: SprintHistoryProps) {
  if (sprints.length === 0) {
    return (
      <div className="text-[13px] text-text-tertiary italic py-4">
        No sprints yet. Start your first sprint to begin.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sprints.map((sprint) => (
        <Link
          key={sprint.id}
          href={`/projects/${projectId}/sprints/${sprint.id}`}
          className="block bg-surface border border-border rounded-md p-4 hover:border-border-strong transition-[border-color] duration-150 no-underline"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] font-medium">Sprint {sprint.sprint_number}</span>
            <Badge variant={statusVariant[sprint.status] || "neutral"} size="sm">
              {sprint.status}
            </Badge>
          </div>
          <p className="text-[12px] text-text-secondary line-clamp-1">{sprint.goal}</p>
          <div className="text-[11px] text-text-tertiary mt-1.5">
            {sprint.started_at ? timeAgo(sprint.started_at) : "Not started"}
          </div>
        </Link>
      ))}
    </div>
  );
}
