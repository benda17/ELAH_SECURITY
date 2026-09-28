import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BandBadge, Meter, OutcomeMarkBadge, ReviewStatusBadge, bandBarClass } from "@/components/elah-analyst/shared";
import { cn, formatDate } from "@/lib/utils";
import type { ElahDisplayThresholds } from "@/lib/elah/analyst/bands";
import type { AnalystEventFilters } from "@/lib/elah/analyst/filters";
import type { AnalystEventRow } from "@/lib/elah/analyst/types";
import {
  UNCALIBRATED_MODEL_NOTE,
  ariaSortFor,
  buildListHref,
  formatUnit,
  humanize,
  isUncalibratedModel,
  nextSortFor,
  type ListSort,
  type SortColumn,
} from "./list-helpers";
import { UntrustedSnippet } from "./untrusted-snippet";

const STATUS_LABEL: Record<AnalystEventRow["scoreStatus"], string> = {
  scored: "scored",
  abstained: "abstained",
  unavailable: "scorer unavailable",
  none: "not scored",
};

function eventHref(row: AnalystEventRow): string {
  return `/admin/elah-events/${encodeURIComponent(row.event.eventId)}`;
}

function thresholdMarkers(t: ElahDisplayThresholds) {
  return [
    { at: t.reviewBelow, label: "Review below" },
    { at: t.watchBelow, label: "Watch below" },
  ];
}

function ScoreCell({ row, thresholds }: { row: AnalystEventRow; thresholds: ElahDisplayThresholds }) {
  if (row.elahScore == null) {
    return (
      <div className="flex flex-col items-start gap-1">
        <BandBadge band={row.band} />
        <span className={cn("text-xs", row.scoreStatus === "none" ? "text-ink-subtle" : "text-accent-amber")}>
          {STATUS_LABEL[row.scoreStatus]}
        </span>
      </div>
    );
  }
  return (
    <div className="flex min-w-[7.5rem] flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm tabular-nums text-ink">{row.elahScore.toFixed(2)}</span>
        <BandBadge band={row.band} />
      </div>
      <Meter
        value={row.elahScore}
        label={`ELAH score for event ${row.event.eventId.slice(0, 8)}`}
        barClassName={bandBarClass(row.band)}
        markers={thresholdMarkers(thresholds)}
        className="w-28"
      />
    </div>
  );
}

function ModelCell({ row }: { row: AnalystEventRow }) {
  if (!row.modelVersion) return <span className="text-xs text-ink-subtle">—</span>;
  const uncalibrated = isUncalibratedModel(row.modelVersion, row.scorer);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5" title={uncalibrated ? UNCALIBRATED_MODEL_NOTE : undefined}>
      <span className="font-mono text-xs text-ink-muted">{row.modelVersion}</span>
      {uncalibrated ? (
        <Badge variant="warning" className="px-1.5 py-0 text-[10px]">
          uncalibrated
        </Badge>
      ) : null}
    </span>
  );
}

