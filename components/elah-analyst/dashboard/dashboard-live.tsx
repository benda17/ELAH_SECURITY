"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Inbox, Pause, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import type { DashboardSnapshot } from "@/lib/elah/analyst/snapshot";
import { fetchDashboardExtrasAction } from "./actions";
import { Breakdowns } from "./breakdowns";
import { ConfidenceCard, ScoreDistributionCard } from "./distribution-cards";
import { KpiCards } from "./kpi-cards";
import { LatestEventsTable } from "./latest-events";
import { RiskIndicatorsPanel } from "./risk-indicators";
import { ThresholdForm, type ThresholdMeta } from "./threshold-form";
import { TimeSeriesCard } from "./time-series-chart";
import {
  DASHBOARD_POLL_MS,
  formatUtcTime,
  riskIndicators,
  type DashboardExtras,
} from "./helpers";

type Health = "ok" | "refreshing" | "error";

function snapshotError(status: number): string {
  if (status === 401) return "Your session has expired. Sign in again to resume live updates.";
  if (status === 403) return "You no longer have permission to view this dashboard.";
  return `The snapshot request failed (HTTP ${status}).`;
}

/**
 * Near-real-time dashboard body. Polls the snapshot API (and the extras
 * action for distributions) every 15s while visible and not paused.
 */
