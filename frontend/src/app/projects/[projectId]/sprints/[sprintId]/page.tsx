"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { SprintDashboard } from "@/components/sprint/SprintDashboard";
import { SprintOutput } from "@/components/sprint/SprintOutput";
import { SprintTrace } from "@/components/sprint/SprintTrace";
import { InputBar } from "@/components/sprint/InputBar";
import { useSprint } from "@/hooks/useSprint";
import { useProject } from "@/hooks/useProject";
import { api } from "@/lib/api";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "output", label: "Output" },
  { id: "trace", label: "Trace" },
];

export default function SprintPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const sprintId = params.sprintId as string;

  const router = useRouter();
  const { project } = useProject(projectId);
  const { sprint, traceEvents, isLoading, isConnected, resolveCheckpoint, sendInput } = useSprint(projectId, sprintId);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [nextSprintGoal, setNextSprintGoal] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<{ goal: string; rationale: string } | null>(null);
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [showNextSprint, setShowNextSprint] = useState(false);

  // Auto-switch to dashboard when checkpoint surfaced
  useEffect(() => {
    if (sprint?.status === "awaiting_input") {
      setActiveTab("dashboard");
    }
  }, [sprint?.status]);

  async function handleSuggest() {
    setSuggesting(true);
    try {
      const result = await api.suggestSprint(projectId);
      if (result?.suggested_sprint) {
        setSuggestion(result.suggested_sprint);
        setNextSprintGoal(result.suggested_sprint.goal);
      }
    } catch {
      // ignore
    } finally {
      setSuggesting(false);
    }
  }

  async function handleStartNextSprint() {
    if (!nextSprintGoal.trim()) return;
    setCreatingSprint(true);
    try {
      const newSprint = await api.createSprint(projectId, { goal: nextSprintGoal.trim() });
      router.push(`/projects/${projectId}/sprints/${newSprint.id}`);
    } catch {
      setCreatingSprint(false);
    }
  }

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

      {!isActive && (
        <div className="px-7 pb-6">
          {!showNextSprint ? (
            <div className="flex items-center gap-3 mt-2">
              <Button variant="primary" onClick={() => { setShowNextSprint(true); handleSuggest(); }}>
                Start next sprint
              </Button>
              <span className="text-[12px] text-text-tertiary">
                Sprint {sprint.sprint_number} {sprint.status}
              </span>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-[14px] p-5 mt-2 max-w-[700px]">
              <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-3">
                Next sprint
              </div>

              {suggesting && !suggestion && (
                <div className="text-[12px] text-text-tertiary mb-3 flex items-center gap-2">
                  <span className="animate-pulse-gentle">Generating suggestion from project roadmap...</span>
                </div>
              )}

              {suggestion && (
                <div className="mb-3 px-3 py-2.5 bg-accent-bg rounded-md">
                  <div className="text-[11px] font-medium text-accent-text mb-1">Suggested goal</div>
                  <div className="text-[13px] text-text-primary leading-relaxed">{suggestion.goal}</div>
                  <div className="text-[11px] text-text-secondary mt-1">{suggestion.rationale}</div>
                </div>
              )}

              <textarea
                value={nextSprintGoal}
                onChange={(e) => setNextSprintGoal(e.target.value)}
                placeholder="What should the next sprint accomplish?"
                rows={2}
                className="w-full px-3 py-2 text-[14px] bg-surface border border-border-strong rounded text-text-primary outline-none placeholder:text-text-tertiary resize-none focus:border-accent mb-3"
              />

              <div className="flex gap-2">
                <Button variant="primary" loading={creatingSprint} onClick={handleStartNextSprint} disabled={!nextSprintGoal.trim()}>
                  Start sprint {sprint.sprint_number + 1}
                </Button>
                {!suggestion && !suggesting && (
                  <Button variant="secondary" loading={suggesting} onClick={handleSuggest}>
                    Suggest goal
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setShowNextSprint(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
