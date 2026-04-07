"use client";

import { useState } from "react";

interface InputBarProps {
  onSend: (content: string) => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  disabled?: boolean;
  isPaused: boolean;
  sprintStatus: string;
}

export function InputBar({ onSend, onPause, onResume, onCancel, disabled, isPaused, sprintStatus }: InputBarProps) {
  const [value, setValue] = useState("");
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  }

  const isRunning = ["running", "planning", "synthesizing"].includes(sprintStatus);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-[680px] px-4">
      <div className="bg-surface border border-border-strong rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Input row */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5 pl-[18px] pr-1.5 py-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isPaused ? "Sprint paused — type your message..." : "Tell the orchestrator something..."}
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

        {/* Controls row */}
        <div className="flex items-center gap-3 px-[18px] pb-2.5 pt-0.5">
          {isPaused ? (
            <button
              onClick={onResume}
              className="flex items-center gap-1.5 text-[11px] font-medium text-green hover:text-green-text transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M4 3l10 5-10 5V3z" fill="currentColor"/>
              </svg>
              Resume
            </button>
          ) : isRunning ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 text-[11px] font-medium text-amber hover:text-amber-text transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="2" width="4" height="12" rx="1" fill="currentColor"/>
                <rect x="9" y="2" width="4" height="12" rx="1" fill="currentColor"/>
              </svg>
              Pause
            </button>
          ) : null}

          {showConfirmCancel ? (
            <span className="flex items-center gap-2 text-[11px]">
              <span className="text-text-tertiary">Stop sprint?</span>
              <button onClick={() => { onCancel(); setShowConfirmCancel(false); }} className="font-medium text-red hover:underline">
                Confirm
              </button>
              <button onClick={() => setShowConfirmCancel(false)} className="font-medium text-text-tertiary hover:underline">
                No
              </button>
            </span>
          ) : (
            <button
              onClick={() => setShowConfirmCancel(true)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-text-tertiary hover:text-red transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="12" height="12" rx="2" fill="currentColor"/>
              </svg>
              Stop
            </button>
          )}

          {isPaused && (
            <span className="ml-auto text-[10px] text-amber font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-dot animate-pulse-gentle" />
              Paused
            </span>
          )}

          {!isPaused && isRunning && (
            <span className="ml-auto text-[10px] text-text-tertiary">
              {disabled ? "Reconnecting..." : "Connected"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