export function DashboardLive({
  initialSnapshot,
  initialExtras,
  thresholdMeta,
  canConfigure,
  emptyAction,
  pollMs = DASHBOARD_POLL_MS,
}: {
  initialSnapshot: DashboardSnapshot;
  initialExtras: DashboardExtras;
  thresholdMeta: ThresholdMeta;
  canConfigure: boolean;
  emptyAction?: React.ReactNode;
  pollMs?: number;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [extras, setExtras] = useState(initialExtras);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [health, setHealth] = useState<Health>("ok");
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const staleRef = useRef(false);
  const seenIdsRef = useRef(new Set(initialSnapshot.latest.map((r) => String(r.eventId))));
  const query = snapshot.query;

  // Adopt fresher server props (e.g. after a thresholds save revalidates the page).
  useEffect(() => {
    setSnapshot((current) =>
      initialSnapshot.generatedAt > current.generatedAt ? initialSnapshot : current,
    );
    setExtras((current) => (initialExtras.generatedAt > current.generatedAt ? initialExtras : current));
  }, [initialSnapshot, initialExtras]);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      setHealth("refreshing");
      try {
        const [res, extrasResult] = await Promise.all([
          fetch(`/api/admin/elah/analyst/snapshot${query ? `?${query}` : ""}`, {
            cache: "no-store",
            headers: { accept: "application/json" },
            signal,
          }),
          fetchDashboardExtrasAction(query),
        ]);
        if (signal?.aborted) return;
        if (!res.ok) throw new Error(snapshotError(res.status));
        const body = (await res.json()) as { ok?: boolean; snapshot?: DashboardSnapshot };
        if (!body?.ok || !body.snapshot) throw new Error("The snapshot response was malformed.");
        const next = body.snapshot;

        const fresh = next.latest.filter((r) => !seenIdsRef.current.has(String(r.eventId))).length;
        for (const r of next.latest) seenIdsRef.current.add(String(r.eventId));
        setSnapshot(next);
        if (extrasResult.ok) setExtras(extrasResult.extras);

        if (!extrasResult.ok) {
          setError(`${extrasResult.error} Counts and charts above are current; distributions may be stale.`);
          setHealth("error");
        } else {
          setError(null);
          setHealth("ok");
        }
        if (fresh > 0) {
          setAnnouncement(`${fresh} new event${fresh === 1 ? "" : "s"} since the last update.`);
        }
      } catch (e) {
        if (signal?.aborted || (e instanceof DOMException && e.name === "AbortError")) return;
        setError(e instanceof Error && e.message ? e.message : "Live update failed.");
        setHealth("error");
        setAnnouncement("Live update failed. Showing the last successful data.");
      }
    },
    [query],
  );

  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (paused || hidden) {
      staleRef.current = true;
      return;
    }
    const controller = new AbortController();
    let timer: number | undefined;
    let cancelled = false;
    const tick = async () => {
      await refresh(controller.signal);
      if (!cancelled) timer = window.setTimeout(tick, pollMs);
    };
    timer = window.setTimeout(tick, staleRef.current ? 0 : pollMs);
    staleRef.current = false;
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [paused, hidden, refresh, pollMs]);

  const togglePaused = () => {
    setPaused(!paused);
    setAnnouncement(paused ? "Live updates resumed." : "Live updates paused.");
  };

  const { stats, thresholds, filters } = snapshot;
  const liveLabel = paused ? "Paused" : hidden ? "Paused while tab is hidden" : "Live";

  return (
    <div className="space-y-6">
      <div className="elah-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-2 font-medium text-ink">
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                paused || hidden
                  ? "bg-ink-subtle"
                  : health === "error"
                    ? "bg-accent-amber"
                    : "animate-pulse bg-accent-emerald",
              )}
            />
            {liveLabel}
          </span>
          <span className="text-xs text-ink-muted">
            Updated <time dateTime={snapshot.generatedAt}>{formatUtcTime(snapshot.generatedAt)}</time>
            {!paused && !hidden ? ` · refreshes every ${Math.round(pollMs / 1000)}s` : ""}
          </span>
          {health === "refreshing" ? <span className="text-xs text-ink-subtle">Refreshing…</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={togglePaused}
            aria-pressed={paused}
          >
            {paused ? <Play className="size-3.5" aria-hidden /> : <Pause className="size-3.5" aria-hidden />}
            {paused ? "Resume live updates" : "Pause live updates"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void refresh()}
            disabled={health === "refreshing"}
          >
            <RefreshCw className={cn("size-3.5", health === "refreshing" && "animate-spin")} aria-hidden />
            Refresh now
          </Button>
        </div>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-accent-amber/40 bg-accent-amber/10 p-3 text-sm text-ink">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-accent-amber" aria-hidden />
          <div className="flex-1">
            <p className="font-medium">Live update problem</p>
            <p className="text-xs text-ink-muted">
              {error} Showing data from {formatUtcTime(snapshot.generatedAt)}.
              {!paused && !hidden ? " Retrying automatically." : ""}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()}>
            Retry
          </Button>
        </div>
      ) : null}

      {snapshot.truncated ? (
        <p className="rounded-lg border border-line bg-bg-subtle/40 p-3 text-xs text-ink-muted">
          This window holds more events than one scan covers. Figures describe the newest {stats.total} matching events;
          choose a shorter range to see everything.
        </p>
      ) : null}

      {stats.total === 0 ? (
        <Empty
          icon={<Inbox className="size-5" aria-hidden />}
          title="No ELAH events in this window"
          description="Nothing matched these filters yet. This page updates automatically when new events arrive, or pick a longer range."
          action={emptyAction}
        />
      ) : (
        <>
          <KpiCards stats={stats} extras={extras} thresholds={thresholds} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <ScoreDistributionCard stats={stats} extras={extras} thresholds={thresholds} />
            </div>
            <div className="xl:col-span-2">
              <RiskIndicatorsPanel indicators={riskIndicators(stats, extras, filters)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <TimeSeriesCard series={stats.series} thresholds={thresholds} />
            </div>
            <div className="xl:col-span-2">
              <ConfidenceCard stats={stats} extras={extras} thresholds={thresholds} />
            </div>
          </div>

          <Breakdowns stats={stats} filters={filters} />

          <LatestEventsTable latest={snapshot.latest} filters={filters} />
        </>
      )}

      <ThresholdForm
        thresholds={thresholds}
        meta={thresholdMeta}
        scores={extras.points.map((p) => p.score)}
        canConfigure={canConfigure}
      />

      {stats.total > 0 ? (
        <p className="text-center text-xs text-ink-subtle">
          <Link href="/admin/elah-events" className="hover:text-ink hover:underline">
            Open the full ELAH events list
          </Link>
        </p>
      ) : null}
    </div>
  );
}
