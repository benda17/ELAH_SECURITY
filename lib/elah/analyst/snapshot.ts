import "server-only";
import type { ElahDisplayThresholds } from "./bands";
import { toExportRecord, type AnalystExportRecord } from "./export";
import type { AnalystEventFilters } from "./filters";
import { queryAnalystEvents } from "./query";
import { computeDashboardStats, type DashboardStats } from "./stats";

export interface DashboardSnapshot {
  generatedAt: string;
  filters: AnalystEventFilters;
  /** Canonical query string for `filters`. */
  query: string;
  thresholds: ElahDisplayThresholds;
  range: { from: string | null; to: string | null };
  stats: DashboardStats;
  /** Newest rows (flattened, no utterances), for a live feed. */
  latest: AnalystExportRecord[];
  /** More matches may exist beyond the scan (see `AnalystQueryResult.truncated`). */
  truncated: boolean;
}

const LATEST_COUNT = 20;

/**
 * Query + aggregate for the dashboard. Uses `filters.limit` (default 1000 here,
 * so stats cover the widest scan). Does not write audit rows — safe to poll.
 */
export async function getDashboardSnapshot(
  filters: AnalystEventFilters,
  opts: { now?: Date } = {},
): Promise<DashboardSnapshot> {
  const now = opts.now ?? new Date();
  const effective: AnalystEventFilters = { ...filters, limit: filters.limit ?? 1000 };
  const result = await queryAnalystEvents(effective, { now });
  const stats = computeDashboardStats(result.rows, result.thresholds, {
    from: result.range.from ? new Date(result.range.from) : null,
    to: result.range.to ? new Date(result.range.to) : null,
    now,
  });
  return {
    generatedAt: now.toISOString(),
    filters: result.filters,
    query: result.query,
    thresholds: result.thresholds,
    range: result.range,
    stats,
    latest: result.rows.slice(0, LATEST_COUNT).map(toExportRecord),
    truncated: result.truncated,
  };
}
