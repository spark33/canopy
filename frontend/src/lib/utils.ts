export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return String(tokens);
}

export function formatCost(cents: number): string {
  if (cents >= 100) return `$${(cents / 100).toFixed(2)}`;
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export function formatElapsed(startedAt: string, completedAt?: string | null): string {
  const start = parseUTC(startedAt);
  const end = completedAt ? parseUTC(completedAt) : Date.now();
  return formatDuration(end - start);
}

function parseUTC(dateStr: string): number {
  // Backend returns timestamps without timezone suffix.
  // Append Z if missing so JS parses them as UTC.
  if (!dateStr.endsWith("Z") && !dateStr.includes("+")) {
    dateStr = dateStr + "Z";
  }
  return new Date(dateStr).getTime();
}

export function timeAgo(dateStr: string): string {
  const date = new Date(parseUTC(dateStr));
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
