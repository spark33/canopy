"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import type { Project } from "@/lib/types";

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();

  const statusVariant = {
    active: "success" as const,
    paused: "warning" as const,
    completed: "info" as const,
    archived: "neutral" as const,
  };

  return (
    <div
      onClick={() => router.push(`/projects/${project.id}`)}
      className="bg-surface border border-border rounded-lg p-5 cursor-pointer transition-[border-color] duration-150 hover:border-border-strong"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-[14px] font-medium">{project.name}</h3>
        <Badge variant={statusVariant[project.status]} size="sm">{project.status}</Badge>
      </div>
      {project.description && (
        <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2 mb-3">
          {project.description}
        </p>
      )}
      <div className="flex gap-4 text-[11px] text-text-tertiary">
        <span>{project.sprints.length} sprint{project.sprints.length !== 1 ? "s" : ""}</span>
        <span>{timeAgo(project.updated_at)}</span>
        <span className="capitalize">{project.autonomy_mode}</span>
      </div>
    </div>
  );
}
