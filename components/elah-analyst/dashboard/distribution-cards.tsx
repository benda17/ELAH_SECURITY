import { Card, CardHeader } from "@/components/ui/card";
import { BandBadge, Meter, bandBarClass } from "@/components/elah-analyst/shared";
import type { ElahDisplayThresholds } from "@/lib/elah/analyst/bands";
import type { DashboardStats } from "@/lib/elah/analyst/stats";
import { DistributionBars } from "./distribution-bars";
import { ThresholdScale } from "./threshold-scale";
import {
  binBand,
  formatScore,
  histogram,
  meanConfidenceByBand,
  type DashboardExtras,
  type ScoredBand,
} from "./helpers";

const SCORED_BANDS: ScoredBand[] = ["review", "watch", "clear"];

export function ScoreDistributionCard({
  stats,
  extras,
  thresholds,
}: {
  stats: DashboardStats;
  extras: DashboardExtras;
  thresholds: ElahDisplayThresholds;
}) {
  const bins = histogram(
    extras.points.map((p) => p.score),
    20,
  );
  return (
    <Card>
      <CardHeader
        title="Score distribution & thresholds"
        description="ELAH score per scored event (0–1, higher = more genuine banking intent). Low scores land in Review. Thresholds only change grouping; they never change a score."
      />
      <div className="space-y-6">
        <ThresholdScale
          thresholds={thresholds}
          counts={{ review: stats.byBand.review, watch: stats.byBand.watch, clear: stats.byBand.clear }}
          total={stats.scored}
        />
        {extras.points.length === 0 ? (
          <p className="text-sm text-ink-muted">No scored events in this window.</p>
        ) : (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-subtle">
              Histogram · {extras.points.length} scored events · 0.05-wide bins
            </p>
            <DistributionBars
              bins={bins}
              label="ELAH score histogram"
              barClass={(bin) => bandBarClass(binBand(bin, thresholds))}
              describeBin={(bin) => `${binBand(bin, thresholds)} band`}
              markers={[
                { at: thresholds.reviewBelow, label: `review < ${formatScore(thresholds.reviewBelow)}` },
                { at: thresholds.watchBelow, label: `watch < ${formatScore(thresholds.watchBelow)}` },
              ]}
            />
          </div>
        )}
        <p className="text-xs text-ink-subtle">
          {stats.unscored} unscored event{stats.unscored === 1 ? "" : "s"} ({stats.abstained} abstained,{" "}
          {stats.unavailable} scorer unavailable, {stats.noScore} without a score row) are not plotted.
        </p>
      </div>
    </Card>
  );
}

export function ConfidenceCard({
  stats,
  extras,
  thresholds,
}: {
  stats: DashboardStats;
  extras: DashboardExtras;
  thresholds: ElahDisplayThresholds;
}) {
  const confidences = extras.points
    .map((p) => p.confidence)
    .filter((c): c is number => c != null);
  const missing = extras.points.length - confidences.length;
  const byBand = meanConfidenceByBand(extras.points, thresholds);
  return (
    <Card>
      <CardHeader
        title="Confidence"
        description="How sure the scorer was about each reading. rules_v0 is uncalibrated: confidence is a heuristic, not a probability of being right."
      />
      <div className="space-y-6">
        {confidences.length === 0 ? (
          <p className="text-sm text-ink-muted">No confidence values in this window.</p>
        ) : (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-subtle">
              Histogram · mean {formatScore(stats.averageConfidence)} · {confidences.length} values
            </p>
            <DistributionBars
              bins={histogram(confidences, 10)}
              label="Confidence histogram"
              unit="scored events"
              barClass={() => "bg-accent-cyan"}
            />
          </div>
        )}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-subtle">
            Mean confidence by band
          </p>
          <ul className="space-y-2">
            {SCORED_BANDS.map((band) => (
              <li key={band} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3">
                <BandBadge band={band} className="justify-center" />
                <Meter
                  value={byBand[band].mean}
                  label={`Mean confidence, ${band} band`}
                  barClassName="bg-accent-cyan"
                />
                <span className="text-right font-mono text-xs text-ink">
                  {formatScore(byBand[band].mean)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {missing > 0 ? (
          <p className="text-xs text-ink-subtle">
            {missing} scored event{missing === 1 ? "" : "s"} reported no confidence.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
