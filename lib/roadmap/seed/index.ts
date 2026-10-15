import { prisma } from "@/lib/prisma";
import { CRITICAL_PATH_FRAGMENTS, PHASE_ORDER } from "../constants";
import { invalidateRoadmapCache } from "../page-cache";
import type { TaskPriority, TaskStatus } from "../types";
import { taskIdFor } from "./ids";
import { PHASE13_INVESTORS } from "./investors";
import {
  DECISION_SPECS,
  EXPERIMENT_SPECS,
  RISK_SPECS,
  TASK_DEPENDENCIES,
} from "./operating";
import {
  MILESTONE_SPECS,
  PHASE_SPECS,
  allTaskEvidence,
  evidenceFor,
} from "./phases";

/** Status comes only from the evidence row. Missing evidence throws. */
export function inferStatus(
  phase: string,
  title: string,
): { status: TaskStatus; progress: number; notes: string; doneWhen: string } {
  const row = evidenceFor(phase, title);
  return {
    status: row.status,
    progress: row.progress,
    notes: row.notes,
    doneWhen: row.doneWhen,
  };
}

function inferPriority(title: string, isCritical: boolean): TaskPriority {
  if (isCritical) return "critical";
  if (
    /specify|write the|write an|deploy|replace the in-memory|approval screen|evaluation plan|record founder/i.test(
      title,
    )
  ) {
    return "high";
  }
  return "medium";
}

function isCriticalPath(title: string): boolean {
  const lower = title.toLowerCase();
  return CRITICAL_PATH_FRAGMENTS.some((fragment) =>
    lower.includes(fragment.toLowerCase()),
  );
}

export function assertApactPlan(): void {
  if (PHASE_ORDER.length !== PHASE_SPECS.length) {
    throw new Error(
      `PHASE_ORDER has ${PHASE_ORDER.length} entries; APACT specs have ${PHASE_SPECS.length}.`,
    );
  }
  for (let i = 0; i < PHASE_SPECS.length; i++) {
    if (PHASE_ORDER[i] !== PHASE_SPECS[i].phase) {
      throw new Error(
        `PHASE_ORDER[${i}] is "${PHASE_ORDER[i]}"; spec is "${PHASE_SPECS[i].phase}".`,
      );
    }
  }
  if (MILESTONE_SPECS.length !== PHASE_SPECS.length) {
    throw new Error("Each APACT phase needs one milestone.");
  }
  const titles = new Map<string, string>();
  for (const { phase, task } of allTaskEvidence()) {
    if (titles.has(task.title)) {
      throw new Error(`Task title reused: ${task.title}`);
    }
    titles.set(task.title, phase);
  }
  for (const dep of TASK_DEPENDENCIES) {
    if (!titles.has(dep.child)) {
      throw new Error(`Dependency child is not a task: ${dep.child}`);
    }
    for (const parent of dep.parents) {
      if (!titles.has(parent)) {
        throw new Error(`Dependency parent is not a task: ${parent}`);
      }
    }
  }
  for (const fragment of CRITICAL_PATH_FRAGMENTS) {
    const hits = [...titles.keys()].filter((title) =>
      title.toLowerCase().includes(fragment.toLowerCase()),
    );
    if (hits.length !== 1) {
      throw new Error(
        `Critical-path fragment "${fragment}" matched ${hits.length} tasks.`,
      );
    }
  }
}

function completedAtFor(phase: string, status: TaskStatus): Date | null {
  if (status !== "done") return null;
  if (phase.startsWith("Phase 0")) return new Date("2026-10-06T12:00:00Z");
  return new Date("2026-10-13T12:00:00Z");
}

