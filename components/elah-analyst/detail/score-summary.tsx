import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BandBadge, Meter, bandBarClass } from "@/components/elah-analyst/shared";
import { bandForScore, type ElahDisplayThresholds } from "@/lib/elah/analyst/bands";
import { formatScoreNumber, type ElahScoreSnapshot } from "@/lib/elah/score-read";
import { formatDate } from "@/lib/utils";
import { Banner, KV, KVGrid } from "./primitives";
import { confidenceWord, formatPercent, isUncalibratedScorer } from "./explanation";

function StatusBadge({ snapshot }: { snapshot: ElahScoreSnapshot | null }) {
  if (!snapshot) return <Badge variant="default">not scored</Badge>;
  if (snapshot.kind === "unavailable") return <Badge variant="warning">unavailable</Badge>;
  if (snapshot.status === "abstained") return <Badge variant="warning">abstained</Badge>;
  return <Badge variant="info">scored</Badge>;
}

export function ScoreSummary({
  snapshot,
  thresholds,
  thresholdsLoaded,
}: {
  snapshot: ElahScoreSnapshot | null;
  thresholds: ElahDisplayThresholds;
  /** false when thresholds failed to load and defaults are shown. */
  thresholdsLoaded: boolean;
}) {
  const scored = snapshot?.kind === "scored" ? snapshot : null;
  const abstained = scored?.status === "abstained";
  const uncalibrated = scored ? isUncalibratedScorer(scored.provenanceScorer) : false;
  const band = bandForScore(scored?.elahScore ?? null, thresholds);
  const word = confidenceWord(scored?.confidence);

  return (
    <Card>
      <CardHeader
        title="ELAH score"
        description="Intention reading only — not an allow, deny, confirm, or execute decision. Bank policy remains the authority. This score is a separate snapshot, not a field of the event."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {uncalibrated ? <Badge variant="warning">Uncalibrated (rules)</Badge> : null}
            <StatusBadge snapshot={snapshot} />
          </div>
        }
      />

      {!snapshot ? (
        <Banner title="Not scored" tone="info">
          No ELAH score snapshot exists for this event. No number is shown because none was recorded.
        </Banner>
      ) : snapshot.kind === "unavailable" ? (
        <div className="space-y-4">
          <Banner title="Score unavailable">
            ELAH did not respond in time or returned an error. The assistant continued under bank policy only. There
            is no intention score to review.
          </Banner>
          <KVGrid>
            <KV k="Reason" v={snapshot.reason} />
            <KV k="Request id" v={snapshot.requestId ?? "—"} />
            <KV k="HTTP" v={snapshot.httpStatus != null ? String(snapshot.httpStatus) : "—"} />
            <KV k="Error code" v={snapshot.errorCode ?? "—"} />
          </KVGrid>
        </div>
      ) : (
        <div className="space-y-5">
          {abstained ? (
            <Banner title="ELAH abstained">
              Confidence is too low to treat this intention score as decisive. Bank policy still governs whether the
              tool runs. Queue for review; do not allow or block from this number.
            </Banner>
          ) : null}

          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className={abstained ? "opacity-60" : undefined}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-3xl font-semibold text-ink">
                  {formatScoreNumber(snapshot.elahScore)}
                </span>
                {abstained ? (
                  <span className="text-sm text-ink-muted">band muted (abstained)</span>
                ) : (
                  <BandBadge band={band} />
                )}
              </div>
              <p className="mt-1 text-xs text-ink-subtle">elahScore · 0–1, higher = more genuine banking intent</p>
              <Meter
                className="mt-3"
                label="elahScore"
                value={snapshot.elahScore}
                barClassName={abstained ? "bg-ink-subtle" : bandBarClass(band)}
                markers={[
                  { at: thresholds.reviewBelow, label: "review below" },
                  { at: thresholds.watchBelow, label: "watch below" },
                ]}
              />
              <p className="mt-2 text-xs text-ink-subtle">
                Display bands: review &lt; {thresholds.reviewBelow} ≤ watch &lt; {thresholds.watchBelow} ≤ clear.
                {thresholdsLoaded ? " Current analyst thresholds." : " Default thresholds (current ones failed to load)."}{" "}
                Thresholds only change how this page highlights the score; they never change it.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink-muted">Confidence</span>
                  <span className="font-mono text-ink">
                    {formatPercent(snapshot.confidence)}
                    {word ? <span className="ml-2 font-sans text-xs text-ink-subtle">{word}</span> : null}
                  </span>
                </div>
                <Meter className="mt-1.5" label="confidence" value={snapshot.confidence} />
              </div>
              <div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink-muted">Uncertainty</span>
                  <span className="font-mono text-ink">{formatPercent(snapshot.uncertainty)}</span>
                </div>
                <Meter
                  className="mt-1.5"
                  label="uncertainty"
                  value={snapshot.uncertainty}
                  barClassName="bg-accent-amber"
                />
              </div>
              <p className="text-xs text-ink-subtle">
                Confidence is strength of evidence, not a probability that the action is allowed.
              </p>
            </div>
          </div>

          <KVGrid>
            <KV k="Intent label" v={snapshot.intentLabel ?? "—"} />
            <KV k="Scorer" v={snapshot.provenanceScorer ?? "—"} />
            <KV k="Model version" v={snapshot.provenanceModelVersion ?? "—"} />
            <KV k="Scored at" v={snapshot.scoredAt ? formatDate(snapshot.scoredAt) : "—"} />
            <KV k="Request id" v={snapshot.requestId ?? "—"} />
            <KV k="Raw values" v={`score ${formatScoreNumber(snapshot.elahScore)} · conf ${formatScoreNumber(snapshot.confidence)} · unc ${formatScoreNumber(snapshot.uncertainty)}`} />
          </KVGrid>

          {uncalibrated ? (
            <p className="text-xs text-ink-subtle">
              Uncalibrated ({snapshot.provenanceScorer ?? "rules_v0"}): a rules baseline, not a trained or calibrated
              model. Treat confidence as strength of evidence, not a calibrated probability, and do not quote it as
              accuracy.
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}
