import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { ReviewStatusBadge } from "@/components/elah-analyst/shared";
import { REVIEW_STATUSES, type ReviewStatus } from "@/lib/elah/analyst/constants";
import type { AnalystEventFilters } from "@/lib/elah/analyst/filters";
import type { DashboardStats } from "@/lib/elah/analyst/stats";
import { eventsHref, formatPct, topEntries } from "./helpers";

function BreakdownList({
  entries,
  total,
  hrefFor,
  renderLabel = (key) => <span className="font-mono text-xs">{key}</span>,
  emptyText,
}: {
  entries: [string, number][];
  total: number;
  hrefFor: (key: string) => string;
  renderLabel?: (key: string) => React.ReactNode;
  emptyText: string;
}) {
  if (entries.length === 0) return <p className="text-sm text-ink-muted">{emptyText}</p>;
  return (
    <ul className="space-y-2.5">
      {entries.map(([key, count]) => (
        <li key={key}>
          <Link
            href={hrefFor(key)}
            aria-label={`${key.replaceAll("_", " ")}: ${count} events, ${formatPct(count, total)}. View these events`}
            className="group block rounded-md px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            <div className="flex items-center justify-between gap-3 text-ink group-hover:text-accent-cyan">
              <span className="min-w-0 truncate">{renderLabel(key)}</span>
              <span className="shrink-0 text-xs text-ink-muted">
                {count} · {formatPct(count, total)}
              </span>
            </div>
            <div aria-hidden className="mt-1 h-1.5 w-full rounded-full bg-bg-subtle">
              <div
                className="h-full rounded-full bg-accent-gold/70"
                style={{ width: total ? `${(count / total) * 100}%` : 0 }}
              />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Breakdowns({
  stats,
  filters,
}: {
  stats: DashboardStats;
  filters: AnalystEventFilters;
}) {
  const reviewEntries = REVIEW_STATUSES.map((s) => [s, stats.byReviewStatus[s]] as [string, number]);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader title="By source" description="Where the event came from." />
        <BreakdownList
          entries={topEntries(stats.bySource)}
          total={stats.total}
          hrefFor={(key) => eventsHref(filters, { source: key })}
          emptyText="No events."
        />
      </Card>
      <Card>
        <CardHeader title="By action type" description="Top canonical ElahEvent action types." />
        <BreakdownList
          entries={topEntries(stats.byActionType)}
          total={stats.total}
          hrefFor={(key) => eventsHref(filters, { actionType: key })}
          emptyText="No events."
        />
      </Card>
      <Card className="md:col-span-2 xl:col-span-1">
        <CardHeader title="By review status" description="Analyst workflow state (latest wins)." />
        <BreakdownList
          entries={reviewEntries}
          total={stats.total}
          hrefFor={(key) => eventsHref(filters, { reviewStatus: key })}
          renderLabel={(key) => <ReviewStatusBadge status={key as ReviewStatus} />}
          emptyText="No events."
        />
      </Card>
    </div>
  );
}
