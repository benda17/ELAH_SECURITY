import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Bot,
  ListChecks,
  ShieldAlert,
  Ticket,
  Users,
} from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { StatCard } from "@/components/stat-card";
import { AssistantEventsOverTimeChart } from "@/components/charts/assistant-events-over-time";
import { AssistantEventTypesChart } from "@/components/charts/assistant-event-types";
import { AssistantToolsChart } from "@/components/charts/assistant-tools";
import { AssistantPolicyChart } from "@/components/charts/assistant-policy";
import { CustomerActivityChart } from "@/components/charts/customer-activity";
import { HourOfDayChart } from "@/components/charts/hour-of-day";
import { WeekdayActivityChart } from "@/components/charts/weekday-activity";
import { TierDistributionChart } from "@/components/charts/tier-distribution";
import { RiskDistributionChart } from "@/components/charts/risk-distribution";
import {
  AssistantSecurityTimelineChart,
  AssistantSecurityReasonsChart,
  AssistantSecurityRiskScoreChart,
} from "@/components/charts/assistant-security-risks";
import {
  assistantEventTone,
  formatAgentEventLabel,
} from "@/lib/agent-display";
import { isCrmDatabaseConfigured, isCrmPostgresUrl } from "@/lib/crm/config";
import {
  getCrmConversationStatus,
  getCrmEventsByDay,
  getCrmEventsByHour,
  getCrmEventsByType,
  getCrmEventsPerUser,
  getCrmIntents,
  getCrmPlanDistribution,
  getCrmPolicyDecisions,
  getCrmRecentEvents,
  getCrmRecommendations,
  getCrmScoreBands,
  getCrmScoreSnapshotBands,
  getCrmSecurityOverTime,
  getCrmSecurityReasons,
  getCrmStatsOverview,
  getCrmTopTools,
  getCrmWeekdayActivity,
} from "@/lib/crm/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "ELAH · CRM System" };

const PILL: Record<string, string> = {
  default: "border-surface-border bg-surface-subtle/60 text-ink-muted",
  success: "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald",
  warning: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
  danger: "border-accent-rose/40 bg-accent-rose/10 text-accent-rose",
  info: "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan",
};

