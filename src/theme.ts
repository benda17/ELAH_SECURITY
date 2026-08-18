export const colors = {
  bg: "#060b16",
  raised: "#0d1526",
  card: "#121c30",
  border: "rgba(148, 163, 184, 0.18)",
  ink: "#e8eef8",
  muted: "#8b9bb4",
  dim: "#64748b",
  cyan: "#22d3ee",
  rose: "#fb7185",
  amber: "#fbbf24",
  emerald: "#34d399",
  violet: "#a78bfa",
};

export const statusColors: Record<string, string> = {
  backlog: colors.dim,
  in_progress: colors.amber,
  blocked: colors.rose,
  in_review: colors.violet,
  done: colors.emerald,
};

export const priorityColors: Record<string, string> = {
  critical: colors.rose,
  high: colors.amber,
  medium: colors.cyan,
  low: colors.dim,
};

export const STATUSES = [
  "backlog",
  "in_progress",
  "blocked",
  "in_review",
  "done",
] as const;

export function prettyStatus(status: string) {
  return status.replace(/_/g, " ");
}
