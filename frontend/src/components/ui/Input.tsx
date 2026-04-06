"use client";

import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.3px]">{label}</label>}
      <input
        className={cn(
          "w-full px-3 py-2 text-[14px] bg-surface border border-border-strong rounded text-text-primary outline-none placeholder:text-text-tertiary transition-[border-color] duration-150 focus:border-accent",
          error && "border-red",
          className
        )}
        {...props}
      />
      {error && <span className="text-[11px] text-red">{error}</span>}
    </div>
  );
}
