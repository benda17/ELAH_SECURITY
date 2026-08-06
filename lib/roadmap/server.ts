import { computeMetrics } from "@/lib/roadmap/metrics";
import { loadRoadmapSnapshot } from "@/lib/roadmap/repository";
import { recomputeMilestoneProgress, seedRoadmapIfEmpty } from "@/lib/roadmap/seed";

/** Server-side loader for roadmap pages — no HTTP round-trip. */
export async function loadRoadmapPageData() {
  await seedRoadmapIfEmpty();
  await recomputeMilestoneProgress();
  const snapshot = await loadRoadmapSnapshot();
  const metrics = computeMetrics(
    snapshot.tasks,
    snapshot.milestones,
    snapshot.contacts,
  );
  return { ...snapshot, metrics };
}
