import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ElahEvent } from "@/lib/elah/envelope";
import type { ElahScoreSnapshot } from "@/lib/elah/score-read";
import { ChipList, FieldLabel, KV, KVGrid } from "./primitives";
import {
  classifyHookRecommendation,
  groupReasonCodes,
  hasAnyEvidence,
  isUncalibratedScorer,
  structuredAlternatives,
  type AlternativeSources,
} from "./explanation";

function hookVariant(value: string): "default" | "info" | "warning" {
  if (value === "watch") return "info";
  if (value === "review" || value === "step_up_hint") return "warning";
  return "default";
}

/**
 * Layer C evidence panel (ELAH-P7-PANEL-001). Renders only what the snapshot
 * contains: signal lists, optional summary, policyHook, provenance. The bank
 * policy decision is shown in a separate block and attributed to bank policy.
 */
export function ExplanationPanel({
  snapshot,
  policy,
  alternatives: alternativeSources,
}: {
  snapshot: ElahScoreSnapshot | null;
  policy: ElahEvent["policy"];
  alternatives: AlternativeSources;
}) {
  const scored = snapshot?.kind === "scored" ? snapshot : null;

  return (
    <Card>
      <CardHeader
        title="Explanation"
        description="Structured evidence exactly as recorded on the score snapshot. No chain-of-thought, no invented reasons."
      />

      {!scored ? (
        <p className="text-sm text-ink-muted">
          {snapshot?.kind === "unavailable"
            ? "Score unavailable — ELAH returned no explanation for this event."
            : "Not scored — there is no explanation to show."}
        </p>
      ) : (
        <ScoredExplanation snapshot={scored} alternativeSources={alternativeSources} />
      )}

      <section aria-labelledby="bank-policy-context" className="mt-5 rounded-lg border border-line bg-bg-panel/40 px-4 py-3">
        <FieldLabel id="bank-policy-context">Bank policy — separate decision</FieldLabel>
        <p className="mt-1 text-xs text-ink-muted">
          Bank policy decides allow / deny / confirm. ELAH did not make this decision.
        </p>
        {policy ? (
          <KVGrid className="mt-2 md:grid-cols-3">
            <KV k="Decision" v={policy.decision.replaceAll("_", " ")} />
            <KV k="Confirmation required" v={policy.confirmationRequired ? "yes" : "no"} />
            <KV k="Policy reasons" v={policy.reasons.length ? policy.reasons.join(", ") : "—"} />
          </KVGrid>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">No bank policy block on this event.</p>
        )}
      </section>
    </Card>
  );
}

function ScoredExplanation({
  snapshot,
  alternativeSources,
}: {
  snapshot: Extract<ElahScoreSnapshot, { kind: "scored" }>;
  alternativeSources: AlternativeSources;
}) {
  const { explanation, policyHook } = snapshot;
  const reasons = groupReasonCodes(policyHook.reasons);
  const hook = classifyHookRecommendation(policyHook.recommendation);
  const alternatives = structuredAlternatives(snapshot, alternativeSources);

  return (
    <div className="space-y-5">
      <section aria-labelledby="intent-assessment" className="space-y-4">
        <FieldLabel id="intent-assessment">Intent assessment — why aligned / misaligned</FieldLabel>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info" className="font-mono">
            {snapshot.intentLabel ?? "no intent label"}
          </Badge>
          {snapshot.status === "abstained" ? <Badge variant="warning">abstained</Badge> : null}
        </div>

        {!hasAnyEvidence(snapshot) ? (
          <p className="text-sm text-ink-muted">The scorer recorded no signals, reason codes, or summary.</p>
        ) : null}

        {explanation.summary ? (
          <div>
            <FieldLabel>Scorer summary (verbatim)</FieldLabel>
            <p className="mt-1 text-sm text-ink">{explanation.summary}</p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <ChipList label="For this intent (matched)" items={explanation.matchedSignals} variant="status-approved" />
          <ChipList label="Thin evidence (weak)" items={explanation.weakSignals} variant="default" />
          <ChipList label="Against / hostile (negative)" items={explanation.negativeSignals} variant="risk-high" />
        </div>
      </section>

      <section aria-labelledby="policy-hook" className="space-y-3 rounded-lg border border-line bg-bg-panel/40 px-4 py-3">
        <FieldLabel id="policy-hook">policyHook — analyst attention hint only</FieldLabel>
        <p className="text-xs text-ink-muted">Not an allow, deny, confirm, or execute decision.</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-muted">Recommendation:</span>
          {hook.kind === "missing" ? (
            <span className="text-sm text-ink-muted">—</span>
          ) : (
            <Badge variant={hook.kind === "known" ? hookVariant(hook.value) : "warning"} className="font-mono">
              {hook.value}
            </Badge>
          )}
          {hook.kind === "unrecognized" ? (
            <span className="text-xs text-accent-amber">
              Not a recognized hook value (none / watch / review / step_up_hint); shown verbatim.
            </span>
          ) : null}
        </div>
        <ChipList label="Reason codes" items={reasons.codes} />
        {reasons.nonconforming.length > 0 ? (
          <ChipList label="Other reason tokens (not RC_*; shown verbatim)" items={reasons.nonconforming} variant="warning" />
        ) : null}
        {reasons.forbidden.length > 0 ? (
          <div>
            <ChipList label="Enforcement-shaped tokens (contract violation)" items={reasons.forbidden} variant="status-rejected" />
            <p className="mt-1 text-xs text-accent-rose">
              ELAH must not emit allow / deny / block codes. These are shown verbatim for faithfulness; they are not
              ELAH decisions.
            </p>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="alternatives">
        <FieldLabel id="alternatives">Alternative interpretations</FieldLabel>
        {alternatives.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">No structured alternative.</p>
        ) : (
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-ink">
            {alternatives.map((line) => (
              <li key={line.text}>
                <span className="font-mono">{line.text}</span>{" "}
                <span className="text-xs text-ink-subtle">
                  {line.kind === "counter_signal" ? "(evidence against the chosen label)" : "(disagreement, not a second score)"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="provenance">
        <FieldLabel id="provenance">Provenance</FieldLabel>
        <p className="mt-1 font-mono text-sm text-ink">
          Scorer {snapshot.provenanceScorer ?? "—"} · modelVersion {snapshot.provenanceModelVersion ?? "—"}
          {isUncalibratedScorer(snapshot.provenanceScorer) ? " · Uncalibrated (rules)" : ""}
        </p>
      </section>
    </div>
  );
}
