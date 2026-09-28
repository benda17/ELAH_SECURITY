import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JsonViewer } from "@/components/ui/json-viewer";
import type { ElahEvent } from "@/lib/elah/envelope";
import type { QualityResult } from "@/lib/elah/quality";
import { formatDate } from "@/lib/utils";
import { KV, KVGrid } from "./primitives";

function humanize(value: string | null | undefined): string {
  return value ? value.replaceAll("_", " ") : "—";
}

/** Badge strip shown under the page header. */
export function EventBadges({ event, quality }: { event: ElahEvent; quality: QualityResult }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={event.source === "agent" ? "role-agent" : "info"}>{event.source}</Badge>
      <Badge variant="default">{humanize(event.actionType)}</Badge>
      <Badge variant="default">{humanize(event.outcome)}</Badge>
      <Badge variant={quality.ok ? "status-approved" : "status-rejected"}>quality {quality.ok ? "ok" : "fail"}</Badge>
      <span className="break-all font-mono text-xs text-ink-subtle">{event.eventId}</span>
      <span className="text-xs text-ink-subtle">{formatDate(event.occurredAt)}</span>
    </div>
  );
}

export function EventDetails({
  event,
  classifierIntent,
}: {
  event: ElahEvent;
  classifierIntent: { intentId: string; intentLabel: string; confidence: number } | null;
}) {
  return (
    <Card>
      <CardHeader
        title="Event details"
        description="Fields from the ElahEvent envelope (schemaVersion 1.0). Scores are not part of this envelope."
      />
      <KVGrid>
        <KV k="Occurred at" v={formatDate(event.occurredAt)} />
        <KV k="App" v={event.appId} />
        <KV k="Source" v={event.source} />
        <KV k="Action type" v={humanize(event.actionType)} />
        <KV k="Outcome" v={humanize(event.outcome)} />
        <KV k="Execution state" v={humanize(event.executionState)} />
        <KV k="Tool" v={event.action.toolName ?? "—"} />
        <KV k="Page" v={event.action.page ?? "—"} />
        <KV k="Amount bucket" v={humanize(event.action.amountBucket)} />
        <KV k="Account context" v={humanize(event.action.accountContext)} />
        <KV k="Recipient type" v={humanize(event.action.recipientType)} />
        <KV k="Bank policy" v={humanize(event.policy?.decision)} />
        <KV k="Actor type" v={event.actor.actorType} />
        <KV k="Actor role" v={event.actor.role ?? "—"} />
        <KV k="Customer tier" v={event.actor.customerTier ?? "—"} />
        <KV k="MFA" v={humanize(event.mfaStatus)} />
        <KV k="Detected intent (planner)" v={event.detectedIntent ?? "—"} />
        <KV k="Conversation id" v={event.conversation?.conversationId ?? "—"} />
        <KV k="Message id" v={event.conversation?.messageId ?? "—"} />
        <KV k="Schema" v={event.schemaVersion} />
      </KVGrid>

      {classifierIntent ? (
        <div className="mt-5 rounded-lg border border-line bg-bg-panel/40 px-4 py-3">
          <div className="text-[10px] uppercase tracking-widest text-ink-subtle">Simulator intent hint</div>
          <p className="mt-1 text-xs text-ink-muted">Simulator classifier hint for this turn — not an ELAH score.</p>
          <KVGrid className="mt-2 md:grid-cols-3">
            <KV k="Label" v={classifierIntent.intentLabel} />
            <KV k="Intent id" v={classifierIntent.intentId} />
            <KV k="Confidence" v={String(classifierIntent.confidence)} />
          </KVGrid>
        </div>
      ) : null}
    </Card>
  );
}

export function QualityRules({ quality }: { quality: QualityResult }) {
  return (
    <Card>
      <CardHeader
        title="Quality rules"
        description={quality.ok ? "Envelope passed ingest checks for this viewer." : "Failed rule IDs from checkElahEvent."}
      />
      {quality.ruleIds.length === 0 ? (
        <p className="text-sm text-ink-muted">No rule failures.</p>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label="Failed quality rules">
          {quality.ruleIds.map((ruleId) => (
            <li key={ruleId}>
              <Badge variant="status-rejected">{ruleId}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Raw-event inspection (panel §8): folded by default; passwords and scores stripped. */
export function EnvelopeJson({ display }: { display: ElahEvent }) {
  return (
    <Card>
      <details>
        <summary className="cursor-pointer">
          <span className="text-base font-semibold tracking-tight text-ink">Envelope JSON</span>
          <span className="ml-2 text-sm text-ink-muted">
            schemaVersion 1.0 ElahEvent. Passwords and scores are stripped; tool args sanitized.
          </span>
        </summary>
        <div className="mt-4">
          <JsonViewer label="ElahEvent" data={display} />
        </div>
      </details>
    </Card>
  );
}
