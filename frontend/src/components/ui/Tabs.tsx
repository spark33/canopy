"use client";

import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "px-4 py-2 text-[13px] font-medium transition-colors duration-150 border-b-2 -mb-px",
            value === tab.id
              ? "border-text-primary text-text-primary"
              : "border-transparent text-text-tertiary hover:text-text-secondary"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-[10px] bg-surface-alt text-text-tertiary px-1.5 py-0.5 rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
