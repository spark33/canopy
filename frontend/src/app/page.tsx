"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ProjectCard } from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useProjects } from "@/hooks/useProject";
import { api } from "@/lib/api";

export default function ProjectsPage() {
  const { projects, isLoading, refetch } = useProjects();
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const project = await api.createProject({ name: name.trim(), description: description.trim() || undefined });
      router.push(`/projects/${project.id}`);
    } catch {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="max-w-[1100px] mx-auto px-7 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[18px] font-medium">Projects</h1>
          <Button variant="primary" onClick={() => setShowNew(true)}>New project</Button>
        </div>

        {showNew && (
          <div className="bg-surface border border-border rounded-lg p-5 mb-6">
            <div className="grid gap-3 max-w-[500px]">
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
              <div className="flex gap-2 mt-1">
                <Button variant="primary" loading={creating} onClick={handleCreate}>Create project</Button>
                <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-lg p-5">
                <div className="animate-shimmer h-4 rounded-sm w-[60%] mb-3" />
                <div className="animate-shimmer h-3 rounded-sm w-[80%] mb-2" />
                <div className="animate-shimmer h-3 rounded-sm w-[40%]" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-[14px] text-text-tertiary mb-4">No projects yet</div>
            <Button variant="primary" onClick={() => setShowNew(true)}>Create your first project</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
