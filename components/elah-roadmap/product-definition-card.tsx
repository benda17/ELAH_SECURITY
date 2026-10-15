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
            A person who ticks &ldquo;I&apos;m not a robot&rdquo; is not checked.
            An agent declares a bounded job and the functions it needs. ELAH runs
            three inert exercises and returns a decision. Only{" "}
            <strong className="font-semibold text-accent-cyan">allow_limited</strong>{" "}
            issues a token, and only for functions the declaration and guest
            policy both allow.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-xl border border-surface-border bg-surface-subtle/40 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-dim">
            Declaration
          </p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-ink-muted">Task</dt>
              <dd className="mt-0.5 font-medium text-ink">{input.summary}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Requested functions</dt>
              <dd className="mt-0.5 text-ink">{input.functions}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Profile</dt>
              <dd className="mt-0.5 font-mono text-xs text-ink">{input.profile}</dd>
            </div>
          </dl>
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <ArrowRight className="size-5 text-accent-cyan" />
        </div>

        <div className="rounded-xl border border-accent-cyan/20 bg-accent-cyan/5 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-accent-cyan">
            Admission report
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-ink-muted">Decision</dt>
              <dd className="font-mono text-sm font-semibold text-accent-cyan">
                {output.decision}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Reason</dt>
              <dd>
                <code className="rounded bg-surface-raised px-1.5 py-0.5 text-xs text-ink">
                  {output.reason}
                </code>
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Granted</dt>
              <dd className="mt-0.5 text-xs text-ink">{output.granted}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Blocked</dt>
              <dd className="mt-0.5 text-xs text-ink">{output.blocked}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Token</dt>
              <dd className="mt-0.5 text-xs text-ink-muted">{output.token}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Assurance</dt>
              <dd className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                {output.assurance}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-ink-dim">
        Asking for payment at declaration returns step_up_required and no token.
        This slice has no approval flow. The example is one honest local run, not
        a live customer.
      </p>
    </section>
  );
}
