"use client";

import type { Artifact, Checkpoint } from "@/lib/types";

interface SprintOutputProps {
  artifact: Artifact | null;
  checkpoints: Checkpoint[];
  onResolveCheckpoint: (checkpointId: string, resolution: string) => void;
}

export function SprintOutput({ artifact, checkpoints, onResolveCheckpoint }: SprintOutputProps) {
  if (!artifact || !artifact.content) {
    return (
      <div className="max-w-[800px] mx-auto py-10 px-[60px]">
        <div className="text-[14px] text-text-tertiary italic">
          No artifact content yet. The synthesizer agent will produce the document once research is complete.
        </div>
        <div className="mt-8 space-y-3">
          <div className="animate-shimmer h-5 rounded-sm w-[50%]" />
          <div className="animate-shimmer h-3.5 rounded-sm w-[90%]" />
          <div className="animate-shimmer h-3.5 rounded-sm w-[80%]" />
          <div className="animate-shimmer h-3.5 rounded-sm w-[60%]" />
          <div className="h-4" />
          <div className="animate-shimmer h-3.5 rounded-sm w-[85%]" />
          <div className="animate-shimmer h-3.5 rounded-sm w-[70%]" />
        </div>
      </div>
    );
  }

  const pendingConflicts = checkpoints.filter(
    (c) => c.status === "pending" && c.checkpoint_type === "data_conflict"
  );

  return (
    <div className="max-w-[800px] mx-auto py-10 px-[60px]">
      <h1 className="font-serif text-[28px] font-semibold leading-[1.3] mb-2">
        {artifact.title}
      </h1>
      <div className="text-[14px] text-text-tertiary mb-8">
        Version {artifact.version}
        {artifact.sections && (
          <span> &middot; {artifact.sections.filter(s => s.status === "complete").length} of {artifact.sections.length} sections complete</span>
        )}
      </div>

      {/* Pending conflicts */}
      {pendingConflicts.map((cp) => (
        <div key={cp.id} className="border-l-[3px] border-amber-dot pl-[18px] py-3.5 pr-[18px] mb-4 bg-amber-bg rounded-r-md">
          <div className="text-[11px] font-semibold text-amber uppercase tracking-[0.3px] mb-1.5 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Conflicting data &mdash; needs your input
          </div>
          <div className="text-[13px] text-text-primary leading-relaxed mb-3">{cp.description}</div>
          <div className="flex gap-2">
            {cp.options?.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onResolveCheckpoint(cp.id, opt.id)}
                className={`text-[12px] font-medium px-3.5 py-1.5 rounded cursor-pointer border transition-all duration-150 ${
                  opt.primary
                    ? "bg-text-primary text-white border-transparent"
                    : "bg-surface text-text-primary border-border-strong hover:bg-surface-alt"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Rendered markdown content */}
      <div
        className="font-serif text-[15px] text-text-secondary leading-[1.75] prose prose-headings:font-serif prose-headings:text-text-primary prose-h2:text-[18px] prose-h2:font-semibold prose-h2:mb-3 prose-p:mb-3.5"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(artifact.content) }}
      />

      {/* Pending sections */}
      {artifact.sections?.filter(s => s.status === "pending").map((section) => (
        <div key={section.id} className="mt-8">
          <h2 className="font-serif text-[18px] font-semibold text-text-tertiary mb-4">
            {section.title}
          </h2>
          <div className="space-y-2.5">
            <div className="animate-shimmer h-5 rounded-sm w-[50%]" />
            <div className="animate-shimmer h-3.5 rounded-sm w-[90%]" />
            <div className="animate-shimmer h-3.5 rounded-sm w-[80%]" />
            <div className="animate-shimmer h-3.5 rounded-sm w-[60%]" />
          </div>
          <div className="text-[12px] text-text-tertiary italic mt-3">
            This section will populate when the agent completes.
          </div>
        </div>
      ))}
    </div>
  );
}

function renderMarkdown(content: string): string {
  // Simple markdown to HTML conversion
  return content
    .replace(/^### (.+)$/gm, '<h3 class="text-[16px] font-semibold mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-[18px] font-semibold mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-[24px] font-semibold mt-8 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary font-medium">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(\d+)\]/g, '<span class="inline bg-teal-bg text-teal-text text-[10px] font-semibold px-1.5 py-0.5 rounded align-super ml-0.5 cursor-pointer">$1</span>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-3.5">')
    .replace(/^(?!<[hl]|<li)(.+)$/gm, '<p class="mb-3.5">$1</p>')
    .replace(/<\/li>\n<li/g, '</li><li');
}
