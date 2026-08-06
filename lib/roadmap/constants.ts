import type { TaskStatus } from "./types";

export const KANBAN_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "planned", label: "Planned" },
  { key: "ready", label: "Ready" },
  { key: "in_progress", label: "In Progress" },
  { key: "in_review", label: "In Review" },
  { key: "blocked", label: "Blocked" },
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
  planned: "Planned",
  ready: "Ready",
  in_progress: "In Progress",
  in_review: "In Review",
  blocked: "Blocked",
  done: "Done",
};

export const PRIORITY_COLORS: Record<string, string> = {
  critical: "border-accent-rose/40 bg-accent-rose/10 text-accent-rose",
  high: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
  medium: "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan",
  low: "border-surface-border bg-surface-raised text-ink-muted",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: "border-surface-border bg-surface-raised text-ink-muted",
  planned: "border-accent-violet/30 bg-accent-violet/10 text-accent-violet",
  ready: "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan",
  in_progress: "border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan",
  in_review: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
  blocked: "border-accent-rose/50 bg-accent-rose/15 text-accent-rose",
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
