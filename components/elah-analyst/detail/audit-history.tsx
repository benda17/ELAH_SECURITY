import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditHistoryEntry, AuditHistoryKind } from "@/lib/elah/analyst/audit-history";
import { formatDate } from "@/lib/utils";
import { SectionLoadError } from "./primitives";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const KIND_META: Record<AuditHistoryKind, { label: string; variant: BadgeVariant }> = {
  ingest: { label: "Ingest", variant: "info" },
  audit: { label: "Audit", variant: "default" },
  agent: { label: "Assistant hop", variant: "role-agent" },
  score: { label: "ELAH score", variant: "info" },
  score_unavailable: { label: "Score unavailable", variant: "warning" },
  note: { label: "Note", variant: "default" },
  review_status: { label: "Review status", variant: "status-pending" },
  outcome_mark: { label: "Outcome mark", variant: "warning" },
  feedback: { label: "Feedback", variant: "default" },
  export: { label: "Export", variant: "default" },
};

function actorText(actor: AuditHistoryEntry["actor"]): string | null {
  if (!actor) return null;
  const who = actor.name ?? actor.id;
  if (!who && !actor.role) return null;
  return [who, actor.role ? `(${actor.role})` : null].filter(Boolean).join(" ");
}

/** Chronological record of everything logged against this event (oldest first). */
export function AuditHistory({ entries }: { entries: AuditHistoryEntry[] | null }) {
  return (
    <Card>
      <CardHeader
        title="Audit history"
        description="Ingest, assistant hops, ELAH scores, analyst actions, and exports for this event. Summaries never include raw utterances or tool args."
      />
      {entries === null ? (
        <SectionLoadError what="audit history" />
      ) : entries.length === 0 ? (
        <p className="text-sm text-ink-muted">No audit entries recorded for this event.</p>
      ) : (
        <ol className="relative space-y-4 border-l border-line pl-5" aria-label="Audit history, oldest first">
          {entries.map((entry) => {
            const meta = KIND_META[entry.kind];
            const actor = actorText(entry.actor);
            return (
              <li key={`${entry.table}-${entry.id}-${entry.kind}`} className="relative">
                <span aria-hidden className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border border-line-strong bg-bg-elevated" />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  <time dateTime={entry.at} className="text-xs text-ink-subtle">
                    {formatDate(entry.at)}
                  </time>
                  {actor ? <span className="text-xs text-ink-muted">{actor}</span> : null}
                </div>
                <p className="mt-1 break-words text-sm text-ink">{entry.summary}</p>
                <p className="mt-0.5 font-mono text-[11px] text-ink-subtle">
                  {entry.table} · {entry.type}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
