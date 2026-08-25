import { NextResponse } from "next/server";
import { computeMetrics } from "@/lib/roadmap/metrics";
import { loadRoadmapSnapshot } from "@/lib/roadmap/repository";
import { recomputeMilestoneProgress, seedRoadmapIfEmpty } from "@/lib/roadmap/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is not set" },
      { status: 503 },
    );
  }

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
