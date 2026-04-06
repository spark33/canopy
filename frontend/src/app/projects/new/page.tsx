"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [autonomyMode, setAutonomyMode] = useState("adaptive");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const project = await api.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        autonomy_mode: autonomyMode,
      });
      router.push(`/projects/${project.id}`);
    } catch {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="max-w-[600px] mx-auto px-7 py-8">
        <h1 className="text-[18px] font-medium mb-6">New project</h1>
        <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <Input
            label="Project name"
            placeholder="e.g., AI Code Editor Landscape"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Description"
            placeholder="What should this project accomplish?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.3px]">
              Autonomy mode
            </label>
            <select
              value={autonomyMode}
              onChange={(e) => setAutonomyMode(e.target.value)}
              className="w-full px-3 py-2 text-[14px] bg-surface border border-border-strong rounded text-text-primary"
            >
              <option value="supervised">Supervised - always ask before proceeding</option>
              <option value="adaptive">Adaptive - ask when confidence is low</option>
              <option value="autonomous">Autonomous - minimal checkpoints</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" loading={creating} onClick={handleCreate}>Create project</Button>
            <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
