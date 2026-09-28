import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ScoreBand } from "@/lib/elah/analyst/bands";
import type { OutcomeMark, ReviewStatus } from "@/lib/elah/analyst/constants";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const BAND_META: Record<ScoreBand, { label: string; variant: BadgeVariant; bar: string }> = {
  review: { label: "Review", variant: "risk-high", bar: "bg-accent-rose" },
  watch: { label: "Watch", variant: "risk-medium", bar: "bg-accent-amber" },
  clear: { label: "Clear", variant: "risk-low", bar: "bg-accent-emerald" },
  unscored: { label: "Unscored", variant: "default", bar: "bg-ink-subtle" },
};

export function bandLabel(band: ScoreBand): string {
  return BAND_META[band].label;
}

export function bandBarClass(band: ScoreBand): string {
  return BAND_META[band].bar;
}

export function BandBadge({ band, className }: { band: ScoreBand; className?: string }) {
  const meta = BAND_META[band];
  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  );
}

const REVIEW_META: Record<ReviewStatus, { label: string; variant: BadgeVariant }> = {
  unreviewed: { label: "Unreviewed", variant: "default" },
  in_review: { label: "In review", variant: "info" },
  reviewed: { label: "Reviewed", variant: "status-approved" },
  escalated: { label: "Escalated", variant: "status-rejected" },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const meta = REVIEW_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

const MARK_META: Record<OutcomeMark, { label: string; variant: BadgeVariant }> = {
  confirmed_correct: { label: "Confirmed", variant: "status-approved" },
  false_positive: { label: "False positive", variant: "warning" },
  false_negative: { label: "False negative", variant: "risk-high" },
};

export function OutcomeMarkBadge({ mark }: { mark: OutcomeMark | null }) {
  if (!mark) return null;
  const meta = MARK_META[mark];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

/**
 * Horizontal 0–1 meter. `markers` draw threshold ticks (e.g. reviewBelow / watchBelow).
 * Renders an accessible meter; null values render as an empty track.
 */
export function Meter({
  value,
  label,
  barClassName = "bg-accent-cyan",
  markers = [],
  className,
}: {
  value: number | null;
  label: string;
  barClassName?: string;
  markers?: { at: number; label: string }[];
  className?: string;
}) {
  const pct = value == null ? 0 : Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={value ?? undefined}
      aria-valuetext={value == null ? "not available" : value.toFixed(2)}
      className={cn("relative h-2 w-full rounded-full bg-bg-subtle", className)}
    >
      <div className={cn("h-full rounded-full", barClassName)} style={{ width: `${pct}%` }} />
      {markers.map((m) => (
        <span
          key={m.label}
          title={`${m.label}: ${m.at}`}
          className="absolute top-[-3px] h-[14px] w-px bg-ink-muted"
          style={{ left: `${Math.max(0, Math.min(1, m.at)) * 100}%` }}
        />
      ))}
    </div>
  );
}
