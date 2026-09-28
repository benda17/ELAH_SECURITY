import { cn } from "@/lib/utils";
import { BandBadge, bandBarClass } from "@/components/elah-analyst/shared";
import type { ElahDisplayThresholds } from "@/lib/elah/analyst/bands";
import { formatPct, formatScore, type ScoredBand } from "./helpers";

const AXIS_TICKS = [0, 0.25, 0.5, 0.75, 1];

function segments(t: ElahDisplayThresholds): { band: ScoredBand; from: number; to: number }[] {
  return [
    { band: "review", from: 0, to: t.reviewBelow },
    { band: "watch", from: t.reviewBelow, to: t.watchBelow },
    { band: "clear", from: t.watchBelow, to: 1 },
  ];
}

function rangeText(band: ScoredBand, from: number, to: number): string {
  if (from === to) return "empty range";
  if (band === "clear") return `${formatScore(from)} – 1.00`;
  return `${formatScore(from)} – < ${formatScore(to)}`;
}

/**
 * 0–1 score axis split into display bands, with per-band counts. Bands are
 * always labelled in text; colour is supplementary.
 */
export function ThresholdScale({
  thresholds,
  counts,
  total,
  title = "Display bands on the 0–1 ELAH score axis",
  className,
}: {
  thresholds: ElahDisplayThresholds;
  counts: Record<ScoredBand, number>;
  /** Denominator for percentages (scored events). */
  total: number;
  title?: string;
  className?: string;
}) {
  const segs = segments(thresholds);
  return (
    <figure className={cn("space-y-3", className)}>
      <figcaption className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
        {title}
      </figcaption>
      <div aria-hidden className="relative">
        <div className="flex h-8 w-full overflow-hidden rounded-md border border-line">
          {segs.map((s) =>
            s.to > s.from ? (
              <div
                key={s.band}
                className={cn(
                  "flex items-center justify-center overflow-hidden text-[11px] font-semibold text-bg-base",
                  bandBarClass(s.band),
                  "opacity-80",
                )}
                style={{ width: `${(s.to - s.from) * 100}%` }}
              >
                <span className="truncate px-1 capitalize">{s.band}</span>
              </div>
            ) : null,
          )}
        </div>
        {[thresholds.reviewBelow, thresholds.watchBelow].map((at, i) => (
          <span
            key={i}
            className="absolute -top-1 h-10 w-0.5 -translate-x-1/2 bg-ink"
            style={{ left: `${at * 100}%` }}
          />
        ))}
        <div className="relative mt-1 h-4 text-[10px] text-ink-subtle">
          {AXIS_TICKS.map((tick) => (
            <span
              key={tick}
              className={cn(
                "absolute",
                tick === 0 ? "left-0" : tick === 1 ? "right-0" : "-translate-x-1/2",
              )}
              style={tick > 0 && tick < 1 ? { left: `${tick * 100}%` } : undefined}
            >
              {tick.toFixed(2)}
            </span>
          ))}
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {segs.map((s) => (
          <li
            key={s.band}
            className="flex items-center justify-between gap-2 rounded-lg border border-line bg-bg-subtle/40 px-3 py-2"
          >
            <div className="min-w-0">
              <BandBadge band={s.band} />
              <div className="mt-1 font-mono text-[11px] text-ink-muted">
                {rangeText(s.band, s.from, s.to)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-ink">{counts[s.band]}</div>
              <div className="text-[11px] text-ink-subtle">{formatPct(counts[s.band], total)}</div>
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}
