import { NextResponse } from "next/server";
import { computeMetrics } from "@/lib/roadmap/metrics";
import { loadRoadmapSnapshot } from "@/lib/roadmap/repository";
import { recomputeMilestoneProgress, seedRoadmapIfEmpty } from "@/lib/roadmap/seed";

export async function GET() {
  await seedRoadmapIfEmpty();
  await recomputeMilestoneProgress();
  const snapshot = await loadRoadmapSnapshot();
  const metrics = computeMetrics(
    snapshot.tasks,
    snapshot.milestones,
    snapshot.contacts,
  );
  return NextResponse.json({ ...snapshot, metrics });
}
