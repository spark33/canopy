"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useWebSocket } from "./useWebSocket";
import type { Sprint, TraceEvent, Checkpoint, Task } from "@/lib/types";

interface UseSprintReturn {
  sprint: Sprint | null;
  traceEvents: TraceEvent[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  resolveCheckpoint: (checkpointId: string, resolution: string, userInput?: string) => Promise<void>;
  sendInput: (content: string) => void;
  refetch: () => void;
}

export function useSprint(projectId: string, sprintId: string, onArtifactUpdated?: () => void): UseSprintReturn {
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isConnected, lastEvent, sendMessage } = useWebSocket(sprintId);

  const fetchSprint = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sprintData, traceData] = await Promise.all([
        api.getSprint(projectId, sprintId),
        api.getSprintTrace(projectId, sprintId, { limit: 100 }),
      ]);
      setSprint(sprintData);
      setTraceEvents(traceData.events);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch sprint");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sprintId]);

  useEffect(() => {
    fetchSprint();
  }, [fetchSprint]);

  // Process WebSocket events
  useEffect(() => {
    if (!lastEvent || !sprint) return;

    const { type, data } = lastEvent;

    switch (type) {
      case "sprint_status": {
        const newStatus = data.status as Sprint["status"];
        const isTerminal = ["completed", "failed", "cancelled"].includes(newStatus);
        setSprint((prev) => prev ? {
          ...prev,
          status: newStatus,
          plan: (data.plan as Sprint["plan"]) || prev.plan,
          completed_at: isTerminal && !prev.completed_at ? new Date().toISOString() : prev.completed_at,
        } : prev);
        break;
      }

      case "task_started":
        setSprint((prev) => {
          if (!prev) return prev;
          const exists = prev.tasks.find((t) => t.id === data.task_id);
          if (exists) {
            return {
              ...prev,
              tasks: prev.tasks.map((t) => t.id === data.task_id ? { ...t, status: "running" as const } : t),
            };
          }
          return {
            ...prev,
            tasks: [...prev.tasks, {
              id: data.task_id as string,
              sprint_id: prev.id,
              parent_task_id: null,
              agent_type: data.agent_type as string,
              title: data.title as string,
              status: "running",
              input_prompt: null,
              output: null,
              output_structured: null,
              confidence: null,
              tokens_used: null,
              duration_ms: null,
              error_message: null,
              created_at: new Date().toISOString(),
              sources: [],
            }],
          };
        });
        break;

      case "task_completed":
        setSprint((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === data.task_id
                ? { ...t, status: "completed" as const, output: data.output as string, confidence: data.confidence as number, tokens_used: data.tokens_used as number, duration_ms: data.duration_ms as number }
                : t
            ),
          };
        });
        break;

      case "task_failed":
        setSprint((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === data.task_id ? { ...t, status: "failed" as const, error_message: data.error as string } : t
            ),
          };
        });
        break;

      case "checkpoint_surfaced":
        setSprint((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: "awaiting_input",
            checkpoints: [...prev.checkpoints, data as unknown as Checkpoint],
          };
        });
        break;

      case "checkpoint_resolved":
        setSprint((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            checkpoints: prev.checkpoints.map((c) =>
              c.id === data.id ? { ...c, status: "resolved" as const, resolution: data.resolution as string } : c
            ),
          };
        });
        break;

      case "plan_updated":
        setSprint((prev) => prev ? { ...prev, plan: data.plan as Sprint["plan"] } : prev);
        break;

      case "artifact_updated":
        fetchSprint();
        onArtifactUpdated?.();
        break;

      case "sprint_completed":
        setSprint((prev) => prev ? { ...prev, status: "completed", completed_at: new Date().toISOString() } : prev);
        onArtifactUpdated?.();
        break;

      case "error":
        setSprint((prev) => prev ? { ...prev, status: "failed", completed_at: prev.completed_at || new Date().toISOString() } : prev);
        // Add error to trace for visibility
        setTraceEvents((prev) => [{
          id: Date.now().toString(),
          sprint_id: sprintId,
          task_id: null,
          event_type: "error",
          source_type: "system",
          payload: data,
          token_count: null,
          created_at: new Date().toISOString(),
        }, ...prev]);
        break;

      case "orchestrator_decision":
      case "orchestrator_thinking":
        // Add to trace events
        setTraceEvents((prev) => [{
          id: Date.now().toString(),
          sprint_id: sprintId,
          task_id: null,
          event_type: type,
          source_type: "orchestrator",
          payload: data,
          token_count: null,
          created_at: new Date().toISOString(),
        }, ...prev]);
        break;
    }
  }, [lastEvent, sprint, sprintId, fetchSprint]);

  const resolveCheckpoint = useCallback(async (checkpointId: string, resolution: string, userInput?: string) => {
    await api.resolveCheckpoint(checkpointId, { resolution, user_input: userInput });
    // Optimistic update
    setSprint((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        checkpoints: prev.checkpoints.map((c) =>
          c.id === checkpointId ? { ...c, status: "resolved" as const, resolution } : c
        ),
      };
    });
  }, []);

  const sendInput = useCallback((content: string) => {
    sendMessage({ type: "user_input", content });
    // Also send via REST as backup
    api.sendInput(projectId, sprintId, { content }).catch(() => {});
  }, [sendMessage, projectId, sprintId]);

  return {
    sprint,
    traceEvents,
    isLoading,
    error,
    isConnected,
    resolveCheckpoint,
    sendInput,
    refetch: fetchSprint,
  };
}
