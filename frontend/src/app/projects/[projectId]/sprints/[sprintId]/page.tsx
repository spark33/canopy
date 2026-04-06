"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs } from "@/components/ui/Tabs";
import { SprintDashboard } from "@/components/sprint/SprintDashboard";
import { SprintOutput } from "@/components/sprint/SprintOutput";
import { SprintTrace } from "@/components/sprint/SprintTrace";
import { InputBar } from "@/components/sprint/InputBar";
import { useSprint } from "@/hooks/useSprint";
import { useProject } from "@/hooks/useProject";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "output", label: "Output" },
  { id: "trace", label: "Trace" },
];

export default function SprintPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const sprintId = params.sprintId as string;

  const { project } = useProject(projectId);
  const { sprint, traceEvents, isLoading, isConnected, resolveCheckpoint, sendInput } = useSprint(projectId, sprintId);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Auto-switch to dashboard when checkpoint surfaced
  useEffect(() => {
    if (sprint?.status === "awaiting_input") {
      setActiveTab("dashboard");
    }
  }, [sprint?.status]);

  if (isLoading || !sprint) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar projectName={project?.name} projectId={projectId} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[14px] text-text-tertiary">Loading sprint...</div>
        </div>
      </div>
    );
  }

  const isActive = ["planning", "running", "awaiting_input", "synthesizing"].includes(sprint.status);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar
        projectName={project?.name}
        projectId={projectId}
        sprintNumber={sprint.sprint_number}
        sprintId={sprintId}
        sprintStatus={sprint.status}
        autonomyMode={sprint.autonomy_mode}
      />

      <div className="px-7 pt-3">
        <Tabs
          tabs={TABS.map(t => ({
            ...t,
            count: t.id === "trace" ? traceEvents.length : undefined,
          }))}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "dashboard" && (
          <SprintDashboard sprint={sprint} onResolveCheckpoint={resolveCheckpoint} />
        )}
        {activeTab === "output" && (
          <SprintOutput
            artifact={project?.artifact || null}
            checkpoints={sprint.checkpoints}
            onResolveCheckpoint={resolveCheckpoint}
          />
        )}
        {activeTab === "trace" && (
          <SprintTrace events={traceEvents} />
        )}
      </div>

      {isActive && (
        <div className="px-7">
          <InputBar onSend={sendInput} disabled={!isConnected} />
        </div>
      )}
    </div>
  );
}
