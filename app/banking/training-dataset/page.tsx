import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { StatCard } from "@/components/stat-card";
import { TrainingDatasetFilters } from "@/components/training-dataset-filters";
import {
  getTrainingDatasetOverview,
  getTrainingFilterOptions,
  type TrainingDatasetFilters as Filters,
} from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseFilters(searchParams: Record<string, string | string[] | undefined>): Filters {
  const get = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };
  return {
    finalIntent: get("finalIntent"),
    labelSource: get("labelSource"),
    actionOutcome: get("actionOutcome"),
    minScore: get("minScore") ? Number(get("minScore")) : undefined,
    maxScore: get("maxScore") ? Number(get("maxScore")) : undefined,
    daysBack: get("daysBack") ? Number(get("daysBack")) : 30,
  };
}

export default async function TrainingDatasetPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = parseFilters(searchParams);
  const [overview, options] = await Promise.all([
    getTrainingDatasetOverview(filters),
    getTrainingFilterOptions(),
  ]);

  return (
    <div className="min-h-screen bg-surface-base text-ink">
      <header className="border-b border-surface-border bg-surface-raised/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-accent-cyan/30 bg-accent-cyan/10">
              <Database className="size-4 text-accent-cyan" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-cyan">
                ELAH Analytics
              </p>
              <h1 className="text-xl font-semibold">ELAH Training Dataset</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/founder/model-roadmap"
              className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              Model Roadmap
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-lg border border-surface-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="size-3.5" />
              Overview
            </Link>
            <AutoRefresh defaultSeconds={15} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <p className="text-sm text-ink-muted">
          Read-only view of labeled assistant interactions collected for future ELAH
          model training. ELAH scores intention only — banks own allow/block thresholds.
        </p>

        <TrainingDatasetFilters options={options} active={filters} />

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Training events" value={overview.total.toLocaleString()} tone="info" />
          <StatCard
            label="Avg ELAH score"
            value={overview.avgScore.toFixed(3)}
            hint={`${overview.minScore.toFixed(2)} – ${overview.maxScore.toFixed(2)}`}
          />
          <StatCard
            label="Intent types"
            value={overview.byIntent.length.toLocaleString()}
          />
          <StatCard
            label="Label sources"
            value={overview.byLabelSource.length.toLocaleString()}
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="panel">
            <div className="mb-3 panel-title">Count by finalIntent</div>
            {overview.byIntent.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No training events yet. Use the assistant or run backfill from the banking
                admin API.
              </p>
            ) : (
              <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
                {overview.byIntent.map((row) => (
                  <li
                    key={row.finalIntent}
                    className="flex items-center justify-between gap-3 border-b border-surface-border/50 py-1.5 last:border-0"
                  >
                    <code className="text-xs text-ink-muted">{row.finalIntent}</code>
                    <span className="tabular-nums text-ink">{row.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel">
            <div className="mb-3 panel-title">Count by labelSource</div>
            <ul className="space-y-1 text-sm">
              {overview.byLabelSource.map((row) => (
                <li
                  key={row.labelSource}
                  className="flex items-center justify-between gap-3 border-b border-surface-border/50 py-1.5 last:border-0"
                >
                  <span className="capitalize text-ink-muted">{row.labelSource}</span>
                  <span className="tabular-nums text-ink">{row.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel">
          <div className="mb-3 panel-title">Recent training events</div>
          {overview.recent.length === 0 ? (
            <p className="text-sm text-ink-muted">No rows match the current filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-[10px] uppercase tracking-wider text-ink-dim">
                    <th className="px-2 py-2">User question</th>
                    <th className="px-2 py-2">Assistant answer</th>
                    <th className="px-2 py-2">Intent</th>
                    <th className="px-2 py-2">Score</th>
                    <th className="px-2 py-2">Agency</th>
                    <th className="px-2 py-2">Risk</th>
                    <th className="px-2 py-2">Urgency</th>
                    <th className="px-2 py-2">Tool</th>
                    <th className="px-2 py-2">Outcome</th>
                    <th className="px-2 py-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recent.map((row) => (
                    <tr key={row.id} className="border-b border-surface-border/40 align-top">
                      <td className="max-w-[180px] px-2 py-2 text-ink">
                        <span className="line-clamp-2">{row.userQuestion}</span>
                      </td>
                      <td className="max-w-[180px] px-2 py-2 text-ink-muted">
                        <span className="line-clamp-2">{row.assistantAnswer}</span>
                      </td>
                      <td className="px-2 py-2">
                        <code className="text-[10px]">{row.finalIntent}</code>
                      </td>
                      <td className="px-2 py-2 tabular-nums text-accent-cyan">
                        {row.elahScoreLabel.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 tabular-nums">{row.humanAgency.toFixed(2)}</td>
                      <td className="px-2 py-2 tabular-nums">{row.financialRisk.toFixed(2)}</td>
                      <td className="px-2 py-2 tabular-nums">
                        {row.emotionalUrgency.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-ink-dim">{row.plannedTool ?? "—"}</td>
                      <td className="px-2 py-2 capitalize">{row.actionOutcome}</td>
                      <td className="px-2 py-2 capitalize">{row.labelSource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
