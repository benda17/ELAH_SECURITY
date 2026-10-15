/**
 * Phase 7 — Hosted deployment.
 * The APACT seed in phases.ts is the source of truth.
 * This module stays so scripts/seed-phase07-explainability.ts still typechecks.
 * Do not run that script to restore the intention-graph board: it would
 * overwrite Phase 7 card copy. syncStatus is false so it will not move status
 * on cards that already exist.
 */
import type { TaskPriority, TaskStatus, Workstream } from "../types";
import { CRITICAL_PATH_FRAGMENTS } from "../constants";
import { taskIdFor } from "./ids";
import { evidenceFor, MILESTONE_SPECS, PHASE_SPECS } from "./phases";

export const PHASE7_NAME = "Phase 7 — Hosted deployment";

export const PHASE7_DOC_DIR = "ELAH-APACT-PRODUCT";

const milestone = MILESTONE_SPECS.find((spec) => spec.order === 8);
if (!milestone) {
  throw new Error("Phase 7 milestone missing from MILESTONE_SPECS.");
}

export const PHASE7_MILESTONE = {
  order: milestone.order,
  title: milestone.title,
  exitCriteria: milestone.exitCriteria,
  /** Used only if the legacy seed script creates the milestone from scratch. */
  targetMonthsFromNow: 6,
} as const;

export interface Phase07TaskSpec {
  id: string;
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

const phase = PHASE_SPECS.find((spec) => spec.phase === PHASE7_NAME);
if (!phase) {
  throw new Error(`${PHASE7_NAME} missing from PHASE_SPECS.`);
}

function critical(title: string): boolean {
  const lower = title.toLowerCase();
  return CRITICAL_PATH_FRAGMENTS.some((fragment) => lower.includes(fragment.toLowerCase()));
}

export const PHASE07_TASKS: Phase07TaskSpec[] = phase.tasks.map((title) => {
  const evidence = evidenceFor(PHASE7_NAME, title);
  const isCriticalPath = critical(title);
  return {
    id: taskIdFor(7, title),
    title,
    workstream: phase.workstream,
    category: phase.category,
    status: evidence.status,
    priority: isCriticalPath ? "critical" : "high",
    isCriticalPath,
    progressPercentage: evidence.progress,
    estimatedEffort: "3d",
    description: evidence.doneWhen,
    successCriteria: evidence.doneWhen,
    deliverables: "A public HTTPS origin, or a written decision that hosting waits on shared storage.",
    notes: evidence.notes,
    links: ["ELAH-APACT-PRODUCT/README.md", "ELAH-TDD.md"],
    syncStatus: false,
  };
});

export function phase07TaskId(title: string): string {
  return taskIdFor(7, title);
}
