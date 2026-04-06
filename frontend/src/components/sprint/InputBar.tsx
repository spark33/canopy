"use client";

import { useState } from "react";

interface InputBarProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function InputBar({ onSend, disabled }: InputBarProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  }

  return (
    <div className="sticky bottom-0 pt-4 pb-4 bg-gradient-to-t from-bg via-bg to-transparent">
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5 bg-surface border border-border-strong rounded-[14px] pl-[18px] pr-1.5 py-1.5 max-w-[700px]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Tell the orchestrator something..."
          className="flex-1 border-none outline-none text-[14px] text-text-primary bg-transparent placeholder:text-text-tertiary"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="w-9 h-9 rounded-md bg-text-primary flex items-center justify-center transition-opacity hover:opacity-80 disabled:opacity-30 flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="#FAFAF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
