"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import type { SprintStatus } from "@/lib/types";

interface TopBarProps {
  projectName?: string;
  projectId?: string;
  sprintNumber?: number;
  sprintId?: string;
  sprintStatus?: SprintStatus;
  autonomyMode?: string;
}

function statusToBadge(status?: SprintStatus) {
  if (!status) return null;
  const map: Record<string, { variant: "success" | "warning" | "danger" | "info" | "neutral"; label: string }> = {
    planning: { variant: "info", label: "Planning" },
    running: { variant: "warning", label: "Running" },
    awaiting_input: { variant: "warning", label: "Awaiting input" },
    synthesizing: { variant: "info", label: "Synthesizing" },
    completed: { variant: "success", label: "Completed" },
    failed: { variant: "danger", label: "Failed" },
    cancelled: { variant: "neutral", label: "Cancelled" },
  };
  const cfg = map[status] || { variant: "neutral" as const, label: status };
  return <Badge variant={cfg.variant} size="md">{cfg.label}</Badge>;
}

export function TopBar({ projectName, projectId, sprintNumber, sprintStatus, autonomyMode }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-7 py-3.5 border-b border-border bg-surface sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-[14px] font-semibold tracking-[-0.3px] text-accent no-underline">
          AgentOps
        </Link>
        {projectName && (
          <>
            <span className="text-border-strong">|</span>
            <div>
              <div className="flex items-center gap-2 text-[14px]">
                {projectId ? (
                  <Link href={`/projects/${projectId}`} className="font-medium text-text-primary no-underline hover:text-accent">
                    {projectName}
                  </Link>
                ) : (
                  <span className="font-medium">{projectName}</span>
                )}
                {sprintNumber && (
                  <>
                    <span className="text-text-tertiary">/</span>
                    <span className="font-medium">Sprint {sprintNumber}</span>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        {autonomyMode && <Badge variant="info" size="md">{autonomyMode} mode</Badge>}
        {statusToBadge(sprintStatus)}
      </div>
    </div>
  );
}
