import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, THead, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BandBadge,
  OutcomeMarkBadge,
  ReviewStatusBadge,
} from "@/components/elah-analyst/shared";
import { SCORE_BANDS, type ScoreBand } from "@/lib/elah/analyst/bands";
import {
  OUTCOME_MARKS,
  REVIEW_STATUSES,
  type OutcomeMark,
  type ReviewStatus,
} from "@/lib/elah/analyst/constants";
import type { AnalystExportRecord } from "@/lib/elah/analyst/export";
import type { AnalystEventFilters } from "@/lib/elah/analyst/filters";
import {
  EVENTS_PATH,
  eventsHref,
  formatScore,
  formatUtcDateTime,
  isUncalibratedModel,
} from "./helpers";

function str(value: string | number | null): string | null {
  return value == null ? null : String(value);
}

function num(value: string | number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function oneOf<T extends string>(value: string | number | null, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function LatestEventsTable({
  latest,
  filters,
}: {
  latest: AnalystExportRecord[];
  filters: AnalystEventFilters;
}) {
  return (
    <Card>
      <CardHeader
        title="Latest events"
        description="Newest events in this window (up to 20). Open an event for its full envelope, score explanation, and review history."
        action={
          <Link
            href={eventsHref(filters)}
            className="text-xs font-medium text-accent-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            All matching events →
          </Link>
        }
      />
      <Table>
        <caption className="sr-only">Latest ELAH events with score, band, and review status</caption>
        <THead>
          <TR>
            <TH>Time (UTC)</TH>
            <TH>Event</TH>
            <TH>Action</TH>
            <TH className="hidden md:table-cell">Source</TH>
            <TH className="text-right">Score</TH>
            <TH className="hidden text-right sm:table-cell">Confidence</TH>
            <TH>Band</TH>
            <TH>Review</TH>
            <TH className="hidden lg:table-cell">Model</TH>
          </TR>
        </THead>
        <tbody>
          {latest.length === 0 ? (
            <EmptyRow message="No events in this window." />
          ) : (
            latest.map((record) => {
              const eventId = str(record.eventId) ?? "";
              const band = oneOf<ScoreBand>(record.band, SCORE_BANDS, "unscored");
              const review = oneOf<ReviewStatus>(record.reviewStatus, REVIEW_STATUSES, "unreviewed");
              const mark =
                typeof record.outcomeMark === "string" &&
                (OUTCOME_MARKS as readonly string[]).includes(record.outcomeMark)
                  ? (record.outcomeMark as OutcomeMark)
                  : null;
              const model = str(record.modelVersion);
              return (
                <TR key={eventId}>
                  <TD className="whitespace-nowrap text-xs text-ink-muted">
                    {formatUtcDateTime(str(record.occurredAt) ?? "")}
                  </TD>
                  <TD>
                    <Link
                      href={`${EVENTS_PATH}/${encodeURIComponent(eventId)}`}
                      className="font-mono text-xs text-accent-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
                    >
                      {eventId}
                    </Link>
                  </TD>
                  <TD className="text-xs">
                    <div>{str(record.actionType)?.replaceAll("_", " ") ?? "—"}</div>
                    {record.toolName ? (
                      <div className="font-mono text-[10px] text-ink-subtle">{str(record.toolName)}</div>
                    ) : null}
                  </TD>
                  <TD className="hidden text-xs text-ink-muted md:table-cell">{str(record.source) ?? "—"}</TD>
                  <TD className="text-right font-mono text-xs">{formatScore(num(record.elahScore))}</TD>
                  <TD className="hidden text-right font-mono text-xs text-ink-muted sm:table-cell">
                    {formatScore(num(record.confidence))}
                  </TD>
                  <TD>
                    <BandBadge band={band} />
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      <ReviewStatusBadge status={review} />
                      <OutcomeMarkBadge mark={mark} />
                    </div>
                  </TD>
                  <TD className="hidden lg:table-cell">
                    {model ? (
                      <span className="inline-flex flex-wrap items-center gap-1 font-mono text-[11px] text-ink-muted">
                        {model}
                        {isUncalibratedModel(model) ? (
                          <Badge variant="warning" className="px-1.5 text-[10px]">
                            uncalibrated
                          </Badge>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-subtle">—</span>
                    )}
                  </TD>
                </TR>
              );
            })
          )}
        </tbody>
      </Table>
    </Card>
  );
}
