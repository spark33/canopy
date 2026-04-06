"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const variantStyles = {
  success: "bg-green-bg text-green-text",
  warning: "bg-amber-bg text-amber-text",
  danger: "bg-red-bg text-red",
  info: "bg-accent-bg text-accent-text",
  neutral: "bg-surface-alt text-text-tertiary",
};

export function Badge({ variant = "neutral", size = "sm", children, className, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variantStyles[variant],
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1",
        pulse && "animate-pulse-gentle",
        className
      )}
    >
      {children}
    </span>
  );
}