export async function seedRoadmapContent(): Promise<Record<string, number>> {
  assertApactPlan();
  const milestoneIds: string[] = [];

  for (const spec of MILESTONE_SPECS) {
    const milestone = await prisma.roadmapMilestone.create({
      data: {
        title: spec.title,
        description: spec.exitCriteria,
        targetDate: new Date(`${spec.targetDate}T12:00:00Z`),
        status: "not_started",
        completionPercentage: 0,
        exitCriteria: spec.exitCriteria,
        owner: "Founder",
        evidence: spec.evidence,
        order: spec.order,
      },
    });
    milestoneIds.push(milestone.id);
  }

  const idByTitle = new Map<string, string>();
  let order = 0;
  for (let phaseIndex = 0; phaseIndex < PHASE_SPECS.length; phaseIndex++) {
    const spec = PHASE_SPECS[phaseIndex];
    for (const title of spec.tasks) {
      order += 1;
      const critical = isCriticalPath(title);
      const inferred = inferStatus(spec.phase, title);
      const id = taskIdFor(phaseIndex, title);
      if (idByTitle.has(title)) {
        throw new Error(`Duplicate title while seeding: ${title}`);
      }
      idByTitle.set(title, id);
      await prisma.roadmapTask.create({
        data: {
          id,
          title,
          description: inferred.doneWhen,
          category: spec.category,
          workstream: spec.workstream,
          phase: spec.phase,
          status: inferred.status,
          priority: inferPriority(title, critical),
          owner: critical ? "Founder" : null,
          progressPercentage: inferred.progress,
          milestoneId: milestoneIds[phaseIndex] ?? null,
          isCriticalPath: critical,
          order,
          notes: inferred.notes,
          completedAt: completedAtFor(spec.phase, inferred.status),
          tags: JSON.stringify(critical ? ["critical-path", "apact"] : ["apact"]),
        },
      });
    }
  }

  for (const dep of TASK_DEPENDENCIES) {
    const childId = idByTitle.get(dep.child);
    const parentIds = dep.parents.map((parent) => {
      const id = idByTitle.get(parent);
      if (!id) throw new Error(`Missing parent id for ${parent}`);
      return id;
    });
    if (!childId) throw new Error(`Missing child id for ${dep.child}`);
    await prisma.roadmapTask.update({
      where: { id: childId },
      data: { dependencyIds: JSON.stringify(parentIds) },
    });
  }

  for (const decision of DECISION_SPECS) {
    await prisma.roadmapDecision.create({
      data: {
        question: decision.question,
        context: decision.context,
        options: JSON.stringify(decision.options),
        status: decision.status,
        owner: decision.owner,
      },
    });
  }

  for (const risk of RISK_SPECS) {
    await prisma.roadmapRisk.create({
      data: { ...risk, relatedTaskIds: "[]" },
    });
  }

  for (const experiment of EXPERIMENT_SPECS) {
    await prisma.roadmapExperiment.create({ data: experiment });
  }

  return {
    tasks: await prisma.roadmapTask.count(),
    milestones: await prisma.roadmapMilestone.count(),
    decisions: await prisma.roadmapDecision.count(),
    risks: await prisma.roadmapRisk.count(),
    experiments: await prisma.roadmapExperiment.count(),
  };
}

async function seedPlaceholderContacts(): Promise<void> {
  const contacts = [
    {
      name: "Fusion VC",
      organization: "Fusion VC",
      contactType: "investor",
      sector: "Venture Capital",
      relevance: "Israeli pre-seed/seed fund — AI, cybersecurity, fintech.",
      outreachStatus: "identified",
      priority: "high",
      notes: "Initial relevant lead per founder brief. Do not invent contact details.",
    },
    {
      name: "Design partner (not selected)",
      organization: "TBD",
      contactType: "design_partner",
      sector: "Website operator",
      relevance:
        "A site that might want guest agents to search and draft while payment, contracts, and export stay withheld. No partner is selected.",
      outreachStatus: "research",
      priority: "medium",
      notes:
        "Placeholder only. ELAH-TDD.md v0.3 says no real partner has been selected. Do not invent a company name.",
    },
    ...PHASE13_INVESTORS,
  ];

  for (const contact of contacts) {
    await prisma.roadmapContact.create({
      data: { ...contact, associatedTasks: "[]" },
    });
  }
}

export async function seedRoadmapIfEmpty(): Promise<{
  seeded: boolean;
  counts: Record<string, number>;
}> {
  await migrateRetiredTaskStatusesToBacklog();
  const existing = await prisma.roadmapTask.count();
  if (existing > 0) {
    return {
      seeded: false,
      counts: {
        tasks: existing,
        milestones: await prisma.roadmapMilestone.count(),
        contacts: await prisma.roadmapContact.count(),
      },
    };
  }

  const counts = await seedRoadmapContent();
  await seedPlaceholderContacts();
  return {
    seeded: true,
    counts: {
      ...counts,
      contacts: await prisma.roadmapContact.count(),
    },
  };
}

