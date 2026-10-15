/**
 * The CS/CRM wedge is not on the APACT execution board.
 * Empty task list: scripts/seed-phase16-cs-crm-wedge.ts must not recreate those cards.
 * Do not run that script. It can still insert a retired milestone row.
 */
import type { TaskPriority, TaskStatus, Workstream } from "../types";

export const PHASE16_NAME = "Phase 16 — retired CS/CRM wedge";

export const PHASE16_MILESTONE = {
  order: 99,
  title: "Retired — CS/CRM wedge is not the APACT execution plan",
  exitCriteria:
    "Do not use this milestone. ELAH V2 is APACT, a CAPTCHA for agents. The execution board is Phases 0–10.",
  targetMonthsFromNow: 0,
} as const;

export const PHASE_11_12_PIVOT_BANNER =
  "RETIRED (15 Oct 2026): The CS/CRM wedge is not the execution plan. ELAH V2 is APACT, a CAPTCHA for agents.\n\n";

export interface Phase16TaskSpec {
  title: string;
  workstream: Workstream;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;
  isCriticalPath: boolean;
  progressPercentage: number;
  estimatedEffort: string;
  description: string;
  successCriteria: string;
  deliverables: string;
  notes: string;
  links: string[];
  syncStatus?: boolean;
}

export const PHASE16_TASKS: Phase16TaskSpec[] = [];

export function phase16TaskId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `task-16-${slug}`.slice(0, 64);
}
