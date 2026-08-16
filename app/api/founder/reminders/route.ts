import { NextResponse } from "next/server";
import { loadRoadmapSnapshot } from "@/lib/roadmap/repository";
import { buildReminderDigest } from "@/lib/roadmap/reminders";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await loadRoadmapSnapshot();
  return NextResponse.json(buildReminderDigest(snapshot.tasks, snapshot.contacts));
}
