import Image from "next/image";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ListChecks,
  ReceiptText,
  ShieldAlert,
  Users,
  Wallet,
} from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { StatCard } from "@/components/stat-card";
import { ActionsOverTimeChart } from "@/components/charts/actions-over-time";
import { ActionTypesChart } from "@/components/charts/action-types";
import { RiskDistributionChart } from "@/components/charts/risk-distribution";
import { CustomerActivityChart } from "@/components/charts/customer-activity";
import { TransactionsByCategoryChart } from "@/components/charts/transactions-by-category";
import { TransactionVolumeChart } from "@/components/charts/transaction-volume";
import { HourOfDayChart } from "@/components/charts/hour-of-day";
import { TierDistributionChart } from "@/components/charts/tier-distribution";
import { TopCustomersChart } from "@/components/charts/top-customers";
import { BalancesByAccountTypeChart } from "@/components/charts/balances-by-account-type";
import { WeekdayActivityChart } from "@/components/charts/weekday-activity";
import { TierComparison } from "@/components/charts/tier-comparison";
import {
  getActionsByDay,
  getActionsByHour,
  getActionsPerCustomer,
  getBalancesByAccountType,
  getRecentActivity,
  getRecentRiskEvents,
  getRiskDistribution,
  getStatsOverview,
  getTierComparison,
  getTierDistribution,
  getTopActionTypes,
  getTopCustomersBySpend,
  getTransactionsByCategory,
  getTransactionVolumeByDay,
  getWeekdayActivity,
} from "@/lib/queries";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RISK_PILL: Record<string, string> = {
  low: "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan",
  medium: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
  high: "border-accent-rose/40 bg-accent-rose/10 text-accent-rose",
  critical: "border-accent-violet/40 bg-accent-violet/10 text-accent-violet",
};

const SEVERITY_PILL: Record<string, string> = {
  low: RISK_PILL.low,
  medium: RISK_PILL.medium,
  high: RISK_PILL.high,
  critical: RISK_PILL.critical,
};

