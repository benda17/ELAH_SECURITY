import { NextRequest, NextResponse } from "next/server";
import { deleteTask, getTask, updateTask } from "@/lib/roadmap/repository";
import { recomputeMilestoneProgress } from "@/lib/roadmap/seed";
import type { TaskUpdateInput } from "@/lib/roadmap/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const task = await getTask(params.id);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ task });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = (await req.json()) as TaskUpdateInput & {
    dueDate?: string | null;
    startDate?: string | null;
  };
  const patch: TaskUpdateInput = { ...body };
  if (body.dueDate !== undefined) {
    patch.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  if (body.startDate !== undefined) {
    patch.startDate = body.startDate ? new Date(body.startDate) : null;
  }
  try {
    const task = await updateTask(params.id, patch);
    await recomputeMilestoneProgress();
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await deleteTask(params.id);
    await recomputeMilestoneProgress();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
