import { cn } from "@/lib/utils";
import { formatScore, type HistogramBin } from "./helpers";

/**
 * Tailwind histogram over [0, 1]. Markers draw vertical lines at exact axis
 * positions (e.g. display thresholds). The bar list doubles as the text
 * alternative for screen readers.
 */
export function DistributionBars({
  bins,
  barClass,
  describeBin,
  markers = [],
  label,
  unit = "events",
}: {
  bins: HistogramBin[];
  barClass: (bin: HistogramBin) => string;
  /** Optional extra text per bin (e.g. band name) for the accessible label. */
  describeBin?: (bin: HistogramBin) => string;
  markers?: { at: number; label: string }[];
  label: string;
  unit?: string;
}) {
  const max = Math.max(1, ...bins.map((b) => b.count));
  return (
    <figure className="space-y-1">
      <figcaption className="sr-only">{label}</figcaption>
      <div className="relative h-36">
        <ul className="flex h-full items-end gap-px" aria-label={label}>
          {bins.map((bin) => {
            const extra = describeBin ? `, ${describeBin(bin)}` : "";
            const text = `${formatScore(bin.from)} to ${formatScore(bin.to)}: ${bin.count} ${unit}${extra}`;
            return (
              <li
                key={bin.from}
                className="group relative flex h-full flex-1 items-end"
                title={text}
                aria-label={text}
              >
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-opacity group-hover:opacity-100",
                    bin.count > 0 ? "opacity-80" : "opacity-0",
                    barClass(bin),
                  )}
                  style={{ height: bin.count > 0 ? `max(3px, ${(bin.count / max) * 100}%)` : 0 }}
                />
              </li>
            );
          })}
        </ul>
        {markers.map((m) => (
          <div
            key={m.label}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 border-l border-dashed border-ink/70"
            style={{ left: `${Math.max(0, Math.min(1, m.at)) * 100}%` }}
          >
            <span className="absolute -top-0.5 left-1 whitespace-nowrap rounded bg-bg-panel/90 px-1 text-[10px] text-ink-muted">
              {m.label}
            </span>
          </div>
        ))}
      </div>
      <div aria-hidden className="flex justify-between border-t border-line pt-1 text-[10px] text-ink-subtle">
        <span>0.00</span>
        <span>0.50</span>
        <span>1.00</span>
      </div>
    </figure>
  );
}
