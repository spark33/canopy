"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Checkpoint } from "@/lib/types";

interface CheckpointCardProps {
  checkpoint: Checkpoint;
  onResolve: (checkpointId: string, resolution: string, userInput?: string) => void;
}

export function CheckpointCard({ checkpoint, onResolve }: CheckpointCardProps) {
  const [resolving, setResolving] = useState(false);

  if (checkpoint.status === "resolved") {
    return (
      <div className="mt-3 px-3 py-2 bg-green-bg rounded-md text-[12px] text-green-text">
        Resolved: {checkpoint.resolution}
        {checkpoint.user_input && <span className="text-text-secondary"> &mdash; {checkpoint.user_input}</span>}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="text-[11px] font-semibold text-amber uppercase tracking-[0.3px] mb-2 flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        {checkpoint.checkpoint_type.replace(/_/g, " ")}
      </div>
      <div className="text-[13px] text-text-primary leading-relaxed mb-3">
        {checkpoint.description}
      </div>
      <div className="flex gap-2 flex-wrap">
        {checkpoint.options?.map((option) => (
          <Button
            key={option.id}
            variant={option.primary ? "primary" : "secondary"}
            size="sm"
            loading={resolving}
            onClick={async () => {
              setResolving(true);
              try {
                await onResolve(checkpoint.id, option.id);
              } finally {
                setResolving(false);
              }
            }}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
