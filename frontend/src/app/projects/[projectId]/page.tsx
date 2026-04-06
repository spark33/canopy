"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { SprintHistory } from "@/components/project/SprintHistory";
import { ArtifactViewer } from "@/components/project/ArtifactViewer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useProject } from "@/hooks/useProject";
import { api } from "@/lib/api";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { project, isLoading, refetch } = useProject(projectId);

  const [showNewSprint, setShowNewSprint] = useState(false);
  const [sprintGoal, setSprintGoal] = useState("");
  const [creatingSprint, setCreatingSprint] = useState(false);

  async function handleCreateSprint() {
    if (!sprintGoal.trim()) return;
    setCreatingSprint(true);
    try {
      const sprint = await api.createSprint(projectId, { goal: sprintGoal.trim() });
      router.push(`/projects/${projectId}/sprints/${sprint.id}`);
    } catch {
      setCreatingSprint(false);
    }
  }

  async function handleAutonomyChange(mode: string) {
    await api.updateProject(projectId, { autonomy_mode: mode });
    refetch();
  }

  if (isLoading || !project) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <div className="max-w-[1100px] mx-auto px-7 py-8">
          <div className="animate-shimmer h-5 w-[30%] rounded-sm mb-4" />
          <div className="animate-shimmer h-3 w-[50%] rounded-sm" />
        </div>
      </div>
    );
  }

  // Get suggested sprint goal from roadmap
  const suggestedGoal = project.orchestrator_context?.suggested_first_sprint
    ? (project.orchestrator_context.suggested_first_sprint as { goal?: string })?.goal
    : project.roadmap?.suggested_next_sprint
    ? (project.roadmap.suggested_next_sprint as { goal?: string })?.goal
    : "";

  return (
    <div className="min-h-screen">
      <TopBar projectName={project.name} projectId={projectId} />
      <div className="max-w-[1100px] mx-auto px-7 py-8">
        <ProjectHeader project={project} onAutonomyChange={handleAutonomyChange} />

        <div className="flex items-center justify-between mb-4">
          <div />
          <Button variant="primary" onClick={() => { setShowNewSprint(true); if (suggestedGoal) setSprintGoal(suggestedGoal); }}>
            New sprint
          </Button>
        </div>

        {showNewSprint && (
          <div className="bg-surface border border-border rounded-lg p-5 mb-6">
            <div className="max-w-[600px]">
              <Input
                label="Sprint goal"
                placeholder="What should this sprint accomplish?"
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
              />
              {suggestedGoal && sprintGoal !== suggestedGoal && (
                <button
                  onClick={() => setSprintGoal(suggestedGoal)}
                  className="text-[11px] text-accent mt-1 cursor-pointer hover:underline"
                >
                  Use suggested: {suggestedGoal}
                </button>
              )}
              <div className="flex gap-2 mt-3">
                <Button variant="primary" loading={creatingSprint} onClick={handleCreateSprint}>
                  Start sprint
                </Button>
                <Button variant="ghost" onClick={() => setShowNewSprint(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-3">
              Sprint history
            </div>
            <SprintHistory projectId={projectId} sprints={project.sprints} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-3">
              Artifact
            </div>
            <ArtifactViewer artifact={project.artifact} />
          </div>
        </div>
      </div>
    </div>
  );
}
