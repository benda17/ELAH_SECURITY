import { Activity, Crosshair, Gauge, ListChecks } from "lucide-react";
import { StatCard } from "@/components/ui/card";
import { BandBadge } from "@/components/elah-analyst/shared";
import { bandForScore, type ElahDisplayThresholds } from "@/lib/elah/analyst/bands";
import type { DashboardStats } from "@/lib/elah/analyst/stats";
import { formatPct, formatScore, type DashboardExtras } from "./helpers";

export function KpiCards({
  stats,
  extras,
  thresholds,
}: {
  stats: DashboardStats;
  extras: DashboardExtras;
  thresholds: ElahDisplayThresholds;
}) {
  const meanBand = bandForScore(stats.averageScore, thresholds);
  return (
    <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Events"
        value={stats.total}
        hint={`${stats.scored} scored · ${formatPct(stats.scored, stats.total)} coverage`}
        icon={<Activity className="size-4" aria-hidden />}
        accent="cyan"
      />
      <StatCard
        label="Mean ELAH score"
        value={formatScore(stats.averageScore)}
        trend={stats.averageScore != null ? <BandBadge band={meanBand} /> : undefined}
        hint="0–1 · higher = more genuine banking intent"
        icon={<Gauge className="size-4" aria-hidden />}
        accent="gold"
      />
      <StatCard
        label="Mean confidence"
        value={formatScore(stats.averageConfidence)}
        hint="Heuristic from an uncalibrated scorer — not a probability"
        icon={<Crosshair className="size-4" aria-hidden />}
        accent="emerald"
      />
      <StatCard
        label="Review band"
        value={stats.byBand.review}
        hint={`${extras.reviewUnreviewed} still unreviewed · ${formatPct(stats.byBand.review, stats.total)} of events`}
        icon={<ListChecks className="size-4" aria-hidden />}
        accent="rose"
      />
    </section>
  );
}
