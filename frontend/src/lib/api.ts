const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(body || res.statusText, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Projects
  listProjects: () => request<import("./types").Project[]>("/projects"),
  createProject: (data: { name: string; description?: string; autonomy_mode?: string }) =>
    request<import("./types").Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  getProject: (id: string) => request<import("./types").Project>(`/projects/${id}`),
  updateProject: (id: string, data: Record<string, unknown>) =>
    request<import("./types").Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: "DELETE" }),

  // Sprints
  createSprint: (projectId: string, data: { goal: string; autonomy_mode?: string }) =>
    request<import("./types").Sprint>(`/projects/${projectId}/sprints`, { method: "POST", body: JSON.stringify(data) }),
  getSprint: (projectId: string, sprintId: string) =>
    request<import("./types").Sprint>(`/projects/${projectId}/sprints/${sprintId}`),
  updateSprint: (projectId: string, sprintId: string, data: Record<string, unknown>) =>
    request<import("./types").Sprint>(`/projects/${projectId}/sprints/${sprintId}`, { method: "PATCH", body: JSON.stringify(data) }),
  getSprintTrace: (projectId: string, sprintId: string, params?: { limit?: number; offset?: number; event_type?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    if (params?.event_type) query.set("event_type", params.event_type);
    return request<{ events: import("./types").TraceEvent[]; total: number; limit: number; offset: number }>(
      `/projects/${projectId}/sprints/${sprintId}/trace?${query}`
    );
  },

  // Tasks
  getTask: (taskId: string) => request<import("./types").Task>(`/tasks/${taskId}`),

  // Checkpoints
  resolveCheckpoint: (checkpointId: string, data: { resolution: string; user_input?: string }) =>
    request<import("./types").Checkpoint>(`/checkpoints/${checkpointId}/resolve`, { method: "POST", body: JSON.stringify(data) }),

  // User input
  sendInput: (projectId: string, sprintId: string, data: { content: string; references?: string[] }) =>
    request<{ acknowledged: boolean }>(`/projects/${projectId}/sprints/${sprintId}/input`, { method: "POST", body: JSON.stringify(data) }),

  // Artifacts
  getArtifact: (projectId: string) =>
    request<import("./types").Artifact | null>(`/projects/${projectId}/artifact`),
  getArtifactVersions: (projectId: string) =>
    request<import("./types").ArtifactVersion[]>(`/projects/${projectId}/artifact/versions`),
};
