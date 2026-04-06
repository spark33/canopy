"use client";

import { Badge } from "@/components/ui/Badge";
import type { Project } from "@/lib/types";

interface ProjectHeaderProps {
  project: Project;
  onAutonomyChange?: (mode: string) => void;
}

export function ProjectHeader({ project, onAutonomyChange }: ProjectHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-[18px] font-medium">{project.name}</h1>
        <Badge variant="success" size="sm">{project.status}</Badge>
      </div>
      {project.description && (
        <p className="text-[13px] text-text-secondary leading-relaxed mb-3">
          {project.description}
        </p>
      )}
      <div className="flex items-center gap-3">
        <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.3px]">
          Autonomy mode
        </label>
        <select
          value={project.autonomy_mode}
          onChange={(e) => onAutonomyChange?.(e.target.value)}
          className="text-[12px] px-2 py-1 border border-border-strong rounded bg-surface text-text-primary"
        >
          <option value="supervised">Supervised</option>
          <option value="adaptive">Adaptive</option>
          <option value="autonomous">Autonomous</option>
        </select>
      </div>
    </div>
  );
}
