import { BarChart3, CheckCircle2, Clock, Flag, ShieldAlert, Target } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/roadmap-dashboard/badges";
import { PhaseCompletionChart } from "@/components/roadmap-dashboard/phase-completion-chart";
import { ProgressBar } from "@/components/roadmap-dashboard/progress-bar";
import { TaskOpenButton } from "@/components/roadmap-dashboard/task-open-button";
import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = {
  title: "ELAH Founder Roadmap · Overview",
};

export default async function ElahRoadmapOverviewPage() {
  const { metrics, tasks, milestones, risks } = await loadRoadmapPageData();
  const blocked = tasks.filter((t) => t.status === "blocked");
  const criticalOpen = tasks.filter(
    (t) => t.isCriticalPath && t.status !== "done",
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Executive overview</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          APACT, a CAPTCHA for agents
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
          ELAH V2 sits at a website&apos;s entrance. A person ticks &ldquo;I&apos;m
          not a robot&rdquo; and is not checked. An AI agent declares what it was
          asked to do and which functions it needs, then does three short mock
          tasks. If it stays inside that declaration, ELAH gives it a short-lived
          token bound to a key that never leaves the page.
        </p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
          The thin slice is done locally: a Python server, the entrance widget,
          the Skyhop test site, and 33 tests. The first profile is guest travel.
          Search flights and save a guest draft. Do not pay, sign a contract, or
          export data. A hosted service, durable storage, and step-up approval
          are not done. There is no operator credential flow and no customer
          traction.
        </p>
      </header>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="panel">
          <p className="panel-title">Specified</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            APACT 0.1: prepare, declare, freeze, exercise, complete, decide.
            Guest access is site policy. Delegated access needs accepted
            approval. A passing exercise does not create missing authority.
          </p>
        </div>
        <div className="panel">
          <p className="panel-title">Proved locally</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            An honest guest agent can be admitted. Search and draft calls verify.
            Payment under pressure is rejected. The token lasts 300 seconds and
            is bound to the page key. Storage is in memory.
          </p>
        </div>
        <div className="panel">
          <p className="panel-title">Not built</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Hosted service, durable challenge and revocation storage, step-up
            approval, and operator or authority adapters. Asking for payment
            returns step_up_required and stops.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Plan completion"
          value={`${metrics.overallCompletion}%`}
          hint={`${metrics.tasksCompleted} / ${metrics.tasksTotal} tasks done`}
          icon={<Target className="size-4" />}
          tone="info"
        />
        <StatCard
          label="In progress"
          value={metrics.tasksInProgress}
          hint={`${metrics.tasksBlocked} blocked · ${metrics.tasksOverdue} overdue`}
          icon={<Clock className="size-4" />}
        />
        <StatCard
          label="Critical path"
          value={`${metrics.criticalPathCompletion}%`}
          hint={`${criticalOpen.length} open CP tasks`}
          icon={<Flag className="size-4" />}
          tone="warning"
        />
        <StatCard
          label="Next milestone"
          value={
            metrics.daysToNextMilestone != null
              ? `${metrics.daysToNextMilestone}d`
              : "—"
          }
          hint={metrics.nextMilestone?.title ?? "None scheduled"}
          icon={<CheckCircle2 className="size-4" />}
          tone="success"
        />
      </div>

      <div className="panel">
        <p className="panel-title">APACT execution plan</p>
        <p className="text-lg font-medium">{metrics.currentPhase}</p>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-ink-muted">
          Current phase from the live board. The board is the APACT execution
          plan, from product definition through the fundraising narrative for
          the pivot. Counts on this page follow that data.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <p className="panel-title mb-3">Readiness</p>
          <div className="space-y-3">
            {Object.entries(metrics.readiness)
              .filter(([key]) => key !== "data" && key !== "model")
              .map(([key, val]) => (
              <ProgressBar
                key={key}
                label={
                  {
                    technical: "Technical",
                    product: "Product",
                    pilot: "Pilot and privacy",
                    customerValidation: "Design partners",
                    fundraising: "Fundraising",
                  }[key] ?? key
                }
                value={val}
              />
            ))}
          </div>
        </div>
        <div className="panel">
          <p className="panel-title mb-3">Completion by phase</p>
          <PhaseCompletionChart data={metrics.completionByPhase} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="size-4 text-accent-cyan" />
            <p className="panel-title">Top 5 priorities</p>
          </div>
          <ul className="space-y-2">
            {metrics.topPriorities.map((t) => (
              <li
                key={t.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-surface-border/60 px-3 py-2"
              >
                <TaskOpenButton
                  task={t}
                  allTasks={tasks}
                  className="text-sm"
                />
                <PriorityBadge priority={t.priority} />
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="size-4 text-accent-rose" />
            <p className="panel-title">Major risks</p>
          </div>
          <ul className="space-y-2">
            {risks.slice(0, 5).map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-accent-rose/20 bg-accent-rose/5 px-3 py-2 text-sm"
              >
                {r.description}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {blocked.length > 0 && (
        <div className="panel border-accent-rose/30">
          <p className="panel-title text-accent-rose">Blocked tasks</p>
          <ul className="mt-2 space-y-1 text-sm">
            {blocked.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2">
                <StatusBadge status={t.status} />
                <TaskOpenButton task={t} allTasks={tasks} className="text-sm" />
                {t.blockingReason && (
                  <span className="text-ink-dim"> — {t.blockingReason}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="panel">
        <p className="panel-title mb-2">Milestone snapshot</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {milestones.slice(0, 6).map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-surface-border px-3 py-2"
            >
              <p className="text-sm font-medium">{m.title}</p>
              <ProgressBar value={m.completionPercentage} className="mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
