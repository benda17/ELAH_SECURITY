import { NextRequest, NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/roadmap/repository";
import { recomputeMilestoneProgress } from "@/lib/roadmap/seed";
import type { TaskCreateInput } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const tasks = await listTasks({
    status: sp.get("status") ?? undefined,
    phase: sp.get("phase") ?? undefined,
    workstream: sp.get("workstream") ?? undefined,
    owner: sp.get("owner") ?? undefined,
    search: sp.get("search") ?? undefined,
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<TaskCreateInput>;
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  const task = await createTask({
    title: body.title.trim(),
    description: body.description ?? null,
    category: body.category ?? "General",
    workstream: body.workstream ?? "Product",
    phase: body.phase ?? "Phase 0 — Product definition and architecture",
    status: body.status ?? "backlog",
    priority: body.priority ?? "medium",
    owner: body.owner ?? null,
    startDate: body.startDate ? new Date(body.startDate) : null,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    completedAt: null,
    estimatedEffort: body.estimatedEffort ?? null,
    actualEffort: body.actualEffort ?? null,
    progressPercentage: body.progressPercentage ?? 0,
    milestoneId: body.milestoneId ?? null,
    parentTaskId: body.parentTaskId ?? null,
    dependencyIds: body.dependencyIds ?? [],
    blockedBy: body.blockedBy ?? null,
    blockingReason: body.blockingReason ?? null,
    successCriteria: body.successCriteria ?? null,
    deliverables: body.deliverables ?? null,
    notes: body.notes ?? null,
    links: body.links ?? [],
    tags: body.tags ?? [],
    riskLevel: body.riskLevel ?? null,
    isCriticalPath: body.isCriticalPath ?? false,
    order: body.order ?? 9999,
  });
  await recomputeMilestoneProgress();
  return NextResponse.json({ task }, { status: 201 });
}
