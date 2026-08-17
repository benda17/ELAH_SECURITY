/**
 * Roadmap metrics — formulas documented for founder dashboard KPIs.
 *
 * overallCompletion = round(100 * doneTasks / totalTasks)
 * weightedCompletion = round(100 * sum(progressPercentage) / (totalTasks * 100))
 * phaseCompletion(phase) = round(100 * doneInPhase / totalInPhase)
 * workstreamCompletion(ws) = round(100 * doneInWs / totalInWs)
 * criticalPathCompletion = round(100 * doneCritical / totalCritical)
 * readiness(workstream) = average progressPercentage for tasks in mapped workstreams / 100
 * overdue = dueDate < today AND status not in (done)
 * pilotReadiness = average completion of phases 10,12 milestones weighted
 */
import { PHASE_ORDER, PRIORITY_RANK, READINESS_WORKSTREAM_MAP } from "./constants";
import type {
  RoadmapContactRecord,
  RoadmapMetrics,
  RoadmapMilestoneRecord,
  RoadmapTaskRecord,
} from "./types";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

export function isTaskOverdue(task: RoadmapTaskRecord, now = new Date()): boolean {
  if (!task.dueDate || task.status === "done") return false;
  return startOfDay(task.dueDate) < startOfDay(now);
}

export function isTaskActive(task: RoadmapTaskRecord): boolean {
  return task.status === "in_progress" || task.status === "in_review";
}

export function completionPercent(done: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function weightedCompletion(tasks: RoadmapTaskRecord[]): number {
  if (tasks.length === 0) return 0;
  const sum = tasks.reduce((acc, t) => acc + t.progressPercentage, 0);
  return Math.round(sum / tasks.length);
}

export function readinessByWorkstream(
  tasks: RoadmapTaskRecord[],
  workstreams: string[],
): number {
  const subset = tasks.filter((t) => workstreams.includes(t.workstream));
  return weightedCompletion(subset);
}

export function currentPhase(tasks: RoadmapTaskRecord[]): string {
  for (const phase of PHASE_ORDER) {
    const phaseTasks = tasks.filter((t) => t.phase === phase);
    if (phaseTasks.length === 0) continue;
    const allDone = phaseTasks.every((t) => t.status === "done");
    if (!allDone) return phase;
  }
  return PHASE_ORDER[PHASE_ORDER.length - 1];
}

export function computeMetrics(
  tasks: RoadmapTaskRecord[],
  milestones: RoadmapMilestoneRecord[],
  contacts: RoadmapContactRecord[],
  now = new Date(),
): RoadmapMetrics {
  const done = tasks.filter((t) => t.status === "done");
  const inProgress = tasks.filter(isTaskActive);
  const blocked = tasks.filter((t) => t.status === "blocked");
  const overdue = tasks.filter((t) => isTaskOverdue(t, now));
  const critical = tasks.filter((t) => t.isCriticalPath);
  const criticalDone = critical.filter((t) => t.status === "done");

  const completionByPhase = PHASE_ORDER.map((phase) => {
    const pt = tasks.filter((t) => t.phase === phase);
    const pd = pt.filter((t) => t.status === "done");
    return {
      phase,
      percent: completionPercent(pd.length, pt.length),
      done: pd.length,
      total: pt.length,
    };
  }).filter((p) => p.total > 0);

  const workstreams = [...new Set(tasks.map((t) => t.workstream))].sort();
  const completionByWorkstream = workstreams.map((workstream) => {
    const wt = tasks.filter((t) => t.workstream === workstream);
    const wd = wt.filter((t) => t.status === "done");
    return {
      workstream,
      percent: completionPercent(wd.length, wt.length),
      done: wd.length,
      total: wt.length,
    };
  });

  const upcomingMilestones = [...milestones]
    .filter((m) => m.status !== "complete")
    .sort((a, b) => {
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return a.targetDate.getTime() - b.targetDate.getTime();
    });

  const nextMilestone = upcomingMilestones[0] ?? null;
  const daysToNextMilestone =
    nextMilestone?.targetDate != null
      ? daysBetween(now, nextMilestone.targetDate)
      : null;

  const topPriorities = [...tasks]
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const pr =
        (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
      if (pr !== 0) return pr;
      if (a.isCriticalPath !== b.isCriticalPath)
        return a.isCriticalPath ? -1 : 1;
      if (a.dueDate && b.dueDate)
        return a.dueDate.getTime() - b.dueDate.getTime();
      return a.order - b.order;
    })
    .slice(0, 5);

  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weeklyDue = tasks.filter(
    (t) =>
      t.dueDate &&
      t.status !== "done" &&
      t.dueDate >= startOfDay(now) &&
      t.dueDate <= weekEnd,
  );

  const overdueFollowUps = contacts.filter(
    (c) => c.nextFollowUp && startOfDay(c.nextFollowUp) < startOfDay(now),
  );

  return {
    overallCompletion: completionPercent(done.length, tasks.length),
    tasksCompleted: done.length,
    tasksTotal: tasks.length,
    tasksInProgress: inProgress.length,
    tasksBlocked: blocked.length,
    tasksOverdue: overdue.length,
    criticalPathCompletion: completionPercent(criticalDone.length, critical.length),
    currentPhase: currentPhase(tasks),
    nextMilestone,
    daysToNextMilestone,
    completionByPhase,
    completionByWorkstream,
    readiness: {
      technical: readinessByWorkstream(tasks, ["Engineering", "Security"]),
      data: readinessByWorkstream(tasks, ["Data"]),
      model: readinessByWorkstream(tasks, ["Model"]),
      product: readinessByWorkstream(tasks, ["Product", "Dashboard"]),
      pilot: weightedCompletion(
        tasks.filter((t) => t.phase.includes("Phase 12") || t.phase.includes("Phase 10")),
      ),
      customerValidation: readinessByWorkstream(tasks, ["Business"]),
      fundraising: weightedCompletion(
        tasks.filter((t) => t.phase.includes("Phase 13")),
      ),
    },
    topPriorities,
    weeklyDue,
    overdueFollowUps,
  };
}

export function milestoneCompletionFromTasks(
  milestoneId: string,
  tasks: RoadmapTaskRecord[],
): number {
  const linked = tasks.filter((t) => t.milestoneId === milestoneId);
  if (linked.length === 0) return 0;
  return weightedCompletion(linked);
}
