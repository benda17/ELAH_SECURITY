import { TASK_PRIORITIES, type TaskStatus } from "./types";

export const KANBAN_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "in_review", label: "In Review" },
  { key: "done", label: "Done" },
];

export function phaseShortLabel(phase: string): string {
  const match = phase.match(/^Phase (\d+)\s+—\s+(.+)$/);
  if (!match) return phase;
  return `P${match[1]} — ${match[2]}`;
}

export const PHASE_ORDER = [
  "Phase 0 — APACT product definition",
  "Phase 1 — Thin guest-travel slice",
  "Phase 2 — Durable APACT service",
  "Phase 3 — Partner integration kit",
  "Phase 4 — Step-up and authority adapters",
  "Phase 5 — Second task profile",
  "Phase 6 — Adversarial evaluation",
  "Phase 7 — Hosted deployment",
  "Phase 8 — Design partners",
  "Phase 9 — Company, legal, and privacy",
  "Phase 10 — Fundraising narrative for the pivot",
] as const;

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  blocked: "Blocked",
  in_review: "In Review",
  done: "Done",
};

export const PRIORITY_COLORS: Record<string, string> = {
  critical: "border-accent-rose/40 bg-accent-rose/10 text-accent-rose",
  high: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
  medium: "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan",
  low: "border-surface-border bg-surface-raised text-ink-muted",
};

/** Lower rank = higher importance. Used so critical cards stay at the top. */
export const PRIORITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const PRIORITY_FILTERS = ["all", ...TASK_PRIORITIES] as const;
export type PriorityFilter = (typeof PRIORITY_FILTERS)[number];

export const PRIORITY_LABELS: Record<PriorityFilter, string> = {
  all: "All",
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function compareTasksByImportance<
  T extends {
    priority: string;
    isCriticalPath: boolean;
    order: number;
    title: string;
  },
>(a: T, b: T): number {
  const byPriority =
    (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
  if (byPriority !== 0) return byPriority;
  if (a.isCriticalPath !== b.isCriticalPath) return a.isCriticalPath ? -1 : 1;
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title);
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: "border-surface-border bg-surface-raised text-ink-muted",
  in_progress: "border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan",
  blocked: "border-accent-rose/50 bg-accent-rose/15 text-accent-rose",
  in_review: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
  done: "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald",
};

/** Critical-path task title fragments (matched during APACT seed). */
export const CRITICAL_PATH_FRAGMENTS = [
  "Specify the eight APACT fields",
  "Write the guest-travel profile",
  "Run the baseline, pressure, and relabel",
  "Verify each partner request with DPoP",
  "Ship the entrance widget",
  "Replace the in-memory challenge store",
  "Move the DPoP replay cache",
  "Move revocation status to shared storage",
  "Split a versioned partner verifier",
  "Build a partner approval screen",
  "Write an evaluation plan",
  "Deploy APACT on a public HTTPS origin",
  "Update the 13 Oct 2026 investor source brief",
];

/**
 * APACT readiness. There is no intention-scoring model: protocol and
 * verifier work map to technical, and the narrative maps to fundraising.
 * Legal has no readiness key of its own; partner-facing privacy sits on pilot.
 */
export const READINESS_WORKSTREAM_MAP: Record<string, keyof import("./types").RoadmapMetrics["readiness"]> = {
  Engineering: "technical",
  Security: "technical",
  Product: "product",
  Dashboard: "product",
  Data: "data",
  Model: "technical",
  Business: "customerValidation",
  Legal: "pilot",
  Operations: "fundraising",
};