export default async function Page() {
  const [
    stats,
    actionsByDay,
    topActionTypes,
    riskDist,
    perCustomer,
    txCategories,
    txVolume,
    recentActivity,
    recentRiskEvents,
    actionsByHour,
    tierDist,
    topCustomers,
    balancesByType,
    weekdayActivity,
    tierComparison,
  ] = await Promise.all([
    getStatsOverview(),
    getActionsByDay(14),
    getTopActionTypes(15),
    getRiskDistribution(),
    getActionsPerCustomer(),
    getTransactionsByCategory(),
    getTransactionVolumeByDay(14),
    getRecentActivity(12),
    getRecentRiskEvents(5),
    getActionsByHour(),
    getTierDistribution(),
    getTopCustomersBySpend(20),
    getBalancesByAccountType(),
    getWeekdayActivity(),
    getTierComparison(),
  ]);

  const netFlow = stats.creditTotal - stats.debitTotal;

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-8">
      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-end gap-4">
          <div className="rounded-2xl border border-surface-border bg-surface-raised p-2">
            <Image
              src="/elah-logo.png"
              alt="ELAH Security"
              width={56}
              height={56}
              priority
              className="size-12 object-contain"
            />
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-cyan">
              <span className="inline-block size-1.5 rounded-full bg-accent-cyan shadow-[0_0_8px_currentColor]" />
              ELAH Analytics
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              Banking activity dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Read-only view of the ELAH banking simulation database — actions,
              transactions, risk and customer behavior at a glance.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-ink-muted">
          <AutoRefresh defaultSeconds={10} />
          <div>
            Generated:{" "}
            <span className="text-ink">
              {new Date().toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
          <div>
            DB: <code className="text-accent-cyan">prisma/dev.db</code>
          </div>
        </div>
      </header>

      {/* Stat grid */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Audit actions"
          value={stats.auditTotal.toLocaleString()}
          hint={`${stats.flaggedAudit} flagged ≥ medium`}
          icon={<Activity className="size-4" />}
          tone="info"
        />
        <StatCard
          label="Transactions"
          value={stats.transactionTotal.toLocaleString()}
          hint={`${formatCurrency(stats.creditTotal + stats.debitTotal)} total volume`}
          icon={<ReceiptText className="size-4" />}
        />
        <StatCard
          label="Active customers"
          value={stats.customerTotal.toLocaleString()}
          hint={`${stats.userTotal} total users incl. staff`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Risk events"
          value={stats.riskEventTotal.toLocaleString()}
          hint="Reviewer queue items"
          icon={<ShieldAlert className="size-4" />}
          tone={stats.riskEventTotal > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Loans + tickets"
          value={(stats.loanTotal + stats.supportTotal).toLocaleString()}
          hint={`${stats.loanTotal} loans · ${stats.supportTotal} tickets`}
          icon={<ListChecks className="size-4" />}
        />
        <StatCard
          label="Net cash flow"
          value={
            <span className="flex items-center gap-1">
              {netFlow >= 0 ? (
                <ArrowUpRight className="size-5" />
              ) : (
                <ArrowDownRight className="size-5" />
              )}
              {formatCurrency(Math.abs(netFlow))}
            </span>
          }
          hint={
            <>
              In {formatCurrency(stats.creditTotal)} · Out{" "}
              {formatCurrency(stats.debitTotal)}
            </>
          }
          icon={<Wallet className="size-4" />}
          tone={netFlow >= 0 ? "success" : "danger"}
        />
      </section>

      {/* Population overview: tier + balances + weekday */}
      <SectionLabel>Customer population</SectionLabel>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel">
          <div className="mb-3 panel-title">Tier distribution</div>
          <TierDistributionChart data={tierDist} />
        </div>
        <div className="panel">
          <div className="mb-3 flex items-end justify-between">
            <div className="panel-title">Total balances by account type</div>
            <Legend
              items={[
                { color: "#22d3ee", label: "Checking" },
                { color: "#34d399", label: "Savings" },
                { color: "#f6c453", label: "Investment" },
              ]}
            />
          </div>
          <BalancesByAccountTypeChart data={balancesByType} />
        </div>
        <div className="panel">
          <div className="mb-3 flex items-end justify-between">
            <div className="panel-title">Activity by weekday</div>
            <Legend
              items={[
                { color: "#22d3ee", label: "Weekday" },
                { color: "#a78bfa", label: "Weekend" },
              ]}
            />
          </div>
          <WeekdayActivityChart data={weekdayActivity} />
        </div>
      </section>

      {/* Activity time series + risk donut */}
      <SectionLabel>Activity & risk</SectionLabel>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="panel-title">Actions per day · last 14 days</div>
              <div className="text-xs text-ink-muted">Stacked by risk level</div>
            </div>
            <Legend
              items={[
                { color: "#22d3ee", label: "Low" },
                { color: "#fbbf24", label: "Medium" },
                { color: "#fb7185", label: "High" },
                { color: "#a78bfa", label: "Critical" },
              ]}
            />
          </div>
          <ActionsOverTimeChart data={actionsByDay} />
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Risk distribution</div>
          <RiskDistributionChart data={riskDist} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel">
          <div className="mb-3 panel-title">Top action types</div>
          <ActionTypesChart data={topActionTypes} />
        </div>
        <div className="panel">
          <div className="mb-3 flex items-end justify-between">
            <div className="panel-title">
              Actions per customer
              <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-ink-dim">
                ({perCustomer.length} customers · scroll)
              </span>
            </div>
            <Legend
              items={[
                { color: "#22d3ee", label: "Basic" },
                { color: "#a78bfa", label: "Premium" },
                { color: "#f6c453", label: "VIP" },
              ]}
            />
          </div>
          <CustomerActivityChart data={perCustomer} containerHeight={420} />
        </div>
      </section>

      {/* Money flow */}
      <SectionLabel>Money flow</SectionLabel>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="panel-title">Cash flow · last 14 days</div>
              <div className="text-xs text-ink-muted">Daily debits vs credits</div>
            </div>
            <Legend
              items={[
                { color: "#34d399", label: "Credits (in)" },
                { color: "#fb7185", label: "Debits (out)" },
              ]}
            />
          </div>
          <TransactionVolumeChart data={txVolume} />
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Transactions by category</div>
          <TransactionsByCategoryChart data={txCategories} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4">
        <div className="panel">
          <div className="mb-3 flex items-end justify-between">
            <div className="panel-title">
              Top customers by spend
              <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-ink-dim">
                (top {topCustomers.length} · scroll)
              </span>
            </div>
            <Legend
              items={[
                { color: "#22d3ee", label: "Basic" },
                { color: "#a78bfa", label: "Premium" },
                { color: "#f6c453", label: "VIP" },
              ]}
            />
          </div>
          <TopCustomersChart data={topCustomers} containerHeight={360} />
        </div>
      </section>

      {/* Behavior + tier comparison */}
      <SectionLabel>Behavior</SectionLabel>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel">
          <div className="mb-3 panel-title">Activity by hour-of-day</div>
          <HourOfDayChart data={actionsByHour} />
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Tier comparison</div>
          <TierComparison data={tierComparison} />
        </div>
      </section>

      {/* Recent feeds */}
      <SectionLabel>Most recent</SectionLabel>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="panel lg:col-span-3">
          <div className="mb-3 panel-title">Recent audit activity</div>
          <ul className="divide-y divide-surface-border/60">
            {recentActivity.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 py-2.5 text-sm"
              >
                <span
                  className={cn("pill", RISK_PILL[a.riskLevel] ?? RISK_PILL.low)}
                >
                  {a.riskLevel}
                </span>
                <span className="min-w-[150px] truncate text-ink">
                  {a.actorName ?? a.actorType}
                </span>
                <span className="flex-1 truncate text-ink-muted">
                  {a.actionType}
                  {a.page ? <span className="text-ink-dim"> · {a.page}</span> : null}
                  {a.amount ? (
                    <span className="text-ink-dim"> · ${formatCompact(a.amount)}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-ink-dim">
                  {new Date(a.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel lg:col-span-2">
          <div className="mb-3 panel-title">Recent risk events</div>
          {recentRiskEvents.length === 0 ? (
            <p className="text-sm text-ink-muted">No risk events recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentRiskEvents.map((e) => (
                <li
                  key={e.id}
                  className="rounded-xl border border-surface-border bg-surface-subtle/60 p-3"
                >
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        "pill",
                        SEVERITY_PILL[e.severity] ?? SEVERITY_PILL.medium,
                      )}
                    >
                      {e.severity}
                    </span>
                    <span className="font-mono text-[11px] text-ink-muted">
                      {e.eventType}
                    </span>
                    <span className="ml-auto text-[11px] text-ink-dim">
                      {new Date(e.timestamp).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-ink">
                    {e.reasonForFlagging}
                  </p>
                  <div className="mt-1 text-[11px] uppercase tracking-wider text-ink-dim">
                    Review: {e.reviewStatus}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <footer className="mt-10 border-t border-surface-border pt-4 text-xs text-ink-dim">
        ELAH Analytics · read-only · {stats.auditTotal.toLocaleString()} audit
        rows · {stats.transactionTotal.toLocaleString()} transactions across{" "}
        {stats.customerTotal} customers
      </footer>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
        {children}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-surface-border to-transparent" />
    </div>
  );
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            className="inline-block size-2 rounded-sm"
            style={{ background: i.color }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
