"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLE_SCORE = 0.72;

type OutcomeBand = "below" | "near" | "above";

function outcomeBand(score: number, threshold: number): OutcomeBand {
  const delta = score - threshold;
  if (Math.abs(delta) <= 0.08) return "near";
  if (delta < 0) return "below";
  return "above";
}

const OUTCOME_COPY: Record<
  OutcomeBand,
  { title: string; body: string; tone: string }
> = {
  below: {
    title: "Below bank threshold",
    body: "The bank may choose not to allow autonomous execution and may route to clarification or manual review.",
    tone: "border-accent-rose/30 bg-accent-rose/5 text-accent-rose",
  },
  near: {
    title: "Near bank threshold",
    body: "The bank may ask the customer for clarification before proceeding to its own policy layer.",
    tone: "border-accent-amber/30 bg-accent-amber/5 text-accent-amber",
  },
  above: {
    title: "Above bank threshold",
    body: "The bank may continue to its own policy layer (tier limits, confirmation rules, fraud checks). ELAH does not allow or block.",
    tone: "border-accent-emerald/30 bg-accent-emerald/5 text-accent-emerald",
  },
};

export function ThresholdSimulator() {
  const [threshold, setThreshold] = useState(0.65);

  const band = useMemo(
    () => outcomeBand(EXAMPLE_SCORE, threshold),
    [threshold],
  );
  const outcome = OUTCOME_COPY[band];

  return (
    <section className="panel">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent-violet/30 bg-accent-violet/10">
          <SlidersHorizontal className="size-4 text-accent-violet" />
        </div>
        <div>
          <h2 className="panel-title">Threshold simulator</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Illustrates how a bank might use an ELAH score — all outcomes are
            bank-owned decisions, not ELAH policy.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-5">
          <label htmlFor="bank-threshold" className="text-sm font-medium text-ink">
            Bank threshold
          </label>
          <p className="mt-0.5 text-xs text-ink-dim">
            Set by the customer — ELAH never applies this value
          </p>

          <div className="mt-4 flex items-center gap-4">
            <input
              id="bank-threshold"
              type="range"
              min={0}
              max={100}
              value={Math.round(threshold * 100)}
              onChange={(e) => setThreshold(Number(e.target.value) / 100)}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-surface-border accent-accent-cyan"
            />
            <span className="min-w-[3rem] text-right text-xl font-semibold tabular-nums text-accent-cyan">
              {threshold.toFixed(2)}
            </span>
          </div>

          <div className="mt-4 flex justify-between text-[10px] text-ink-dim">
            <span>0.00</span>
            <span>Low confidence</span>
            <span>1.00</span>
          </div>

          <div className="mt-6 rounded-lg border border-surface-border bg-surface-raised p-3 text-xs">
            <p className="text-ink-dim">Example message score (fixed for demo)</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
              ELAH Score: {EXAMPLE_SCORE.toFixed(2)}
            </p>
            <p className="mt-0.5 text-ink-muted">
              &ldquo;Send Daniel ₪250&rdquo; → external_transfer
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className={cn("rounded-xl border p-4", outcome.tone)}>
            <p className="text-sm font-semibold">{outcome.title}</p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">{outcome.body}</p>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface-subtle/30 p-4 text-xs text-ink-muted">
            <p className="font-medium text-ink">Reference outcomes at this threshold</p>
            <ul className="mt-2 space-y-2">
              <li>
                <strong className="text-ink">Score below threshold:</strong>{" "}
                Bank may choose not to allow autonomous execution
              </li>
              <li>
                <strong className="text-ink">Score near threshold:</strong>{" "}
                Bank may ask clarification
              </li>
              <li>
                <strong className="text-ink">Score above threshold:</strong>{" "}
                Bank may continue to its own policy layer
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
