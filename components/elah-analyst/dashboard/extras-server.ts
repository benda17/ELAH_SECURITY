import "server-only";
import type { AnalystEventFilters } from "@/lib/elah/analyst/filters";
import { queryAnalystEvents } from "@/lib/elah/analyst/query";
import { computeDashboardExtras, type DashboardExtras } from "./helpers";

/**
 * Same scan as `getDashboardSnapshot` (limit defaults to 1000) so extras and
 * snapshot stats describe the same rows. Writes no audit rows — safe to poll.
 */
export async function loadDashboardExtras(
  filters: AnalystEventFilters,
  opts: { now?: Date } = {},
): Promise<DashboardExtras> {
  const now = opts.now ?? new Date();
  const result = await queryAnalystEvents({ ...filters, limit: filters.limit ?? 1000 }, { now });
  return computeDashboardExtras(result.rows, now);
}