/**
 * Deletes execution-board rows and reseeds APACT.
 * RoadmapContact rows are preserved.
 */
export async function replaceApactRoadmap(): Promise<{
  deleted: Record<string, number>;
  seeded: Record<string, number>;
  contactsPreserved: number;
  byStatus: Record<string, number>;
  byPhase: { phase: string; total: number; done: number; in_progress: number; in_review: number; backlog: number }[];
  doneTitles: string[];
}> {
  assertApactPlan();
  const contactsBefore = await prisma.roadmapContact.count();

  await prisma.roadmapTask.updateMany({ data: { parentTaskId: null } });
  const tasks = await prisma.roadmapTask.deleteMany();
  const milestones = await prisma.roadmapMilestone.deleteMany();
  const risks = await prisma.roadmapRisk.deleteMany();
  const experiments = await prisma.roadmapExperiment.deleteMany();
  const decisions = await prisma.roadmapDecision.deleteMany();

  const seeded = await seedRoadmapContent();
  await recomputeMilestoneProgress();

  const contactsAfter = await prisma.roadmapContact.count();
  if (contactsAfter !== contactsBefore) {
    throw new Error(
      `RoadmapContact count changed from ${contactsBefore} to ${contactsAfter}.`,
    );
  }

  const rows = await prisma.roadmapTask.findMany({
    select: { title: true, phase: true, status: true },
    orderBy: { order: "asc" },
  });
  const byStatus: Record<string, number> = {};
  const phaseMap = new Map<
    string,
    { phase: string; total: number; done: number; in_progress: number; in_review: number; backlog: number }
  >();
  const doneTitles: string[] = [];
  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    if (row.status === "done") doneTitles.push(row.title);
    const bucket = phaseMap.get(row.phase) ?? {
      phase: row.phase,
      total: 0,
      done: 0,
      in_progress: 0,
      in_review: 0,
      backlog: 0,
    };
    bucket.total += 1;
    if (row.status === "done") bucket.done += 1;
    else if (row.status === "in_progress") bucket.in_progress += 1;
    else if (row.status === "in_review") bucket.in_review += 1;
    else if (row.status === "backlog") bucket.backlog += 1;
    phaseMap.set(row.phase, bucket);
  }

  return {
    deleted: {
      tasks: tasks.count,
      milestones: milestones.count,
      risks: risks.count,
      experiments: experiments.count,
      decisions: decisions.count,
    },
    seeded,
    contactsPreserved: contactsAfter,
    byStatus,
    byPhase: [...phaseMap.values()],
    doneTitles,
  };
}

/** Retired columns: Planned and Ready both collapse into Backlog. */
export async function migrateRetiredTaskStatusesToBacklog(): Promise<number> {
  const result = await prisma.roadmapTask.updateMany({
    where: { status: { in: ["planned", "ready"] } },
    data: { status: "backlog" },
  });
  return result.count;
}

export async function recomputeMilestoneProgress(): Promise<void> {
  const [milestones, tasks] = await Promise.all([
    prisma.roadmapMilestone.findMany({
      select: { id: true, completionPercentage: true, status: true },
    }),
    prisma.roadmapTask.findMany({
      select: { milestoneId: true, progressPercentage: true },
    }),
  ]);
  const byMilestone = new Map<string, number[]>();
  for (const task of tasks) {
    if (!task.milestoneId) continue;
    const linked = byMilestone.get(task.milestoneId);
    if (linked) linked.push(task.progressPercentage);
    else byMilestone.set(task.milestoneId, [task.progressPercentage]);
  }

  const writes = [];
  for (const milestone of milestones) {
    const linked = byMilestone.get(milestone.id);
    if (!linked || linked.length === 0) continue;
    const avg = Math.round(linked.reduce((sum, value) => sum + value, 0) / linked.length);
    const status = avg >= 100 ? "complete" : avg > 0 ? "in_progress" : "not_started";
    if (milestone.completionPercentage === avg && milestone.status === status) continue;
    writes.push(
      prisma.roadmapMilestone.update({
        where: { id: milestone.id },
        data: { completionPercentage: avg, status },
      }),
    );
  }
  if (writes.length > 0) await Promise.all(writes);
  invalidateRoadmapCache();
}
