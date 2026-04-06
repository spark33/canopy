"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer";
  const variants = {
    primary: "bg-text-primary text-white border border-text-primary hover:opacity-90",
    secondary: "bg-surface text-text-primary border border-border-strong hover:bg-surface-alt",
    ghost: "bg-transparent text-text-secondary hover:bg-surface-alt border-none",
  };
  const sizes = {
    sm: "text-[11px] px-3 py-1.5 rounded-sm",
    md: "text-[12px] px-4 py-[7px] rounded",
    lg: "text-[13px] px-5 py-2.5 rounded-md",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], (disabled || loading) && "opacity-50 cursor-not-allowed", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-3 w-3" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
