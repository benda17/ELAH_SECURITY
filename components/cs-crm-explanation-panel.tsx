"use client";

import type { IntentMatrixPoint } from "@/lib/intent-matrix-points";
import { alternativeInterpretations } from "@/lib/elah/cs-crm-coordinates";
import { cn } from "@/lib/utils";

const POLICY_PILL: Record<string, string> = {
  allow: "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald",
  needs_confirmation: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
  deny: "border-accent-rose/40 bg-accent-rose/10 text-accent-rose",
};

function recCopy(recommendation: string | null | undefined, unavailable?: boolean) {
  if (unavailable) return "Score unavailable — assistant continued under company policy only.";
  if (recommendation === "review") return "Advisory: review. ELAH never allow/block/execute.";
  if (recommendation === "abstain") return "Advisory: abstain (thin evidence). ELAH never allow/block/execute.";
  if (recommendation === "proceed") return "Advisory: proceed. Company policy still owns the tool.";
  return "Advisory only. ELAH never allow/block/execute.";
}

export function CsCrmExplanationPanel({
  selected,
}: {
  selected: IntentMatrixPoint | null;
}) {
  if (!selected) {
    return (
      <div className="rounded-xl border border-dashed border-surface-border bg-surface-subtle/30 p-4 text-xs text-ink-muted">
        <p className="font-medium text-ink">Selected-point evidence</p>
        <p className="mt-1">
          Click a dot on the cube. Opacity is confidence; dashed/hollow is unavailable or
          abstain; rings mark injection, policy deny, refund abuse, or ticket export.
        </p>
      </div>
    );
  }

  const reasons = selected.reasonCodes ?? [];
  const alternatives = alternativeInterpretations(reasons);
  const meta = selected.metadataSanitized ?? {};
  const policy = selected.policyDecision;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-4 text-xs leading-relaxed">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-cyan">
        Selected-point evidence
      </p>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
        Intent assessment — why it appears aligned or misaligned
      </p>
      <h3 className="mt-1 font-mono text-sm font-semibold text-ink">{selected.intentLabel}</h3>
      <p className="mt-1 text-ink-muted">
        {selected.unavailable
          ? "No usable intention number (fail-open)."
          : selected.genuineIntentScore != null
            ? `Genuine-intent ${selected.genuineIntentScore.toFixed(2)}`
            : "No score on this snapshot."}
        {selected.confidence != null ? ` · confidence ${selected.confidence.toFixed(2)}` : ""}
      </p>

      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-ink-dim">Scorer</dt>
          <dd className="font-mono text-ink">{selected.scorer ?? "cs_crm_rules_v0"}</dd>
        </div>
        <div>
          <dt className="text-ink-dim">Recommendation</dt>
          <dd className="text-ink">{recCopy(selected.recommendation, selected.unavailable)}</dd>
        </div>
      </dl>

      <section className="mt-3 rounded-lg border border-surface-border bg-surface-raised/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
          Action evidence — what happened
        </p>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-ink-dim">Platform action / tool</dt>
            <dd className="font-mono text-ink">
              {selected.platformAction ?? selected.toolName ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-dim">Normalized action</dt>
            <dd className="font-mono text-ink">
              {selected.normalizedActionId
                ? `${selected.normalizedActionId} · ${selected.normalizedActionName ?? "name unavailable"}`
                : "Unmapped — no research ID"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-dim">Class</dt>
            <dd className="text-ink">{selected.actionClass ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-dim">Ontology impact</dt>
            <dd className="text-ink">{selected.actionImpact ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-ink-dim">Mapping provenance / status</dt>
            <dd className="text-ink">
              <span className="font-mono">{selected.actionMappingStatus ?? "unmapped"}</span>
              {selected.actionMappingReason ? ` · ${selected.actionMappingReason}` : ""}
            </dd>
            <p className="mt-1 text-[10px] text-ink-dim">
              Impact is research evidence, not “ELAH blocked” and not a company-policy decision.
            </p>
          </div>
        </dl>
      </section>

      <section className="mt-3 rounded-lg border border-surface-border p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
          Company policy — separate decision
        </p>
        <div className="mt-2">
          {policy ? (
            <span className={cn("pill capitalize", POLICY_PILL[policy] ?? "border-surface-border text-ink-muted")}>
              {policy.replace(/_/g, " ")}
            </span>
          ) : (
            <span className="text-ink-muted">—</span>
          )}
          <p className="mt-1 text-[10px] text-ink-dim">
            Company policy owns allow, deny, and confirmation. ELAH never executes the tool.
          </p>
        </div>
      </section>

      {selected.messageSnippet ? (
        <div className="mt-3">
          <p className="text-ink-dim">Utterance snippet</p>
          <p className="mt-0.5 text-ink">{selected.messageSnippet}</p>
        </div>
      ) : null}

      <div className="mt-3">
        <p className="text-ink-dim">Reason codes</p>
        {reasons.length ? (
          <ul className="mt-1 flex flex-wrap gap-1">
            {reasons.map((code) => (
              <li
                key={code}
                className="rounded border border-surface-border bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-ink"
              >
                {code}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-0.5 text-ink-muted">None on this snapshot.</p>
        )}
      </div>

      <div className="mt-3">
        <p className="text-ink-dim">Alternative interpretations</p>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-ink-muted">
          {alternatives.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3 border-t border-surface-border pt-3">
        <p className="text-ink-dim">Raw event (founder)</p>
        <p className="mt-0.5 font-mono text-[10px] text-ink">
          eventId {selected.eventId ?? "—"}
        </p>
        <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-surface-border bg-[#0a0f18] p-2 font-mono text-[10px] text-ink-muted">
          {JSON.stringify(meta, null, 2)}
        </pre>
      </div>

      <p className="mt-3 font-mono text-[10px] text-ink-dim">
        x={selected.x.toFixed(3)} · y={selected.y.toFixed(3)} · z={selected.z.toFixed(3)} ·{" "}
        {new Date(selected.timestamp).toLocaleString()}
      </p>
    </div>
  );
}