function QualityBadge({ row }: { row: AnalystEventRow }) {
  return (
    <span title={row.quality.ok ? "Envelope quality checks passed" : `Failed rules: ${row.quality.ruleIds.join(", ") || "unknown"}`}>
      <Badge variant={row.quality.ok ? "status-approved" : "status-rejected"}>{row.quality.ok ? "ok" : "fail"}</Badge>
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  return <Badge variant={source === "agent" ? "role-agent" : "info"}>{source}</Badge>;
}

function SortHeader({
  column,
  label,
  sort,
  filters,
  className,
}: {
  column: SortColumn;
  label: string;
  sort: ListSort;
  filters: AnalystEventFilters;
  className?: string;
}) {
  const aria = ariaSortFor(column, sort);
  const Icon = aria === "ascending" ? ArrowUp : aria === "descending" ? ArrowDown : ArrowUpDown;
  return (
    <th scope="col" aria-sort={aria} className={cn("px-4 py-3 text-left font-medium", className)}>
      <Link
        href={buildListHref(filters, nextSortFor(column, sort))}
        className="inline-flex items-center gap-1 hover:text-ink focus:outline-none focus-visible:text-accent-cyan"
        scroll={false}
      >
        {label}
        <Icon aria-hidden className={cn("size-3", aria === "none" && "opacity-50")} />
        <span className="sr-only">, sort</span>
      </Link>
    </th>
  );
}

const TH = "px-4 py-3 text-left font-medium";
const TD = "px-4 py-3 align-middle text-ink";
const STICKY = "sticky left-0 z-10 bg-bg-panel shadow-[1px_0_0_0_theme(colors.line.DEFAULT)]";

function DesktopTable({
  rows,
  thresholds,
  sort,
  filters,
  caption,
}: {
  rows: AnalystEventRow[];
  thresholds: ElahDisplayThresholds;
  sort: ListSort;
  filters: AnalystEventFilters;
  caption: string;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-line bg-bg-panel/40 md:block">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-bg-subtle/60 text-xs uppercase tracking-wider text-ink-subtle">
          <tr className="border-b border-line">
            <SortHeader column="time" label="Time" sort={sort} filters={filters} className={cn(STICKY, "bg-bg-subtle")} />
            <th scope="col" className={TH}>Action</th>
            <th scope="col" className={TH}>Source</th>
            <th scope="col" className={TH}>Tool</th>
            <th scope="col" className={TH}>Customer said</th>
            <th scope="col" className={TH}>Outcome</th>
            <th scope="col" className={TH}>Quality</th>
            <SortHeader column="score" label="ELAH score" sort={sort} filters={filters} />
            <SortHeader column="confidence" label="Confidence" sort={sort} filters={filters} />
            <th scope="col" className={TH}>Intent</th>
            <th scope="col" className={TH}>Model</th>
            <th scope="col" className={TH}>Review</th>
            <th scope="col" className={TH}>FP / FN</th>
            <th scope="col" className={TH}>Event</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.auditLogId}-${row.event.eventId}`} className="group border-b border-line last:border-0 hover:bg-bg-subtle/40">
              <th scope="row" className={cn(TD, STICKY, "whitespace-nowrap text-left font-normal text-ink-muted group-hover:bg-bg-subtle")}>
                <Link href={eventHref(row)} className="hover:text-accent-cyan">
                  <time dateTime={row.event.occurredAt}>{formatDate(row.event.occurredAt)}</time>
                </Link>
              </th>
              <td className={TD}>
                <Link href={eventHref(row)} className="whitespace-nowrap font-medium text-ink hover:text-accent-cyan">
                  {humanize(row.event.actionType)}
                </Link>
              </td>
              <td className={TD}>
                <SourceBadge source={row.event.source} />
              </td>
              <td className={cn(TD, "font-mono text-xs text-ink-muted")}>{row.event.action.toolName ?? "—"}</td>
              <td className={cn(TD, "max-w-[16rem]")}>
                <UntrustedSnippet text={row.event.conversation?.utterance} max={80} />
              </td>
              <td className={cn(TD, "whitespace-nowrap")}>{humanize(row.event.outcome)}</td>
              <td className={TD}>
                <QualityBadge row={row} />
              </td>
              <td className={TD}>
                <ScoreCell row={row} thresholds={thresholds} />
              </td>
              <td className={cn(TD, "font-mono text-xs tabular-nums text-ink-muted")}>{formatUnit(row.confidence)}</td>
              <td className={cn(TD, "whitespace-nowrap text-xs text-ink-muted")}>{row.intentLabel ? humanize(row.intentLabel) : "—"}</td>
              <td className={TD}>
                <ModelCell row={row} />
              </td>
              <td className={TD}>
                <ReviewStatusBadge status={row.review.reviewStatus} />
              </td>
              <td className={TD}>
                {row.review.outcomeMark ? <OutcomeMarkBadge mark={row.review.outcomeMark} /> : <span className="text-xs text-ink-subtle">—</span>}
              </td>
              <td className={TD}>
                <Link
                  href={eventHref(row)}
                  className="font-mono text-xs text-accent-cyan hover:underline"
                  title={row.event.eventId}
                  aria-label={`Open event ${row.event.eventId}`}
                >
                  {row.event.eventId.slice(0, 8)}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileCards({ rows, thresholds }: { rows: AnalystEventRow[]; thresholds: ElahDisplayThresholds }) {
  return (
    <ul className="space-y-3 md:hidden" aria-label="ELAH events">
      {rows.map((row) => (
        <li key={`${row.auditLogId}-${row.event.eventId}`} className="rounded-xl border border-line bg-bg-panel/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={eventHref(row)} className="font-medium text-ink hover:text-accent-cyan">
                {humanize(row.event.actionType)}
              </Link>
              <p className="mt-0.5 text-xs text-ink-muted">
                <time dateTime={row.event.occurredAt}>{formatDate(row.event.occurredAt)}</time>
              </p>
            </div>
            <SourceBadge source={row.event.source} />
          </div>
          <div className="mt-3">
            <UntrustedSnippet text={row.event.conversation?.utterance} max={120} />
          </div>
          <div className="mt-3">
            <ScoreCell row={row} thresholds={thresholds} />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div>
              <dt className="text-ink-subtle">Tool</dt>
              <dd className="font-mono text-ink-muted">{row.event.action.toolName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Outcome</dt>
              <dd className="text-ink">{humanize(row.event.outcome)}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Confidence</dt>
              <dd className="font-mono text-ink-muted">{formatUnit(row.confidence)}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Intent</dt>
              <dd className="text-ink-muted">{row.intentLabel ? humanize(row.intentLabel) : "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Model</dt>
              <dd>
                <ModelCell row={row} />
              </dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Quality</dt>
              <dd>
                <QualityBadge row={row} />
              </dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <ReviewStatusBadge status={row.review.reviewStatus} />
              <OutcomeMarkBadge mark={row.review.outcomeMark} />
            </div>
            <Link
              href={eventHref(row)}
              className="font-mono text-xs text-accent-cyan hover:underline"
              aria-label={`Open event ${row.event.eventId}`}
            >
              {row.event.eventId.slice(0, 8)} →
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ResultsTable(props: {
  rows: AnalystEventRow[];
  thresholds: ElahDisplayThresholds;
  sort: ListSort;
  filters: AnalystEventFilters;
  caption: string;
}) {
  return (
    <>
      <DesktopTable {...props} />
      <MobileCards rows={props.rows} thresholds={props.thresholds} />
    </>
  );
}
