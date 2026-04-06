"use client";

import { PlanSidebar } from "./PlanSidebar";
import { AgentCard } from "./AgentCard";
import { StatsBar } from "./StatsBar";
import type { Sprint, Checkpoint } from "@/lib/types";

interface SprintDashboardProps {
  sprint: Sprint;
  onResolveCheckpoint: (checkpointId: string, resolution: string, userInput?: string) => void;
}

export function SprintDashboard({ sprint, onResolveCheckpoint }: SprintDashboardProps) {
  const steps = sprint.plan || [];
  const pendingCheckpoints = sprint.checkpoints.filter((c) => c.status === "pending");

  // Find the orchestrator reasoning from orchestrator_state
  const reasoning = sprint.orchestrator_state?.accumulated_context as string | undefined;

  // Map tasks to their checkpoints
  function getCheckpointForTask(taskId: string): Checkpoint | undefined {
    return sprint.checkpoints.find((c) => c.task_id === taskId);
  }

  return (
    <div className="flex h-full">
      <PlanSidebar steps={steps} orchestratorReasoning={reasoning} />

      <div className="flex-1 p-6 overflow-y-auto">
        <StatsBar sprint={sprint} />

        {/* Agent outputs */}
        <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mt-6 mb-3.5">
          Agent outputs
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {sprint.tasks.map((task) => (
            <AgentCard
              key={task.id}
              task={task}
              checkpoint={getCheckpointForTask(task.id)}
              onResolveCheckpoint={onResolveCheckpoint}
            />
          ))}
        </div>

        {/* Standalone checkpoints (not tied to a task) */}
        {pendingCheckpoints.filter((c) => !c.task_id).length > 0 && (
          <>
            <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mt-4 mb-3.5">
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

        {/* Orchestrator section */}
        {sprint.orchestrator_state && (
          <div className="bg-surface border border-border rounded-[14px] p-5 mt-2">
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
    </div>
  );
}
