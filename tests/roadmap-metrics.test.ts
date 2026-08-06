import assert from "node:assert/strict";
import {
  completionPercent,
  computeMetrics,
  isTaskOverdue,
  weightedCompletion,
} from "../lib/roadmap/metrics";
import type { RoadmapMilestoneRecord, RoadmapTaskRecord } from "../lib/roadmap/types";

const baseTask = (overrides: Partial<RoadmapTaskRecord>): RoadmapTaskRecord => ({
  id: "t1",
  title: "Test",
  description: null,
  category: "Test",
  workstream: "Engineering",
  phase: "Phase 0 — Product definition and architecture",
  status: "backlog",
  priority: "medium",
  owner: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  startDate: null,
  dueDate: null,
  completedAt: null,
  estimatedEffort: null,
  actualEffort: null,
  progressPercentage: 0,
  milestoneId: null,
  parentTaskId: null,
  dependencyIds: [],
  blockedBy: null,
  blockingReason: null,
  successCriteria: null,
  deliverables: null,
  notes: null,
  links: [],
  tags: [],
  riskLevel: null,
  isCriticalPath: false,
  order: 0,
  ...overrides,
});

assert.equal(completionPercent(2, 4), 50);
assert.equal(weightedCompletion([baseTask({ progressPercentage: 40 }), baseTask({ progressPercentage: 60 })]), 50);

const overdue = baseTask({
  id: "o1",
  dueDate: new Date("2020-01-01"),
  status: "in_progress",
});
assert.equal(isTaskOverdue(overdue), true);

const metrics = computeMetrics(
  [
    baseTask({ id: "a", status: "done", progressPercentage: 100 }),
    baseTask({ id: "b", status: "in_progress", progressPercentage: 50, isCriticalPath: true }),
  ],
  [
    {
      id: "m1",
      title: "M1",
      description: null,
      targetDate: new Date(Date.now() + 86400000 * 30),
      status: "not_started",
      completionPercentage: 0,
      exitCriteria: null,
      risks: null,
      owner: null,
      evidence: null,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies RoadmapMilestoneRecord,
  ],
  [],
);

assert.equal(metrics.tasksTotal, 2);
assert.equal(metrics.tasksCompleted, 1);
assert.equal(metrics.overallCompletion, 50);

console.log("roadmap-metrics.test.ts: all assertions passed");
