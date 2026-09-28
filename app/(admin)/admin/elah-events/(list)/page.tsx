import Link from "next/link";
import { AlertTriangle, ScanSearch } from "lucide-react";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import {
  ANALYST_LIMIT_DEFAULT,
  can,
  getThresholds,
  listFilterFacets,
  listViews,
  parseAnalystFilters,
  queryAnalystEvents,
  requireAnalystPermission,
} from "@/lib/elah/analyst";
import { FilterBar, type FilterBarFacets } from "@/components/elah-analyst/list/filter-bar";
import { SavedViewsBar } from "@/components/elah-analyst/list/saved-views-bar";
import { ExportButtons } from "@/components/elah-analyst/list/export-buttons";
import { ActiveFilterChips } from "@/components/elah-analyst/list/active-filter-chips";
import { ResultsTable } from "@/components/elah-analyst/list/results-table";
import {
  ELAH_EVENTS_PATH,
  LIST_SORT_DEFAULT,
  buildActiveFilterChips,
  formatUtcShort,
  parseListSort,
  sortAnalystRows,
  truncationNotice,
  type ListSort,
} from "@/components/elah-analyst/list/list-helpers";

export const dynamic = "force-dynamic";

const SORT_DESCRIPTION: Record<ListSort, string> = {
  newest: "newest first",
  oldest: "oldest first",
  score_asc: "lowest ELAH score first",
  score_desc: "highest ELAH score first",
  confidence_asc: "lowest confidence first",
  confidence_desc: "highest confidence first",
};

export default async function ElahEventsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireAnalystPermission("analyst:view", { page: ELAH_EVENTS_PATH });

  const filters = parseAnalystFilters(searchParams);
  const sort = parseListSort(searchParams.sort);
  const thresholds = await getThresholds();
  const [result, facets, views] = await Promise.all([
    queryAnalystEvents(filters, { thresholds }),
    listFilterFacets(),
    listViews(user.id),
  ]);
  const rows = sort === LIST_SORT_DEFAULT ? result.rows : sortAnalystRows(result.rows, sort);
  const limit = filters.limit ?? ANALYST_LIMIT_DEFAULT;

  await writeAuditLog({
    actionType: "elah_events_viewed",
    page: ELAH_EVENTS_PATH,
    toolOrFeatureUsed: "elah_event_viewer",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      source: filters.source ?? "all",
      actionType: filters.actionType ?? "all",
      toolName: filters.toolName ?? "all",
      outcome: filters.outcome ?? "all",
      sessionId: filters.sessionId ?? null,
      q: filters.q ?? null,
      quality: filters.quality ?? "all",
      userIdHash: filters.userIdHash ?? null,
      query: result.query,
      sort,
      resultCount: rows.length,
      scanned: result.scanned,
      truncated: result.truncated,
    },
  });

  const userLabels = new Map(facets.users.map((u) => [u.userIdHash, `${u.name} · ${u.roleLabel}`]));
  const chips = buildActiveFilterChips(filters, { sort, userLabels });
  const notice = truncationNotice({
    truncated: result.truncated,
    scanned: result.scanned,
    limit,
    rowCount: rows.length,
  });
  const canExport = can(user.role, "analyst:export");

  const filterFacets: FilterBarFacets = {
    sources: facets.sources,
    channels: facets.channels,
    actionTypes: facets.actionTypes,
    toolNames: facets.toolNames,
    outcomes: facets.outcomes,
    qualities: facets.qualities,
    intentLabels: facets.intentLabels,
    observedIntentLabels: facets.observedIntentLabels,
    modelVersions: facets.modelVersions,
    reviewStatuses: facets.reviewStatuses,
    markFilters: facets.markFilters,
    bands: facets.bands,
    datePresets: facets.datePresets,
    users: facets.users,
  };

  const rangeText =
    result.range.from || result.range.to
      ? `${result.range.from ? formatUtcShort(result.range.from) : "beginning"} → ${
          result.range.to ? formatUtcShort(result.range.to) : "now"
        }`
      : null;
  const caption = `ELAH events, ${rows.length} shown, sorted ${SORT_DESCRIPTION[sort]}`;

  return (
    <PageShell className="px-4 sm:px-6">
      <SectionHeader
        title="ELAH events"
        description="Ingestible ElahEvent envelopes joined with ELAH scores and review state for analyst triage. ELAH scores genuine banking intent before tool execution (higher = more genuine); bank policy alone decides allow, deny, or confirm. ELAH never allows, blocks, or executes. Scores are analyst-side data, not envelope fields."
      />

      <Card className="p-4 sm:p-6">
        <FilterBar
          key={`${result.query}|${sort}`}
          filters={filters}
          facets={filterFacets}
          thresholds={thresholds}
          sort={sort}
        />
      </Card>

      <Card className="p-4 sm:p-6">
        <SavedViewsBar
          views={views.map((view) => ({ viewId: view.viewId, name: view.name, query: view.query }))}
          currentQuery={result.query}
        />
      </Card>

      <section aria-labelledby="elah-results-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="elah-results-heading" className="text-base font-semibold text-ink">
              Results
            </h3>
            <p role="status" aria-live="polite" className="mt-1 text-sm text-ink-muted">
              {rows.length === 1 ? "1 event" : `${rows.length} events`} shown
              {` · ${result.scanned} scanned`}
              {rangeText ? ` · ${rangeText}` : ""}
              {` · ${SORT_DESCRIPTION[sort]}`}
            </p>
            {sort !== LIST_SORT_DEFAULT ? (
              <p className="mt-0.5 text-xs text-ink-subtle">
                Sorting reorders the loaded rows only; it is not saved in views or exports.
              </p>
            ) : null}
          </div>
          {canExport ? <ExportButtons filters={filters} /> : null}
        </div>

        <ActiveFilterChips chips={chips} />

        {notice ? (
          <div
            role="note"
            className="flex items-start gap-2 rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-sm text-accent-amber"
          >
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>{notice}</span>
          </div>
        ) : null}

        {rows.length === 0 ? (
          chips.length > 0 ? (
            <Empty
              icon={<ScanSearch className="size-5" />}
              title="No events match these filters"
              description={
                result.truncated
                  ? "Only the most recent events in the date range were scanned. Narrow the date range or loosen filters."
                  : "Try removing a filter or widening the date range."
              }
              action={
                <Link href={ELAH_EVENTS_PATH} className="text-sm font-medium text-accent-cyan hover:underline">
                  Reset filters
                </Link>
              }
            />
          ) : (
            <Empty
              icon={<ScanSearch className="size-5" />}
              title="No ElahEvents yet"
              description="Ingestible events appear after customer UI actions or assistant tool calls. Admin page views are operational logs, not ElahEvents."
            />
          )
        ) : (
          <ResultsTable rows={rows} thresholds={thresholds} sort={sort} filters={filters} caption={caption} />
        )}
      </section>
    </PageShell>
  );
}
