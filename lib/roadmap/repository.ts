import { prisma } from "@/lib/prisma";
import { parseJsonArray, stringifyJsonArray } from "./json";
import type {
  RoadmapContactRecord,
  RoadmapDecisionRecord,
  RoadmapExperimentRecord,
  RoadmapMilestoneRecord,
  RoadmapRiskRecord,
  RoadmapTaskRecord,
  TaskCreateInput,
  TaskStatus,
  TaskUpdateInput,
} from "./types";

function mapTask(row: {
  id: string;
  title: string;
  description: string | null;
  category: string;
  workstream: string;
  phase: string;
  status: string;
  priority: string;
  owner: string | null;
  createdAt: Date;
  updatedAt: Date;
  startDate: Date | null;
  dueDate: Date | null;
  completedAt: Date | null;
  estimatedEffort: string | null;
  actualEffort: string | null;
  progressPercentage: number;
  milestoneId: string | null;
  parentTaskId: string | null;
  dependencyIds: string;
  blockedBy: string | null;
  blockingReason: string | null;
  successCriteria: string | null;
  deliverables: string | null;
  notes: string | null;
  links: string;
  tags: string;
  riskLevel: string | null;
  isCriticalPath: boolean;
  order: number;
}): RoadmapTaskRecord {
  return {
    ...row,
    status: row.status as TaskStatus,
    priority: row.priority as RoadmapTaskRecord["priority"],
    dependencyIds: parseJsonArray(row.dependencyIds),
    links: parseJsonArray(row.links),
    tags: parseJsonArray(row.tags),
  };
}

function mapContact(row: {
  id: string;
  name: string;
  organization: string | null;
  role: string | null;
  contactType: string;
  email: string | null;
  linkedInUrl: string | null;
  sector: string | null;
  relevance: string | null;
  outreachStatus: string;
  lastContactDate: Date | null;
  nextFollowUp: Date | null;
  notes: string | null;
  associatedTasks: string;
  potentialValue: string | null;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
}): RoadmapContactRecord {
  return {
    ...row,
    associatedTasks: parseJsonArray(row.associatedTasks),
  };
}

function mapDecision(row: {
  id: string;
  question: string;
  context: string | null;
  options: string;
  chosenOption: string | null;
  status: string;
  owner: string | null;
  decisionDate: Date | null;
  rationale: string | null;
  risks: string | null;
  relatedTaskIds: string;
  createdAt: Date;
  updatedAt: Date;
}): RoadmapDecisionRecord {
  return {
    ...row,
    options: parseJsonArray(row.options),
    relatedTaskIds: parseJsonArray(row.relatedTaskIds),
  };
}

function mapRisk(row: {
  id: string;
  description: string;
  riskType: string | null;
  probability: string | null;
  impact: string | null;
  severity: string | null;
  mitigationPlan: string | null;
  owner: string | null;
  status: string;
  relatedTaskIds: string;
  createdAt: Date;
  updatedAt: Date;
}): RoadmapRiskRecord {
  return {
    ...row,
    relatedTaskIds: parseJsonArray(row.relatedTaskIds),
  };
}

export async function countRoadmapTasks(): Promise<number> {
  return prisma.roadmapTask.count();
}