export default async function BankingCrmPage() {
  const configured = isCrmDatabaseConfigured();
  const [
    stats,
    byDay,
    eventTypes,
    tools,
    policy,
    perUser,
    recent,
    byHour,
    weekday,
    plans,
    scoreBands,
    intents,
    securityTimeline,
    securityReasons,
    scoreSnapshotBands,
    convStatus,
    recommendations,
  ] = await Promise.all([
    getCrmStatsOverview(),
    getCrmEventsByDay(21),
    getCrmEventsByType(15),
    getCrmTopTools(10),
    getCrmPolicyDecisions(),
    getCrmEventsPerUser(30),
    getCrmRecentEvents(12),
    getCrmEventsByHour(),
    getCrmWeekdayActivity(),
    getCrmPlanDistribution(),
    getCrmScoreBands(),
    getCrmIntents(12),
    getCrmSecurityOverTime(21),
    getCrmSecurityReasons(10),
    getCrmScoreSnapshotBands(),
    getCrmConversationStatus(),
    getCrmRecommendations(),
  ]);

  const recAsPolicy = recommendations.map((r) => ({
    decision:
      r.recommendation === "proceed"
        ? "allow"
        : r.recommendation === "review"
          ? "needs_confirmation"
          : "deny",
    count: r.count,
  }));

  return (
    <div className="mx-auto max-w-[1400px]">
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
              Banking System · CRM Simulation
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              CRM activity
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">
              Read-only view of the CRM demo SQLite database — portal commands, assistant
              tools, company policy, and ELAH score snapshots. Scores are not fields of the
              event envelope.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-xs text-ink-muted">
          <Link
            href="/banking/crm/logs"
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1.5 text-xs font-medium text-accent-cyan hover:bg-accent-cyan/15"
          >
            Command logs
          </Link>
          <AutoRefresh defaultSeconds={15} />
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
            DB:{" "}
            <code className="text-accent-cyan">
              {configured
                ? isCrmPostgresUrl()
                  ? "CRM Neon (read-only)"
                  : "CRM SQLite"
                : "unset"}
            </code>
          </div>
        </div>
      </header>

      {!configured ? (
        <p className="mb-6 rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-sm text-accent-amber">
          CRM_DATABASE_URL is not set. Local: point it at CRM Simulation{" "}
          <code>prisma/dev.db</code>. Production: Encrypted{" "}
          <code>CRM_DATABASE_URL</code> to CRM Neon <code>elah_crm</code> — never
          the banking Neon.
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Command logs"
          value={stats.eventTotal.toLocaleString()}
          hint={`${stats.uniqueActors} users with activity`}
          icon={<Activity className="size-4" />}
          tone="info"
        />
        <StatCard
          label="Customers"
          value={stats.customerTotal.toLocaleString()}
          hint={`${stats.userTotal} users incl. staff`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Tickets"
          value={stats.ticketTotal.toLocaleString()}
          hint="Support cases"
          icon={<Ticket className="size-4" />}
        />
        <StatCard
          label="ELAH snapshots"
          value={stats.scoredEvents.toLocaleString()}
          hint={
            stats.avgScore
              ? `avg genuine intent ${stats.avgScore.toFixed(2)}`
              : "separate score table"
          }
          icon={<Bot className="size-4" />}
        />
        <StatCard
          label="Confirmations"
          value={stats.confirmations.toLocaleString()}
          hint={`${stats.pendingActions} pending now`}
          icon={<ListChecks className="size-4" />}
          tone={stats.confirmations > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Security signals"
          value={stats.securityEvents.toLocaleString()}
          hint="Injection / policy deny"
          icon={<ShieldAlert className="size-4" />}
          tone={stats.securityEvents > 0 ? "danger" : "default"}
        />
      </section>

      <SectionLabel>Workspace population</SectionLabel>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel">
          <div className="mb-3 panel-title">Plan distribution</div>
          <TierDistributionChart data={plans} />
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Activity by weekday</div>
          <WeekdayActivityChart data={weekday} />
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Activity by hour-of-day</div>
          <HourOfDayChart data={byHour} />
        </div>
      </section>

      <SectionLabel>Commands</SectionLabel>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="panel-title">Commands per day · last 21 days</div>
              <div className="text-xs text-ink-muted">
                Portal UI, assistant tools, and security signals
              </div>
            </div>
            <Legend
              items={[
                { color: "#f6c453", label: "Assistant" },
                { color: "#fb7185", label: "Security" },
                { color: "#22d3ee", label: "Portal / system" },
              ]}
            />
          </div>
          {stats.eventTotal === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              No CRM command logs yet. Run <code>npm run seed:traffic</code> in
              elah-crm-simulator.
            </p>
          ) : (
            <AssistantEventsOverTimeChart data={byDay} />
          )}
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Company policy</div>
          <AssistantPolicyChart data={policy} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel">
          <div className="mb-3 panel-title">Top command types</div>
          {eventTypes.length === 0 ? (
            <p className="text-sm text-ink-muted">No events recorded.</p>
          ) : (
            <AssistantEventTypesChart data={eventTypes} />
          )}
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Tools & CRM actions</div>
          {tools.length === 0 ? (
            <p className="text-sm text-ink-muted">No tool names on logs yet.</p>
          ) : (
            <AssistantToolsChart data={tools} />
          )}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel">
          <div className="mb-3 panel-title">
            Commands per customer
            <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-ink-dim">
              ({perUser.length} users)
            </span>
          </div>
          {perUser.length === 0 ? (
            <p className="text-sm text-ink-muted">No customer activity yet.</p>
          ) : (
            <CustomerActivityChart data={perUser} containerHeight={420} />
          )}
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Recent commands</div>
          {recent.length === 0 ? (
            <p className="text-sm text-ink-muted">No command logs recorded yet.</p>
          ) : (
            <ul className="divide-y divide-surface-border/60">
              {recent.map((e) => {
                const tone = assistantEventTone(e.eventType);
                return (
                  <li key={e.id} className="flex items-start gap-3 py-2.5 text-sm">
                    <span className={cn("pill shrink-0", PILL[tone])}>
                      {e.eventType.replace(/_/g, " ")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-ink">
                        {formatAgentEventLabel(e.eventType, e.toolName)}
                      </div>
                      <div className="text-xs text-ink-subtle">{String(e.userName)}</div>
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

      <SectionLabel>ELAH scores (separate snapshots)</SectionLabel>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel">
          <div className="mb-3 panel-title">Genuine-intent bands</div>
          <RiskDistributionChart data={scoreBands} />
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Advisory recommendation</div>
          <AssistantPolicyChart data={recAsPolicy} />
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Detected CRM intents</div>
          {intents.length === 0 ? (
            <p className="text-sm text-ink-muted">No intents on logs yet.</p>
          ) : (
            <AssistantEventTypesChart data={intents} />
          )}
        </div>
      </section>

      <SectionLabel>Security signals</SectionLabel>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <div className="panel-title">Injection &amp; policy denials · last 21 days</div>
              <div className="text-xs text-ink-muted">
                Company policy blocked these — ELAH did not allow or deny the tool
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
          <AssistantSecurityTimelineChart data={securityTimeline} />
        </div>
        <div className="panel">
          <div className="mb-3 panel-title">Advisory score mix</div>
          <AssistantSecurityRiskScoreChart data={scoreSnapshotBands} />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4">
        <div className="panel">
          <div className="mb-3 panel-title">Detection labels &amp; policy reasons</div>
          <AssistantSecurityReasonsChart data={securityReasons} />
        </div>
      </section>

      <footer className="mt-10 border-t border-surface-border pt-4 text-xs text-ink-dim">
        CRM System · read-only · {stats.eventTotal.toLocaleString()} command logs ·{" "}
        {stats.scoredEvents.toLocaleString()} ELAH snapshots · {stats.customerTotal}{" "}
        customers
        {convStatus.some((s) => s.count > 0)
          ? ` · chats ${convStatus.map((s) => `${s.status} ${s.count}`).join(" · ")}`
          : ""}
      </footer>
    </div>
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
          <span className="inline-block size-2 rounded-sm" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
