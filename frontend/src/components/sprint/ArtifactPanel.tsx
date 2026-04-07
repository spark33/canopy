"use client";

import type { Artifact } from "@/lib/types";

interface ArtifactCardProps {
  artifact: Artifact | null;
  onClick: () => void;
}

export function ArtifactCard({ artifact, onClick }: ArtifactCardProps) {
  if (!artifact || !artifact.content) {
    return (
      <div className="bg-surface border border-border rounded-[14px] p-[18px_20px] opacity-50">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.3px] text-accent-text">Document</span>
          <span className="ml-auto text-[10px] text-text-tertiary">Pending</span>
        </div>
        <div className="text-[12px] text-text-tertiary italic pl-4 mt-1">
          Will be generated after research completes.
        </div>
      </div>
    );
  }

  const preview = artifact.content.replace(/[#*\[\]|`>-]/g, "").slice(0, 200);

  return (
    <div
      onClick={onClick}
      className="bg-surface border border-accent/20 rounded-[14px] p-[18px_20px] cursor-pointer transition-all duration-150 hover:border-accent/40 hover:shadow-[0_0_0_1px_rgba(83,74,183,0.1)]"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-accent" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.3px] text-accent-text">Document</span>
        <span className="ml-auto text-[10px] text-text-tertiary">v{artifact.version}</span>
      </div>
      <div className="pl-4">
        <div className="text-[13px] font-medium mb-1">{artifact.title}</div>
        <div className="text-[11px] text-text-tertiary leading-snug line-clamp-3">
          {preview}...
        </div>
        {artifact.sections && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {artifact.sections.map((s) => (
              <span
                key={s.id}
                className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                  s.status === "complete"
                    ? "bg-green-bg text-green-text"
                    : s.status === "draft"
                    ? "bg-amber-bg text-amber-text"
                    : "bg-surface-alt text-text-tertiary"
                }`}
              >
                {s.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ArtifactSidebarProps {
  artifact: Artifact;
  onClose: () => void;
}

export function ArtifactSidebar({ artifact, onClose }: ArtifactSidebarProps) {
  return (
    <div className="w-[420px] border-l border-border bg-surface flex flex-col flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px]">
          Document
        </div>
        <button
          onClick={onClose}
          className="text-[11px] text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <h1 className="font-serif text-[20px] font-semibold leading-[1.3] mb-2">
          {artifact.title}
        </h1>
        <div className="text-[11px] text-text-tertiary mb-4">
          Version {artifact.version}
          {artifact.sections && (
            <span> &middot; {artifact.sections.filter(s => s.status === "complete").length}/{artifact.sections.length} sections</span>
          )}
        </div>

        <div
          className="font-serif text-[14px] text-text-secondary leading-[1.75]"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(artifact.content || "") }}
        />
      </div>
    </div>
  );
}

function renderMarkdown(content: string): string {
  return content
    .replace(/^### (.+)$/gm, '<h3 class="text-[15px] font-semibold mt-5 mb-2 font-serif text-text-primary">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-[17px] font-semibold mt-6 mb-2 font-serif text-text-primary">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-[20px] font-semibold mt-6 mb-2 font-serif text-text-primary">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary font-medium">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(\d+)\]/g, '<span class="inline bg-teal-bg text-teal-text text-[9px] font-semibold px-1 py-0.5 rounded align-super ml-0.5">$1</span>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/^(?!<[hlp]|<li|<table|<tr)(.+)$/gm, '<p class="mb-3">$1</p>');
}
