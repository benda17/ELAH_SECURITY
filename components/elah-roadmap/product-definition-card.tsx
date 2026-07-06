import { ArrowRight, Scale } from "lucide-react";
import { PRODUCT_EXAMPLE } from "@/lib/elah-roadmap-data";

export function ProductDefinitionCard() {
  const { input, output } = PRODUCT_EXAMPLE;

  return (
    <section className="panel">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-accent-gold/30 bg-accent-gold/10">
          <Scale className="size-4 text-accent-gold" />
        </div>
        <div>
          <h2 className="panel-title">Product definition</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink">
            ELAH does not decide whether to allow, block, or confirm an action.
            ELAH only returns a numeric intention score, graph coordinates, and
            an explanation.{" "}
            <strong className="font-semibold text-accent-cyan">
              The bank defines the threshold.
            </strong>
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-dim">
            Input
          </p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-ink-muted">User message</dt>
              <dd className="mt-0.5 font-medium text-ink">
                &ldquo;{input.userMessage}&rdquo;
              </dd>
            </div>
          </dl>
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <ArrowRight className="size-5 text-accent-cyan" />
        </div>

        <div className="rounded-xl border border-accent-cyan/20 bg-accent-cyan/5 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-accent-cyan">
            ELAH output
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-ink-muted">ELAH Score</dt>
              <dd className="text-2xl font-semibold tabular-nums text-accent-cyan">
                {output.elahScore.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Primary Intent</dt>
              <dd>
                <code className="rounded bg-surface-raised px-1.5 py-0.5 text-xs text-ink">
                  {output.primaryIntent}
                </code>
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-ink-muted">Coordinates</dt>
              <dd className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-dim">Human Agency</span>
                  <span className="text-ink">{output.coordinates.humanAgency.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-dim">Financial Risk</span>
                  <span className="text-ink">{output.coordinates.financialRisk.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-dim">Emotional Urgency</span>
                  <span className="text-ink">{output.coordinates.emotionalUrgency.toFixed(2)}</span>
                </div>
              </dd>
            </div>
            <div>
              <dt className="mb-1 text-ink-muted">Explanation</dt>
              <dd>
                <ul className="space-y-0.5 text-xs text-ink-muted">
                  {output.explanation.map((line) => (
                    <li key={line} className="flex items-center gap-1.5">
                      <span className="size-1 rounded-full bg-accent-emerald" />
                      {line}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
