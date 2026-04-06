"use client";

import { cn } from "@/lib/utils";
import type { PlanStep } from "@/lib/types";

interface PlanSidebarProps {
  steps: PlanStep[];
  orchestratorReasoning?: string;
}

function StepIndicator({ status }: { status: string }) {
  const base = "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 mt-0.5";
  switch (status) {
    case "completed":
      return <div className={cn(base, "bg-green-bg text-green-text")}>&#10003;</div>;
    case "running":
      return <div className={cn(base, "bg-amber-bg text-amber-text")}><span className="animate-pulse-gentle">&bull;</span></div>;
    case "blocked":
      return <div className={cn(base, "bg-red-bg text-red")}>!</div>;
    default:
      return <div className={cn(base, "bg-surface-alt text-text-tertiary")}>&mdash;</div>;
  }
}

export function PlanSidebar({ steps, orchestratorReasoning }: PlanSidebarProps) {
  return (
    <div className="w-[300px] border-r border-border bg-surface p-5 overflow-y-auto flex-shrink-0">
      <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-4">
        Execution plan
      </div>

      {steps.map((step, i) => (
        <div key={step.step_number}>
          <div
            className={cn(
              "flex gap-3 py-2.5 px-3 rounded-md",
              step.status === "running" && "bg-accent-bg"
            )}
          >
            <StepIndicator status={step.status} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium leading-snug">{step.title}</div>
              <div className="text-[11px] text-text-tertiary mt-0.5">
                {step.status === "blocked" ? "Checkpoint \u00b7 User input needed" : step.agent_type || "Orchestrator"}
              </div>
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="w-px h-3 bg-border-strong ml-[31px] my-1" />
          )}
        </div>
      ))}

      {orchestratorReasoning && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-3">
            Orchestrator reasoning
          </div>
          <div className="text-[12px] text-text-secondary leading-relaxed">
            {orchestratorReasoning}
          </div>
        </div>
      )}
    </div>
  );
}
