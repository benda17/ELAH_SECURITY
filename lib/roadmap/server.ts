import { computeMetrics } from "@/lib/roadmap/metrics";
import { readRoadmapCache } from "@/lib/roadmap/page-cache";
import { loadRoadmapSnapshot } from "@/lib/roadmap/repository";

/**
 * Roadmap pages used to seed, rewrite milestone rows, and reload the full
 * board on every navigation. That was a dozen sequential Neon round trips.
 * Reads now share one in-memory snapshot. Task and contact writes invalidate it.
 */
export async function loadRoadmapPageData() {
  return readRoadmapCache(async () => {
    const snapshot = await loadRoadmapSnapshot();
    const metrics = computeMetrics(
      snapshot.tasks,
      snapshot.milestones,
      snapshot.contacts,
    );
    return { ...snapshot, metrics };
  });
}
