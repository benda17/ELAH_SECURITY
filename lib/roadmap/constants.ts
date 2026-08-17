import { TASK_PRIORITIES, type TaskStatus } from "./types";

export const KANBAN_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "in_review", label: "In Review" },
  { key: "done", label: "Done" },
];

export const PHASE_ORDER = [
  "Phase 0 — Product definition and architecture",
  "Phase 1 — Banking simulator stabilization",
  "Phase 2 — Agent observability and event collection",
  "Phase 3 — ELAH service foundation",
  "Phase 4 — Dataset and labeling system",
  "Phase 5 — Baseline scoring system",
  "Phase 6 — ELAH model development",
  "Phase 7 — Explainability and intention graph",
  "Phase 8 — Security architecture and red teaming",
  "Phase 9 — Product dashboard and analyst experience",
  "Phase 10 — Evaluation and MVP readiness",
  "Phase 11 — User discovery and customer validation",
  "Phase 12 — Pilot acquisition",
  "Phase 13 — Fundraising and investor outreach",
  "Phase 14 — Company, legal, privacy, and compliance",
  "Phase 15 — Team and operations",
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

/** Initial critical-path task title fragments (matched during seed). */
export const CRITICAL_PATH_FRAGMENTS = [
  "Audit the existing banking simulator",
  "Audit the current repository",
  "Define the event schema",
  "Define the input contract for ELAH",
  "Define the output contract for ELAH",
  "Capture tool-call requests",
  "Create a normalized event envelope",
  "Define the scoring API",
  "Create a mock scoring implementation",
  "Connect the existing banking simulator to the mock ELAH service",
  "Define the label taxonomy",
  "Create synthetic legitimate banking scenarios",
  "Build a deterministic rules-based baseline",
  "Define evaluation metrics",
  "Conduct banking-domain interviews",
];

export const READINESS_WORKSTREAM_MAP: Record<string, keyof import("./types").RoadmapMetrics["readiness"]> = {
  Engineering: "technical",
  Data: "data",
  Model: "model",
  Product: "product",
  Dashboard: "product",
  Business: "customerValidation",
  Security: "technical",
  Legal: "pilot",
  Operations: "fundraising",
};
