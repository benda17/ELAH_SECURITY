"use client";

import { useEffect, type ReactNode } from "react";
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

  const start = formatDate(task.startDate);
  const due = formatDate(task.dueDate);
  const completed = formatDate(task.completedAt);
  const updated = formatDate(task.updatedAt);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`task-detail-${task.id}`}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-surface-border bg-surface-raised shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-surface-border bg-surface-raised/95 px-5 py-4 backdrop-blur-sm">
          <div className="min-w-0 space-y-2">
            <h2
              id={`task-detail-${task.id}`}
              className="text-lg font-semibold leading-snug text-ink"
            >
              {task.title}
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.isCriticalPath && (
                <span className="pill border-accent-amber/40 text-accent-amber">
                  Critical path
                </span>
              )}
              {task.riskLevel && (
                <span className="pill border-accent-rose/30 text-accent-rose">
                  Risk: {task.riskLevel}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Meta label="Phase" value={task.phase} />
            <Meta label="Workstream" value={task.workstream} />
            <Meta label="Category" value={task.category} />
            <Meta label="Owner" value={task.owner ?? "Unassigned"} />
            <Meta label="Start" value={start ?? "—"} />
            <Meta label="Due" value={due ?? "—"} />
            {completed && <Meta label="Completed" value={completed} />}
            {updated && <Meta label="Updated" value={updated} />}
            {task.estimatedEffort && (
              <Meta label="Estimated effort" value={task.estimatedEffort} />
            )}
            {task.actualEffort && (
              <Meta label="Actual effort" value={task.actualEffort} />
            )}
          </div>

          <div>
            <p className="panel-title mb-1.5">Progress</p>
            <ProgressBar value={task.progressPercentage} />
          </div>

          {task.description && (
            <Section title="Description">{task.description}</Section>
          )}

          {task.notes && <Section title="Notes">{task.notes}</Section>}

          {task.successCriteria && (
            <Section title="Success criteria">{task.successCriteria}</Section>
          )}

          {task.deliverables && (
            <Section title="Deliverables">{task.deliverables}</Section>
          )}

          {(task.blockingReason || task.blockedBy) && (
            <section className="space-y-1.5 rounded-xl border border-accent-rose/30 bg-accent-rose/5 p-3">
              <p className="panel-title text-accent-rose">Blocker</p>
              {task.blockingReason && (
                <p className="text-sm text-ink-muted">{task.blockingReason}</p>
              )}
              {task.blockedBy && (
                <p className="text-xs text-ink-dim">Blocked by: {task.blockedBy}</p>
              )}
            </section>
          )}

          {task.links.length > 0 && (
            <section className="space-y-2">
              <p className="panel-title">Links & files</p>
              <ul className="space-y-1.5">
                {task.links.map((link) => {
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

          {task.dependencyIds.length > 0 && (
            <section className="space-y-1.5">
              <p className="panel-title">Dependencies</p>
              <ul className="space-y-1 text-sm text-ink-muted">
                {task.dependencyIds.map((id) => (
                  <li key={id} className="truncate">
                    {relatedTitles?.[id] ?? id}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {task.tags.length > 0 && (
            <section className="space-y-1.5">
              <p className="panel-title">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
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

          {!task.description &&
            !task.notes &&
            !task.successCriteria &&
            !task.deliverables &&
            task.links.length === 0 && (
              <p className="rounded-lg border border-dashed border-surface-border px-3 py-4 text-center text-sm text-ink-dim">
                No description, notes, or files attached yet.
              </p>
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
