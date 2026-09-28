import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ANALYST_DATE_PRESETS, type AnalystEventFilters } from "@/lib/elah/analyst/filters";
import {
  DASHBOARD_PATH,
  activeNarrowingFilters,
  formatUtcDateTime,
  isUncalibratedModel,
  presetHref,
} from "./helpers";

const PRESET_LABELS: Record<string, string> = {
  "1h": "Last hour",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

export function PresetNav({ filters }: { filters: AnalystEventFilters }) {
  const custom = !filters.preset || !!filters.from;
  return (
    <nav aria-label="Time window" className="flex flex-wrap items-center gap-1.5">
      {ANALYST_DATE_PRESETS.map((preset) => {
        const active = !custom && filters.preset === preset;
        return (
          <Link
            key={preset}
            href={presetHref(filters, preset)}
            aria-current={active ? "page" : undefined}
            aria-label={PRESET_LABELS[preset]}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan",
              active
                ? "border-accent-gold/60 bg-accent-gold/10 text-accent-gold"
                : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {preset}
          </Link>
        );
      })}
      {custom ? (
        <Badge variant="info">
          Custom range{filters.from ? ` from ${formatUtcDateTime(filters.from)}` : ""}
          {filters.to ? ` to ${formatUtcDateTime(filters.to)}` : ""}
        </Badge>
      ) : null}
    </nav>
  );
}

export function FilterChips({ filters }: { filters: AnalystEventFilters }) {
  const chips = activeNarrowingFilters(filters);
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-ink-subtle">Filtered by</span>
      {chips.map(([key, value]) => (
        <Badge key={key} variant="default" className="font-mono">
          {key}={value}
        </Badge>
      ))}
      <Link
        href={presetHref({ preset: filters.preset }, filters.preset ?? "24h")}
        className="text-accent-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
      >
        Clear filters
      </Link>
    </div>
  );
}

export function ModelBadges({ modelVersions }: { modelVersions: Record<string, number> }) {
  const entries = Object.entries(modelVersions).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) {
    return <Badge variant="warning">Scorer rules_v0 · uncalibrated</Badge>;
  }
  return (
    <>
      {entries.map(([version, count]) => (
        <Badge key={version} variant={isUncalibratedModel(version) ? "warning" : "default"}>
          Scorer {version}
          {isUncalibratedModel(version) ? " · uncalibrated" : ""} · {count} scored
        </Badge>
      ))}
    </>
  );
}

export const DASHBOARD_EMPTY_HREF = `${DASHBOARD_PATH}?preset=30d`;
