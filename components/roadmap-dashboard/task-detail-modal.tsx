"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, FileText, X } from "lucide-react";
import type { RoadmapTaskRecord } from "@/lib/roadmap/types";
import { PriorityBadge, StatusBadge } from "./badges";
import { ProgressBar } from "./progress-bar";

function formatDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isLikelyUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith("/");
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-1.5">
      <p className="panel-title">{title}</p>
      <div className="text-sm text-ink-muted whitespace-pre-wrap">{children}</div>
    </section>
  );
}

export function TaskDetailModal({
  task,
  onClose,
  relatedTitles,
}: {
  task: RoadmapTaskRecord;
  onClose: () => void;
  /** Optional map of task id → title for dependency labels */
  relatedTitles?: Record<string, string>;
}) {
  const [live, setLive] = useState<RoadmapTaskRecord>(task);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    setLive(task);
    let cancelled = false;
    void fetch(`/api/founder/roadmap/tasks/${encodeURIComponent(task.id)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { task?: RoadmapTaskRecord } | null) => {
        if (!cancelled && json?.task) setLive(json.task);
      })
      .catch(() => {
        /* keep the passed-in task */
      });
    return () => {
      cancelled = true;
    };
  }, [task]);

  const start = formatDate(live.startDate);
  const due = formatDate(live.dueDate);
  const completed = formatDate(live.completedAt);
  const updated = formatDate(live.updatedAt);
  const links = Array.isArray(live.links) ? live.links : [];
  const tags = Array.isArray(live.tags) ? live.tags : [];
  const dependencyIds = Array.isArray(live.dependencyIds) ? live.dependencyIds : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`task-detail-${live.id}`}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-surface-border bg-surface-raised shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-surface-border bg-surface-raised/95 px-5 py-4 backdrop-blur-sm">
          <div className="min-w-0 space-y-2">
            <h2
              id={`task-detail-${live.id}`}
              className="text-lg font-semibold leading-snug text-ink"
            >
              {live.title}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge status={live.status} />
              <PriorityBadge priority={live.priority} />
              {live.isCriticalPath && (
                <span className="pill border-accent-amber/40 text-accent-amber">
                  Critical path
                </span>
              )}
              {live.riskLevel && (
                <span className="pill border-accent-rose/30 text-accent-rose">
                  Risk: {live.riskLevel}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-surface-border p-1.5 text-ink-muted hover:bg-surface-base hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          <section className="space-y-1.5">
            <p className="panel-title">Description</p>
            {live.description?.trim() ? (
              <p className="text-sm leading-relaxed text-ink whitespace-pre-wrap">
                {live.description}
              </p>
            ) : (
              <p className="text-sm text-ink-dim">No description yet.</p>
            )}
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <Meta label="Phase" value={live.phase} />
            <Meta label="Workstream" value={live.workstream} />
            <Meta label="Category" value={live.category} />
            <Meta label="Owner" value={live.owner ?? "Unassigned"} />
            <Meta label="Start" value={start ?? "—"} />
            <Meta label="Due" value={due ?? "—"} />
            {completed && <Meta label="Completed" value={completed} />}
            {updated && <Meta label="Updated" value={updated} />}
            {live.estimatedEffort && (
              <Meta label="Estimated effort" value={live.estimatedEffort} />
            )}
            {live.actualEffort && (
              <Meta label="Actual effort" value={live.actualEffort} />
            )}
          </div>

          <div>
            <p className="panel-title mb-1.5">Progress</p>
            <ProgressBar value={live.progressPercentage} />
          </div>

          {live.notes && <Section title="Notes">{live.notes}</Section>}

          {live.successCriteria && (
            <Section title="Success criteria">{live.successCriteria}</Section>
          )}

          {live.deliverables && (
            <Section title="Deliverables">{live.deliverables}</Section>
          )}

          {(live.blockingReason || live.blockedBy) && (
            <section className="space-y-1.5 rounded-xl border border-accent-rose/30 bg-accent-rose/5 p-3">
              <p className="panel-title text-accent-rose">Blocker</p>
              {live.blockingReason && (
                <p className="text-sm text-ink-muted">{live.blockingReason}</p>
              )}
              {live.blockedBy && (
                <p className="text-xs text-ink-dim">Blocked by: {live.blockedBy}</p>
              )}
            </section>
          )}

          {links.length > 0 && (
            <section className="space-y-2">
              <p className="panel-title">Links & files</p>
              <ul className="space-y-1.5">
                {links.map((link) => {
                  const url = isLikelyUrl(link);
                  return (
                    <li key={link}>
                      {url ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-surface-base/60 px-3 py-2 text-sm text-accent-cyan hover:border-accent-cyan/40"
                        >
                          <FileText className="size-3.5 shrink-0 opacity-70" />
                          <span className="truncate">{link}</span>
                          <ExternalLink className="size-3 shrink-0 opacity-60" />
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded-lg border border-surface-border bg-surface-base/60 px-3 py-2 text-sm text-ink-muted">
                          <FileText className="size-3.5 shrink-0 opacity-70" />
                          <span>{link}</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {dependencyIds.length > 0 && (
            <section className="space-y-1.5">
              <p className="panel-title">Dependencies</p>
              <ul className="space-y-1 text-sm text-ink-muted">
                {dependencyIds.map((id) => (
                  <li key={id} className="truncate">
                    {relatedTitles?.[id] ?? id}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tags.length > 0 && (
            <section className="space-y-1.5">
              <p className="panel-title">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="pill border-surface-border text-ink-dim"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-ink-dim">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  );
}
