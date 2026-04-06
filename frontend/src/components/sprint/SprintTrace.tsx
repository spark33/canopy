"use client";

import { TraceEvent } from "./TraceEvent";
import type { TraceEvent as TraceEventType } from "@/lib/types";

interface SprintTraceProps {
  events: TraceEventType[];
  loading?: boolean;
}

export function SprintTrace({ events, loading }: SprintTraceProps) {
  if (loading) {
    return (
      <div className="p-6">
        <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-4">
          Trace timeline
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-surface-alt mt-1.5" />
              <div className="flex-1 space-y-1.5">
                <div className="animate-shimmer h-3 rounded-sm w-[40%]" />
                <div className="animate-shimmer h-2.5 rounded-sm w-[60%]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.5px] mb-4">
        Trace timeline ({events.length} events)
      </div>
      <div className="space-y-0">
        {events.map((event) => (
          <TraceEvent key={event.id} event={event} />
        ))}
      </div>
      {events.length === 0 && (
        <div className="text-[13px] text-text-tertiary italic py-8">
          No trace events yet. Events will appear as the sprint runs.
        </div>
      )}
    </div>
  );
}
