import "server-only";
import { prisma } from "@/lib/db";
import { listIngestibleEvents } from "@/lib/elah/envelope";
import { listDemoCustomers, type DemoCustomerOption } from "@/lib/elah/admin-events";
import {
  ELAH_SCORE_LOG_TYPES,
  loadLatestScoreSnapshots,
  parseMetadataJson,
  parseScoreSnapshot,
} from "@/lib/elah/score-read";
import {
  ELAH_ACTION_TYPES,
  ELAH_OUTCOMES,
  ELAH_SOURCES,
  ELAH_TOOL_NAMES,
} from "@/lib/elah/event-vocab";
import { ELAH_BANKING_INTENTS } from "@/lib/elah/types";
import { SCORE_BANDS, type ElahDisplayThresholds } from "./bands";
import { OUTCOME_MARKS, REVIEW_STATUSES } from "./constants";
import { getReviewStates } from "./annotations";
import { getThresholds } from "./thresholds";
import {
  ANALYST_CHANNELS,
  ANALYST_DATE_PRESETS,
  ANALYST_LIMIT_DEFAULT,
  ANALYST_LIMIT_MAX,
  ANALYST_MARK_FILTERS,
  ANALYST_QUALITY_FILTERS,
  hasAnalystOnlyFilters,
  matchesAnalystFilters,
  resolveDateRange,
  serializeAnalystFilters,
  type AnalystEventFilters,
} from "./filters";
import { buildAnalystRow, type AnalystEventRow } from "./types";

export * from "./filters";

export interface AnalystQueryResult {
  rows: AnalystEventRow[];
  filters: AnalystEventFilters;
  /** Canonical query string for these filters. */
  query: string;
  thresholds: ElahDisplayThresholds;
  range: { from: string | null; to: string | null };
  /** Ingestible events examined before analyst-only filters. */
  scanned: number;
  /**
   * true when the underlying scan returned a full page, so more (older) matches
   * may exist. `listIngestibleEvents` reads at most 1000 recent AuditLog rows
   * inside the date range; narrow the range to reach older events.
   */
  truncated: boolean;
}

/**
 * Query ingestible ElahEvents joined with quality, latest score snapshot, and
 * latest review state. Newest first. See `filters.ts` for which filters run
 * in the DB vs in memory. `thresholds` defaults to `getThresholds()`.
 */
export async function queryAnalystEvents(
  filters: AnalystEventFilters,
  opts: { thresholds?: ElahDisplayThresholds; now?: Date } = {},
): Promise<AnalystQueryResult> {
  const limit = Math.min(ANALYST_LIMIT_MAX, Math.max(1, filters.limit ?? ANALYST_LIMIT_DEFAULT));
  const range = resolveDateRange(filters, opts.now);
  const analystOnly = hasAnalystOnlyFilters(filters);
  const scanTake = analystOnly ? ANALYST_LIMIT_MAX : limit;

  const [listed, thresholds] = await Promise.all([
    listIngestibleEvents({
      userIdHash: filters.userIdHash,
      sessionId: filters.sessionId,
      source: filters.source ?? (filters.channel === "agent" ? "agent" : undefined),
      actionType: filters.actionType,
      toolName: filters.toolName,
      outcome: filters.outcome,
      quality: filters.quality,
      from: range.from ?? undefined,
      to: range.to ?? undefined,
      take: scanTake,
    }),
    opts.thresholds ? Promise.resolve(opts.thresholds) : getThresholds(),
  ]);

  const eventIds = listed.map((item) => item.event.eventId);
  const [scores, reviews] = await Promise.all([
    loadLatestScoreSnapshots(eventIds),
    getReviewStates(eventIds),
  ]);

  const rows: AnalystEventRow[] = [];
  for (const item of listed) {
    const row = buildAnalystRow(
      item,
      scores.get(item.event.eventId) ?? null,
      reviews.get(item.event.eventId),
      thresholds,
    );
    if (!matchesAnalystFilters(row, filters, range)) continue;
    rows.push(row);
    if (rows.length >= limit) break;
  }

  return {
    rows,
    filters,
    query: serializeAnalystFilters(filters),
    thresholds,
    range: {
      from: range.from?.toISOString() ?? null,
      to: range.to?.toISOString() ?? null,
    },
    scanned: listed.length,
    truncated: listed.length >= scanTake,
  };
}

export interface AnalystFilterFacets {
  sources: readonly string[];
  channels: readonly string[];
  actionTypes: readonly string[];
  toolNames: readonly string[];
  outcomes: readonly string[];
  qualities: readonly string[];
  /** Closed 22-label taxonomy (always complete). */
  intentLabels: readonly string[];
  /** Intent labels that actually appear in recent score rows. */
  observedIntentLabels: string[];
  /** Distinct `modelVersion ?? scorer` values from recent score rows. */
  modelVersions: string[];
  /** Distinct `provenance.scorer` values from recent score rows. */
  scorers: string[];
  reviewStatuses: readonly string[];
  outcomeMarks: readonly string[];
  markFilters: readonly string[];
  bands: readonly string[];
  datePresets: readonly string[];
  /** Demo customers (name + role label + userIdHash) for the user dropdown. */
  users: DemoCustomerOption[];
}

const FACET_SCAN = 1000;

/** Distinct values for filter dropdowns. Score-derived facets scan the newest 1000 score rows. */
export async function listFilterFacets(): Promise<AnalystFilterFacets> {
  const [scoreRows, users] = await Promise.all([
    prisma.agentEventLog.findMany({
      where: { eventType: { in: [...ELAH_SCORE_LOG_TYPES] } },
      orderBy: { timestamp: "desc" },
      take: FACET_SCAN,
      select: { eventType: true, metadata: true },
    }),
    listDemoCustomers(),
  ]);

  const modelVersions = new Set<string>();
  const scorers = new Set<string>();
  const intents = new Set<string>();
  for (const row of scoreRows) {
    const snapshot = parseScoreSnapshot(row.eventType, parseMetadataJson(row.metadata));
    if (snapshot?.kind !== "scored") continue;
    const version = snapshot.provenanceModelVersion ?? snapshot.provenanceScorer;
    if (version) modelVersions.add(version);
    if (snapshot.provenanceScorer) scorers.add(snapshot.provenanceScorer);
    if (snapshot.intentLabel) intents.add(snapshot.intentLabel);
  }

  return {
    sources: ELAH_SOURCES,
    channels: ANALYST_CHANNELS,
    actionTypes: ELAH_ACTION_TYPES,
    toolNames: ELAH_TOOL_NAMES,
    outcomes: ELAH_OUTCOMES,
    qualities: ANALYST_QUALITY_FILTERS,
    intentLabels: ELAH_BANKING_INTENTS,
    observedIntentLabels: [...intents].sort(),
    modelVersions: [...modelVersions].sort(),
    scorers: [...scorers].sort(),
    reviewStatuses: REVIEW_STATUSES,
    outcomeMarks: OUTCOME_MARKS,
    markFilters: ANALYST_MARK_FILTERS,
    bands: SCORE_BANDS,
    datePresets: ANALYST_DATE_PRESETS,
    users,
  };
}
