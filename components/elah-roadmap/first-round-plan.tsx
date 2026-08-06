import { Building2, Calendar, Rocket, Target } from "lucide-react";
import {
  FIRST_ROUND_PLAN,
  USE_OF_FUNDS,
  USE_OF_FUNDS_TOTAL,
} from "@/lib/elah-roadmap-data";

const HIGHLIGHTS = [
  {
    label: "Target raise",
    value: FIRST_ROUND_PLAN.targetRaise,
    icon: Target,
    accent: "text-accent-gold",
  },
  {
    label: "Round type",
    value: FIRST_ROUND_PLAN.roundType,
    icon: Building2,
    accent: "text-accent-cyan",
  },
  {
    label: "Runway",
    value: FIRST_ROUND_PLAN.runway,
    icon: Calendar,
    accent: "text-accent-violet",
  },
  {
    label: "Main milestone",
    value: FIRST_ROUND_PLAN.mainMilestone,
    icon: Rocket,
    accent: "text-accent-emerald",
  },
] as const;

export function FirstRoundPlan() {
  return (
    <section id="first-round-plan" className="panel scroll-mt-6 overflow-hidden">
      <div className="mb-6">
        <p className="panel-title">Fundraising</p>
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          First Round Plan
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted">
          {FIRST_ROUND_PLAN.description}
        </p>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {HIGHLIGHTS.map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-xl border border-surface-border bg-surface-subtle/40 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Icon className={`size-4 ${accent}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-dim">
                {label}
              </span>
            </div>
            <p className={`text-sm font-semibold leading-snug ${label === "Target raise" ? "text-2xl tabular-nums text-accent-gold" : "text-ink"}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Use of Funds</h3>
        <div className="overflow-x-auto rounded-xl border border-surface-border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-subtle/60 text-[10px] uppercase tracking-wider text-ink-dim">
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-right">Allocation</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Share</th>
              </tr>
            </thead>
            <tbody>
              {USE_OF_FUNDS.map((row) => {
                const pct = Math.round((row.amount / USE_OF_FUNDS_TOTAL.amount) * 100);
                return (
                  <tr
                    key={row.category}
                    className="border-b border-surface-border/50 last:border-0"
                  >
                    <td className="px-4 py-3 text-ink-muted">{row.category}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-ink">
                      {row.amountLabel}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 max-w-[120px] overflow-hidden rounded-full bg-surface-subtle">
                          <div
                            className="h-full rounded-full bg-accent-cyan/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs tabular-nums text-ink-dim">
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-accent-gold/5">
                <td className="px-4 py-3 font-semibold text-ink">Total</td>
                <td className="px-4 py-3 text-right text-lg font-semibold tabular-nums text-accent-gold">
                  {USE_OF_FUNDS_TOTAL.amountLabel}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-accent-gold/30 bg-gradient-to-r from-accent-gold/10 to-accent-cyan/5 px-5 py-4 text-center">
        <p className="text-base font-semibold tracking-tight text-ink sm:text-lg">
          {FIRST_ROUND_PLAN.closingStatement}
        </p>
      </div>
    </section>
  );
}