export async function listTasks(filters?: {
  status?: string;
  phase?: string;
  workstream?: string;
  owner?: string;
  search?: string;
}): Promise<RoadmapTaskRecord[]> {
  const rows = await prisma.roadmapTask.findMany({
    where: {
      status: filters?.status,
      phase: filters?.phase,
      workstream: filters?.workstream,
      owner: filters?.owner,
      ...(filters?.search
        ? {
            OR: [
              { title: { contains: filters.search } },
              { description: { contains: filters.search } },
              { notes: { contains: filters.search } },
            ],
          }
        : {}),
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapTask);
}

export async function getTask(id: string): Promise<RoadmapTaskRecord | null> {
  const row = await prisma.roadmapTask.findUnique({ where: { id } });
  return row ? mapTask(row) : null;
}

export async function createTask(input: TaskCreateInput): Promise<RoadmapTaskRecord> {
  const row = await prisma.roadmapTask.create({
    data: {
      id: input.id,
      title: input.title,
      description: input.description,
      category: input.category,
      workstream: input.workstream,
      phase: input.phase,
      status: input.status,
      priority: input.priority,
      owner: input.owner,
      startDate: input.startDate,
      dueDate: input.dueDate,
      completedAt: input.completedAt,
      estimatedEffort: input.estimatedEffort,
      actualEffort: input.actualEffort,
      progressPercentage: input.progressPercentage,
      milestoneId: input.milestoneId,
      parentTaskId: input.parentTaskId,
      dependencyIds: stringifyJsonArray(input.dependencyIds),
      blockedBy: input.blockedBy,
      blockingReason: input.blockingReason,
      successCriteria: input.successCriteria,
      deliverables: input.deliverables,
      notes: input.notes,
      links: stringifyJsonArray(input.links),
      tags: stringifyJsonArray(input.tags),
      riskLevel: input.riskLevel,
      isCriticalPath: input.isCriticalPath,
      order: input.order,
    },
  });
  return mapTask(row);
}

export async function updateTask(
  id: string,
  patch: TaskUpdateInput,
): Promise<RoadmapTaskRecord> {
  const row = await prisma.roadmapTask.update({
    where: { id },
    data: {
      ...patch,
      dependencyIds:
        patch.dependencyIds !== undefined
          ? stringifyJsonArray(patch.dependencyIds)
          : undefined,
      links: patch.links !== undefined ? stringifyJsonArray(patch.links) : undefined,
      tags: patch.tags !== undefined ? stringifyJsonArray(patch.tags) : undefined,
      completedAt:
        patch.status === "done" && patch.completedAt === undefined
          ? new Date()
          : patch.completedAt,
      progressPercentage:
        patch.status === "done" && patch.progressPercentage === undefined
          ? 100
          : patch.progressPercentage,
    },
  });
  return mapTask(row);
}

export async function deleteTask(id: string): Promise<void> {
  await prisma.roadmapTask.delete({ where: { id } });
}

export async function listMilestones(): Promise<RoadmapMilestoneRecord[]> {
  return prisma.roadmapMilestone.findMany({ orderBy: { order: "asc" } });
}

export async function listContacts(): Promise<RoadmapContactRecord[]> {
  const rows = await prisma.roadmapContact.findMany({
    orderBy: [{ priority: "asc" }, { name: "asc" }],
  });
  return rows.map(mapContact);
}

export async function createContact(
  data: Omit<RoadmapContactRecord, "id" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<RoadmapContactRecord> {
  const row = await prisma.roadmapContact.create({
    data: {
      ...data,
      associatedTasks: stringifyJsonArray(data.associatedTasks),
    },
  });
  return mapContact(row);
}

export async function updateContact(
  id: string,
  patch: Partial<RoadmapContactRecord>,
): Promise<RoadmapContactRecord> {
  const row = await prisma.roadmapContact.update({
    where: { id },
    data: {
      ...patch,
      associatedTasks:
        patch.associatedTasks !== undefined
          ? stringifyJsonArray(patch.associatedTasks)
          : undefined,
    },
  });
  return mapContact(row);
}

export async function listDecisions(): Promise<RoadmapDecisionRecord[]> {
  const rows = await prisma.roadmapDecision.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapDecision);
}

export async function createDecision(
  data: Omit<RoadmapDecisionRecord, "id" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<RoadmapDecisionRecord> {
  const row = await prisma.roadmapDecision.create({
    data: {
      ...data,
      options: stringifyJsonArray(data.options),
      relatedTaskIds: stringifyJsonArray(data.relatedTaskIds),
    },
  });
  return mapDecision(row);
}

export async function updateDecision(
  id: string,
  patch: Partial<RoadmapDecisionRecord>,
): Promise<RoadmapDecisionRecord> {
  const row = await prisma.roadmapDecision.update({
    where: { id },
    data: {
      ...patch,
      options:
        patch.options !== undefined ? stringifyJsonArray(patch.options) : undefined,
      relatedTaskIds:
        patch.relatedTaskIds !== undefined
          ? stringifyJsonArray(patch.relatedTaskIds)
          : undefined,
    },
  });
  return mapDecision(row);
}

export async function listExperiments(): Promise<RoadmapExperimentRecord[]> {
  return prisma.roadmapExperiment.findMany({ orderBy: { updatedAt: "desc" } });
}

export async function createExperiment(
  data: Omit<RoadmapExperimentRecord, "id" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<RoadmapExperimentRecord> {
  return prisma.roadmapExperiment.create({ data });
}

export async function listRisks(): Promise<RoadmapRiskRecord[]> {
  const rows = await prisma.roadmapRisk.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(mapRisk);
}

export async function createRisk(
  data: Omit<RoadmapRiskRecord, "id" | "createdAt" | "updatedAt"> & { id?: string },
): Promise<RoadmapRiskRecord> {
  const row = await prisma.roadmapRisk.create({
    data: {
      ...data,
      relatedTaskIds: stringifyJsonArray(data.relatedTaskIds),
    },
  });
  return mapRisk(row);
}

export async function updateRisk(
  id: string,
  patch: Partial<RoadmapRiskRecord>,
): Promise<RoadmapRiskRecord> {
  const row = await prisma.roadmapRisk.update({
    where: { id },
    data: {
      ...patch,
      relatedTaskIds:
        patch.relatedTaskIds !== undefined
          ? stringifyJsonArray(patch.relatedTaskIds)
          : undefined,
    },
  });
  return mapRisk(row);
}

export async function loadRoadmapSnapshot() {
  const [tasks, milestones, contacts, decisions, experiments, risks] =
    await Promise.all([
      listTasks(),
      listMilestones(),
      listContacts(),
      listDecisions(),
      listExperiments(),
      listRisks(),
    ]);
  return { tasks, milestones, contacts, decisions, experiments, risks };
}
