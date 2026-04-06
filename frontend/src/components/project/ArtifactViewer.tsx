"use client";

import type { Artifact } from "@/lib/types";

interface ArtifactViewerProps {
  artifact: Artifact | null;
}

export function ArtifactViewer({ artifact }: ArtifactViewerProps) {
  if (!artifact || !artifact.content) {
    return (
      <div className="text-[13px] text-text-tertiary italic py-4">
        No artifact yet. Run a sprint to generate content.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-medium">{artifact.title}</h3>
        <span className="text-[11px] text-text-tertiary">v{artifact.version}</span>
      </div>
      <div
        className="font-serif text-[14px] text-text-secondary leading-[1.7] max-h-[500px] overflow-y-auto"
        dangerouslySetInnerHTML={{
          __html: artifact.content
            .replace(/^### (.+)$/gm, '<h3 class="text-[15px] font-semibold mt-4 mb-2 font-serif">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="text-[17px] font-semibold mt-5 mb-2 font-serif">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="text-[20px] font-semibold mt-5 mb-2 font-serif">$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '<br/><br/>')
        }}
      />
    </div>
  );
}
