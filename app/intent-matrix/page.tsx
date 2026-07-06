import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, ShieldAlert } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import {
  IntentDistributionChart,
  IntentRiskHeatmap,
} from "@/components/charts/intent-matrix";
import { IntentMatrixView } from "@/components/intent-matrix-view";
import { IntentMatrixExplainer } from "@/components/intent-matrix-explainer";
import {
  getIntentMatrixOverview,
  getIntentSecurityPanel,
  getIntentUserBehavior,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RISK_PILL: Record<string, string> = {
  low: "text-accent-emerald border-accent-emerald/30 bg-accent-emerald/10",
  medium: "text-accent-amber border-accent-amber/30 bg-accent-amber/10",
  high: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  critical: "text-accent-rose border-accent-rose/30 bg-accent-rose/10",
};

export default async function IntentMatrixPage() {
  const [overview, users, security] = await Promise.all([
    getIntentMatrixOverview(14),
    getIntentUserBehavior(14),
    getIntentSecurityPanel(14),
  ]);

  return (
    <div className="min-h-screen bg-surface-base text-ink">
      <header className="border-b border-surface-border bg-surface-raised/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/elah-logo.png" alt="ELAH" width={36} height={36} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-cyan">
                ELAH Analytics
              </p>
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                <BrainCircuit className="size-5 text-accent-cyan" />
                Human Intent Matrix
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-lg border border-surface-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="size-3.5" />
              Overview
            </Link>
            <AutoRefresh defaultSeconds={5} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Full-width intent scatter */}
        <section className="rounded-2xl border border-surface-border bg-surface-raised p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">3D Intent Space</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Toggle 2D projection or interactive 3D space · each dot = one classified message
              </p>
            </div>
            {overview.totalEventCount > 0 && (
              <p className="text-xs text-ink-muted">
                <span className="font-semibold tabular-nums text-accent-cyan">
                  {overview.totalEventCount.toLocaleString()}
                </span>{" "}
                messages ·{" "}
                <span className="font-semibold tabular-nums text-ink">
                  {overview.uniqueIntentTypes}
                </span>{" "}
                intent clusters
              </p>
            )}
          </div>
          {overview.points.length ? (
            <IntentMatrixView data={overview.points} />
          ) : (
            <p className="py-24 text-center text-sm text-ink-muted">
              No intent events yet. Chat with the AI assistant to populate the matrix.
            </p>
          )}
        </section>

        {/* Explanation below graph */}
        <section className="rounded-2xl border border-surface-border bg-surface-raised p-4 sm:p-6">
          <IntentMatrixExplainer
            totalMessages={overview.totalEventCount}
            displayedPoints={overview.displayedPointCount}
            uniqueIntentTypes={overview.uniqueIntentTypes}
          />
        </section>

        {/* Security + charts row */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-surface-border bg-surface-raised p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="size-4 text-accent-rose" />
              Security panel
            </h2>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="text-ink-muted">Prompt injection attempts</dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {security.promptInjectionAttempts.length}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Blocked tool calls</dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {security.blockedToolCalls.length}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Failed confirmations</dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {security.failedConfirmations.length}
                </dd>
              </div>
            </dl>
            <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-[11px]">
              {security.promptInjectionAttempts.slice(0, 5).map((row) => (
                <li
                  key={row.id}
                  className="rounded-lg border border-accent-rose/20 bg-accent-rose/5 p-2"
                >
                  <p className="text-ink">{row.message}</p>
                  <p className="text-ink-dim">{new Date(row.timestamp).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-surface-border bg-surface-raised p-4 lg:col-span-2">
            <h2 className="mb-1 text-sm font-semibold">Intent distribution</h2>
            <p className="mb-4 text-xs text-ink-muted">
              Actual usage vs baseline taxonomy weights
            </p>
            <IntentDistributionChart data={overview.distribution} />
          </div>
        </section>

        <section className="rounded-2xl border border-surface-border bg-surface-raised p-4">
          <h2 className="mb-1 text-sm font-semibold">Risk heatmap</h2>
          <p className="mb-4 text-xs text-ink-muted">Intent × risk level counts</p>
          <IntentRiskHeatmap data={overview.heatmap} />
        </section>

        <section className="rounded-2xl border border-surface-border bg-surface-raised p-4">
          <h2 className="mb-4 text-sm font-semibold">User behavior</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted">
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="px-2 py-2 font-medium">Top intent</th>
                  <th className="px-2 py-2 font-medium">Avg risk</th>
                  <th className="px-2 py-2 font-medium">Confirmed</th>
                  <th className="px-2 py-2 font-medium">Blocked</th>
                  <th className="px-2 py-2 font-medium">Messages</th>
                  <th className="px-2 py-2 font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr key={row.userId} className="border-b border-surface-border/60">
                    <td className="py-2 pr-4">
                      <p className="font-medium text-ink">{row.userName}</p>
                      <p className="font-mono text-[10px] text-ink-dim">{row.userId}</p>
                    </td>
                    <td className="px-2 py-2 font-mono">{row.mostCommonIntent}</td>
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] capitalize",
                          RISK_PILL[
                            row.avgRisk >= 3.5
                              ? "critical"
                              : row.avgRisk >= 2.5
                                ? "high"
                                : row.avgRisk >= 1.5
                                  ? "medium"
                                  : "low"
                          ],
                        )}
                      >
                        {row.avgRisk.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-2 py-2 tabular-nums">{row.confirmedActions}</td>
                    <td className="px-2 py-2 tabular-nums">{row.blockedActions}</td>
                    <td className="px-2 py-2 tabular-nums">{row.messageCount}</td>
                    <td className="px-2 py-2 text-ink-muted">
                      {new Date(row.lastActivity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
