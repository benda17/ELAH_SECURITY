import { CheckCircle2, Circle } from "lucide-react";
import { TWELVE_MONTH_GOALS } from "@/lib/elah-roadmap-data";

export function TwelveMonthGoals() {
  return (
    <section id="twelve-month-goals" className="panel scroll-mt-6">
      <div className="mb-6">
        <p className="panel-title">Execution</p>
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          12-Month Goals
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Key outcomes funded by the first round — from company setup through first
          client installation.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {TWELVE_MONTH_GOALS.map((goal, index) => (
          <li
            key={goal}
            className="flex gap-3 rounded-xl border border-surface-border bg-surface-subtle/30 p-4 transition-colors hover:border-accent-cyan/20"
          >
            <span className="mt-0.5 shrink-0 text-ink-dim">
              <Circle className="size-5" aria-hidden />
            </span>
            <div>
              <span className="text-[10px] font-semibold tabular-nums text-accent-cyan">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{goal}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center gap-2 rounded-lg border border-surface-border bg-surface-subtle/40 px-4 py-3 text-xs text-ink-muted">
        <CheckCircle2 className="size-4 shrink-0 text-accent-emerald" />
        <span>
          Each goal maps to roadmap milestones below — product, data pipeline, ELAH
          service, model training, dashboard integration, and pilot readiness.
        </span>
      </div>
    </section>
  );
}
