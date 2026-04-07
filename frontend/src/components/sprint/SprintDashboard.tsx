"use client";

import { useState } from "react";
import { ActivityFeed } from "./ActivityFeed";
import { AgentCard } from "./AgentCard";
import { StatsBar } from "./StatsBar";
import { ArtifactCard, ArtifactSidebar } from "./ArtifactPanel";
import type { Sprint, Checkpoint, Task, TraceEvent, Artifact } from "@/lib/types";

interface SprintDashboardProps {
  sprint: Sprint;
  traceEvents: TraceEvent[];
  artifact: Artifact | null;
  onResolveCheckpoint: (checkpointId: string, resolution: string, userInput?: string) => void;
}

const agentGroupOrder = ["researcher", "fact_checker", "synthesizer", "sprint_orchestrator", "project_orchestrator"];
const agentGroupLabels: Record<string, string> = {
  researcher: "Research agents",
  fact_checker: "Fact checking",
  synthesizer: "Synthesis",
  sprint_orchestrator: "Orchestrator",
  project_orchestrator: "Project orchestrator",
};

function groupTasksByAgent(tasks: Task[]): { agentType: string; tasks: Task[] }[] {
  const groups: Record<string, Task[]> = {};
  for (const task of tasks) {
    const key = task.agent_type;
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }
  return agentGroupOrder
    .filter((type) => groups[type])
    .map((type) => ({ agentType: type, tasks: groups[type] }))
    .concat(
      Object.keys(groups)
        .filter((type) => !agentGroupOrder.includes(type))
        .map((type) => ({ agentType: type, tasks: groups[type] }))
    );
}

export function SprintDashboard({ sprint, traceEvents, artifact, onResolveCheckpoint }: SprintDashboardProps) {
  const steps = sprint.plan || [];
  const pendingCheckpoints = sprint.checkpoints.filter((c) => c.status === "pending");
  const groups = groupTasksByAgent(sprint.tasks);
  const [artifactOpen, setArtifactOpen] = useState(false);

  function getCheckpointForTask(taskId: string): Checkpoint | undefined {
    return sprint.checkpoints.find((c) => c.task_id === taskId);
  }

  return (
    <div className="flex h-full">
      {/* Left: Activity feed */}
      <ActivityFeed steps={steps} events={traceEvents} />

      {/* Center: Main workspace */}
      <div className="flex-1 p-6 overflow-y-auto">
        <StatsBar sprint={sprint} />

        {/* Agent groups */}
        {groups.map(({ agentType, tasks }) => (
          <div key={agentType}>
            <div className="flex items-center gap-2 mt-6 mb-3.5">
              <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px]">
                {agentGroupLabels[agentType] || agentType}
              </span>
              <span className="text-[10px] text-text-tertiary">
                {tasks.filter(t => t.status === "completed").length}/{tasks.length} done
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <AgentCard
                  key={task.id}
                  task={task}
                  checkpoint={getCheckpointForTask(task.id)}
                  onResolveCheckpoint={onResolveCheckpoint}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {sprint.tasks.length === 0 && (
          <div className="mt-6 text-[13px] text-text-tertiary italic">
            No agents have been spawned yet. The orchestrator is planning...
          </div>
        )}

        {/* Artifact card */}
        <div className="mt-6 mb-3.5">
          <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-3">
            Output
          </div>
          <ArtifactCard artifact={artifact} onClick={() => setArtifactOpen(true)} />
        </div>

        {/* Standalone checkpoints */}
        {pendingCheckpoints.filter((c) => !c.task_id).length > 0 && (
          <>
            <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mt-6 mb-3.5">
              Pending decisions
            </div>
            {pendingCheckpoints.filter((c) => !c.task_id).map((cp) => (
              <div key={cp.id} className="bg-surface border border-amber-dot border-[1.5px] rounded-[14px] p-5 mb-3">
                <div className="text-[13px] font-medium mb-2">{cp.title}</div>
                <div className="text-[13px] text-text-secondary leading-relaxed mb-3">{cp.description}</div>
                <div className="flex gap-2 flex-wrap">
                  {cp.options?.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => onResolveCheckpoint(cp.id, option.id)}
                      className={`text-[12px] font-medium px-4 py-[7px] rounded cursor-pointer border transition-all duration-150 ${
                        option.primary
                          ? "bg-text-primary text-white border-text-primary hover:opacity-90"
                          : "bg-surface text-text-primary border-border-strong hover:bg-surface-alt"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Orchestrator state */}
        {sprint.orchestrator_state && (
          <div className="bg-surface border border-border rounded-[14px] p-5 mt-6">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-[13px] font-medium text-accent-text">Orchestrator</span>
            </div>
            <div className="text-[13px] text-text-secondary leading-relaxed">
              Cycle {(sprint.orchestrator_state.cycle_count as number) || 0} &mdash;
              Confidence: {((sprint.orchestrator_state.current_confidence as number) || 0).toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Right: Artifact sidebar (opens on click) */}
      {artifactOpen && artifact && artifact.content && (
        <ArtifactSidebar artifact={artifact} onClose={() => setArtifactOpen(false)} />
      )}
    </div>
  );
}
