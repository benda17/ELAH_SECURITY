import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  ListChecks,
  Map,
  MessageSquare,
  ReceiptText,
  ShieldAlert,
  Users,
  Wallet,
  Wrench,
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
import { AssistantEventsOverTimeChart } from "@/components/charts/assistant-events-over-time";
import { AssistantEventTypesChart } from "@/components/charts/assistant-event-types";
import { AssistantToolsChart } from "@/components/charts/assistant-tools";
import { AssistantPolicyChart } from "@/components/charts/assistant-policy";
import { AssistantUsersChart } from "@/components/charts/assistant-users";
import {
  AssistantSecurityTimelineChart,
  AssistantSecurityReasonsChart,
  AssistantSecurityRiskScoreChart,
} from "@/components/charts/assistant-security-risks";
import { AssistantModelBanner, AssistantModelExplainer } from "@/components/assistant-model-explainer";
import {
  assistantEventTone,
  formatAgentEventLabel,
} from "@/lib/agent-display";
import {
  getActionsByDay,
  getActionsByHour,
  getActionsPerCustomer,
  getBalancesByAccountType,
  getRiskDistribution,
  getStatsOverview,
  getTierComparison,
  getTierDistribution,
  getTopActionTypes,
  getTopCustomersBySpend,
  getTransactionsByCategory,
  getTransactionVolumeByDay,
  getWeekdayActivity,
  getAssistantStatsOverview,
  getAssistantEventsByDay,
  getAssistantEventsByType,
  getAssistantTopTools,
  getAssistantPolicyDecisions,
  getAssistantEventsPerUser,
  getRecentAssistantEvents,
  getAssistantSecurityRisksOverTime,
  getAssistantSecurityRiskReasons,
  getAssistantSecurityRiskScores,
} from "@/lib/queries";
import { cn, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ASSISTANT_PILL: Record<string, string> = {
  default: "border-surface-border bg-surface-subtle/60 text-ink-muted",
  success: "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald",
  warning: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
  danger: "border-accent-rose/40 bg-accent-rose/10 text-accent-rose",
  info: "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan",
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
    actionsByHour,
    tierDist,
    topCustomers,
    balancesByType,
    weekdayActivity,
    tierComparison,
    assistantStats,
    assistantByDay,
    assistantEventTypes,
    assistantTools,
    assistantPolicy,
    assistantPerUser,
    recentAssistantEvents,
    assistantSecurityTimeline,
    assistantSecurityReasons,
    assistantSecurityScores,
  ] = await Promise.all([
    getStatsOverview(),
    getActionsByDay(14),
    getTopActionTypes(15),
    getRiskDistribution(),
    getActionsPerCustomer(),
    getTransactionsByCategory(),
    getTransactionVolumeByDay(14),
    getActionsByHour(),
    getTierDistribution(),
    getTopCustomersBySpend(20),
    getBalancesByAccountType(),
    getWeekdayActivity(),
    getTierComparison(),
    getAssistantStatsOverview(),
    getAssistantEventsByDay(14),
    getAssistantEventsByType(12),
    getAssistantTopTools(10),
    getAssistantPolicyDecisions(),
    getAssistantEventsPerUser(15),
    getRecentAssistantEvents(12),
    getAssistantSecurityRisksOverTime(14),
    getAssistantSecurityRiskReasons(10),
    getAssistantSecurityRiskScores(),
  ]);

  const netFlow = stats.creditTotal - stats.debitTotal;

  return (
    <main className="mx-auto max-w-[1400px]">
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
          <Link
            href="/banking/training-dataset"
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent-emerald/30 bg-accent-emerald/10 px-3 py-1.5 text-xs font-medium text-accent-emerald hover:bg-accent-emerald/15"
          >
            Training Dataset
          </Link>
          <Link
            href="/founder/roadmap/timeline"
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent-violet/30 bg-accent-violet/10 px-3 py-1.5 text-xs font-medium text-accent-violet hover:bg-accent-violet/15"
          >
            <ListChecks className="size-3.5" />
            Founder Roadmap
          </Link>
          <Link
            href="/founder/model-roadmap"
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent-gold/30 bg-accent-gold/10 px-3 py-1.5 text-xs font-medium text-accent-gold hover:bg-accent-gold/15"
          >
            <Map className="size-3.5" />
            ELAH Model Roadmap
          </Link>
          <Link
            href="/banking/intent-matrix"
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1.5 text-xs font-medium text-accent-cyan hover:bg-accent-cyan/15"
          >
            <BrainCircuit className="size-3.5" />
            Human Intent Matrix
          </Link>
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

      <AssistantModelBanner className="mb-6" />

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

      {/* AI Assistant */}
      <SectionLabel>AI Assistant</SectionLabel>
      <AssistantModelExplainer />
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Assistant events"
          value={assistantStats.eventTotal.toLocaleString()}
          hint={`${assistantStats.uniqueUsers} active users`}
          icon={<Bot className="size-4" />}
          tone="info"
        />
        <StatCard
          label="Conversations"
          value={assistantStats.conversationTotal.toLocaleString()}
          hint={`${assistantStats.messageTotal} messages`}
          icon={<MessageSquare className="size-4" />}
        />
        <StatCard
          label="Tool executions"
          value={assistantStats.toolExecutions.toLocaleString()}
          hint={`${assistantStats.toolFailures} failed`}
          icon={<Wrench className="size-4" />}
          tone="success"
        />
        <StatCard
          label="Security signals"
          value={assistantStats.securityEvents.toLocaleString()}
          hint="Blocked / suspicious / errors"
          icon={<ShieldAlert className="size-4" />}
          tone={assistantStats.securityEvents > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Pending confirmations"
          value={assistantStats.pendingActions.toLocaleString()}
          hint="Awaiting customer approval"
          icon={<ListChecks className="size-4" />}
          tone={assistantStats.pendingActions > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Flagged chats"
          value={assistantStats.flaggedConversations.toLocaleString()}
          hint="Injection or policy flags"
          icon={<ShieldAlert className="size-4" />}
          tone={assistantStats.flaggedConversations > 0 ? "warning" : "default"}
        />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="panel-title">Assistant events · last 14 days</div>
              <div className="text-xs text-ink-muted">
                Tool activity, security signals, and other assistant events
              </div>
            </div>
            <Legend
              items={[
                { color: "#f6c453", label: "Tools" },
                { color: "#fb7185", label: "Security" },
                { color: "#22d3ee", label: "Other" },
              ]}
            />
          </div>
          {assistantStats.eventTotal === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              No assistant activity yet. Use the banking app at /assistant.
            </p>
          ) : (
            <AssistantEventsOverTimeChart data={assistantByDay} />
          )}
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Policy decisions</div>
          <AssistantPolicyChart data={assistantPolicy} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel">
          <div className="mb-3 panel-title">Top event types</div>
          {assistantEventTypes.length === 0 ? (
            <p className="text-sm text-ink-muted">No events recorded.</p>
          ) : (
            <AssistantEventTypesChart data={assistantEventTypes} />
          )}
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Most-used tools</div>
          {assistantTools.length === 0 ? (
            <p className="text-sm text-ink-muted">No tool calls yet.</p>
          ) : (
            <AssistantToolsChart data={assistantTools} />
          )}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel">
          <div className="mb-3 panel-title">
            Events per customer
            <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-ink-dim">
              (top {assistantPerUser.length} · scroll)
            </span>
          </div>
          {assistantPerUser.length === 0 ? (
            <p className="text-sm text-ink-muted">No customer assistant usage yet.</p>
          ) : (
            <AssistantUsersChart data={assistantPerUser} containerHeight={320} />
          )}
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Recent assistant events</div>
          {recentAssistantEvents.length === 0 ? (
            <p className="text-sm text-ink-muted">No assistant events recorded yet.</p>
          ) : (
            <ul className="divide-y divide-surface-border/60">
              {recentAssistantEvents.map((e) => {
                const tone = assistantEventTone(e.eventType);
                return (
                  <li key={e.id} className="flex items-start gap-3 py-2.5 text-sm">
                    <span className={cn("pill shrink-0", ASSISTANT_PILL[tone])}>
                      {e.eventType.replace(/_/g, " ")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-ink">
                        {formatAgentEventLabel(e.eventType, e.toolName)}
                      </div>
                      <div className="text-xs text-ink-subtle">{e.userName}</div>
                      {(e.userMessage || e.resultSummary) && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                          {e.resultSummary ?? e.userMessage}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-ink-dim">
                      {new Date(e.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <SectionLabel>Assistant security risks</SectionLabel>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="panel-title">Security signals · last 14 days</div>
              <div className="text-xs text-ink-muted">
                Suspicious prompts, policy blocks, unauthorized access, and errors logged by the assistant
              </div>
            </div>
            <Legend
              items={[
                { color: "#fb7185", label: "Suspicious prompt" },
                { color: "#fbbf24", label: "Policy blocked" },
                { color: "#a78bfa", label: "Unauthorized" },
                { color: "#64748b", label: "Error" },
              ]}
            />
          </div>
          <AssistantSecurityTimelineChart data={assistantSecurityTimeline} />
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Risk score bands</div>
          <AssistantSecurityRiskScoreChart data={assistantSecurityScores} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4">
        <div className="panel">
          <div className="mb-3 panel-title">Detection labels &amp; policy reasons</div>
          <AssistantSecurityReasonsChart data={assistantSecurityReasons} />
        </div>
      </section>

      <footer className="mt-10 border-t border-surface-border pt-4 text-xs text-ink-dim">
        ELAH Analytics · read-only · {stats.auditTotal.toLocaleString()} audit
        rows · {stats.transactionTotal.toLocaleString()} transactions ·{" "}
        {assistantStats.eventTotal.toLocaleString()} assistant events across{" "}
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
