import Link from "next/link";
import { ArrowLeft, ScanSearch } from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { JsonViewer } from "@/components/ui/json-viewer";
import { Empty } from "@/components/ui/empty";
import { formatDate } from "@/lib/utils";
import { listIngestibleEvents } from "@/lib/elah/envelope";
import { correlateTurn } from "@/lib/elah/correlate";
import { envelopeForDisplay } from "@/lib/elah/admin-events";
import {
  loadLatestScoreSnapshot,
  formatScoreNumber,
  type ElahScoreSnapshot,
} from "@/lib/elah/score-read";
import {
  formatAgentEventLabel,
  agentEventBadgeVariant,
} from "@/lib/agent/display";

export const dynamic = "force-dynamic";

export default async function ElahEventDetailPage({
  params,
}: {
  params: { eventId: string };
}) {
  await requireSecurity();

  const matches = await listIngestibleEvents({
    eventId: params.eventId,
    take: 5,
  });
  const found = matches[0];

  if (!found) {
    await writeAuditLog({
      actionType: "elah_event_opened",
      page: `/admin/elah-events/${params.eventId}`,
      toolOrFeatureUsed: "elah_event_viewer",
      riskLevel: "low",
      actionOutcome: "viewed",
      inputDataSummary: { eventId: params.eventId, found: false },
    });
    return (
      <PageShell>
        <SectionHeader
          title="ElahEvent detail"
          description="Ingestible envelope for a single scoring unit."
          action={
            <Link
              href="/admin/elah-events"
              className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent-cyan"
            >
              <ArrowLeft className="size-4" />
              All ELAH events
            </Link>
          }
        />
        <Empty
          icon={<ScanSearch className="size-5" />}
          title="Event not found"
          description="No ingestible ElahEvent matches this id. Page-view audit rows are not ElahEvents."
        />
      </PageShell>
    );
  }

  const { event, quality } = found;
  const display = envelopeForDisplay(event);
  const scoreSnapshot = await loadLatestScoreSnapshot(event.eventId);
  const conversation = event.conversation;
  const correlated =
    conversation?.conversationId && conversation.messageId
      ? await correlateTurn({
          conversationId: conversation.conversationId,
          messageId: conversation.messageId,
          eventId: event.eventId,
        })
      : null;

  await writeAuditLog({
    actionType: "elah_event_opened",
    page: `/admin/elah-events/${params.eventId}`,
    toolOrFeatureUsed: "elah_event_viewer",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      eventId: event.eventId,
      actionType: event.actionType,
      source: event.source,
      qualityOk: quality.ok,
      hopCount: correlated?.hops.length ?? 0,
    },
  });

  const chatMessages =
    correlated && correlated.messages.length > 0
      ? correlated.messages
      : correlated && (correlated.utterance || correlated.assistantReply)
        ? [
            ...(correlated.utterance
              ? [
                  {
                    id: "utterance",
                    role: "user",
                    content: correlated.utterance,
                    createdAt: event.occurredAt,
                  },
                ]
              : []),
            ...(correlated.assistantReply
              ? [
                  {
                    id: "reply",
                    role: "assistant",
                    content: correlated.assistantReply,
                    createdAt: event.occurredAt,
                  },
                ]
              : []),
          ]
        : [];

  return (
    <PageShell>
      <SectionHeader
        title="ElahEvent detail"
        description="Mapped ingest envelope for this scoring unit. ELAH never allows, blocks, or executes. Scores are not fields of this event; the score card below is a separate Phase 3 snapshot."
        action={
          <Link
            href="/admin/elah-events"
            className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent-cyan"
          >
            <ArrowLeft className="size-4" />
            All ELAH events
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={event.source === "agent" ? "role-agent" : "info"}>
          {event.source}
        </Badge>
        <Badge variant="default">{event.actionType.replaceAll("_", " ")}</Badge>
        <Badge variant="default">{event.outcome.replaceAll("_", " ")}</Badge>
        <Badge variant={quality.ok ? "status-approved" : "status-rejected"}>
          quality {quality.ok ? "ok" : "fail"}
        </Badge>
        <span className="font-mono text-xs text-ink-subtle">{event.eventId}</span>
        <span className="text-xs text-ink-subtle">
          {formatDate(event.occurredAt)}
        </span>
      </div>

      <ElahScoreCard snapshot={scoreSnapshot} />

      {event.source === "agent" || chatMessages.length > 0 ? (
        <Card>
          <CardHeader
            title="This chat turn"
            description="What the customer typed and what the assistant answered. Website (UI) events have no chat."
          />
          {chatMessages.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No transcript stored for this event. Open Assistant logs for the
              raw lifecycle stream.
            </p>
          ) : (
            <div className="space-y-3">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-lg border border-line bg-bg-panel/40 px-4 py-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      variant={
                        message.role === "user" ? "info" : "role-agent"
                      }
                    >
                      {message.role === "user" ? "Customer" : "Assistant"}
                    </Badge>
                    <span className="text-xs text-ink-subtle">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-ink">
                    {message.content || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
          {correlated?.modelOutput ||
          correlated?.policyDecision ||
          correlated?.resultSummary ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <KV
                  k="Planned tool"
                  v={correlated.modelOutput?.plannedTool ?? "—"}
                />
                <KV
                  k="Planner"
                  v={
                    correlated.modelOutput?.usedFallback === true
                      ? "built-in fallback"
                      : correlated.modelOutput?.usedFallback === false
                        ? "language model"
                        : "—"
                  }
                />
                <KV k="Bank policy" v={correlated.policyDecision ?? "—"} />
              </div>
              {correlated.modelOutput?.explanation ? (
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
                    Model explanation
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                    {correlated.modelOutput.explanation}
                  </p>
                </div>
              ) : null}
              {correlated.modelOutput?.result ? (
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
                    Result
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                    {correlated.modelOutput.result}
                  </p>
                </div>
              ) : correlated.resultSummary ? (
                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
                    Result
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                    {correlated.resultSummary}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Quality rules"
          description={
            quality.ok
              ? "Envelope passed ingest checks for this viewer."
              : "Failed rule IDs from checkElahEvent."
          }
        />
        {quality.ruleIds.length === 0 ? (
          <p className="text-sm text-ink-muted">No rule failures.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {quality.ruleIds.map((ruleId) => (
              <Badge key={ruleId} variant="status-rejected">
                {ruleId}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {correlated?.intent ? (
        <Card>
          <CardHeader
            title="Intent"
            description="Simulator classifier hint for this turn — not an ELAH score."
          />
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <KV k="Label" v={correlated.intent.intentLabel} />
            <KV k="Intent id" v={correlated.intent.intentId} />
            <KV k="Confidence" v={String(correlated.intent.confidence)} />
          </div>
        </Card>
      ) : null}

      {correlated && correlated.hops.length > 0 ? (
        <Card>
          <CardHeader
            title="Correlated hops"
            description="Assistant lifecycle rows for the same conversation/message. Operational, not ElahEvents."
          />
          <Table>
            <THead>
              <TR>
                <TH>Time</TH>
                <TH>Hop</TH>
                <TH>Tool</TH>
                <TH>Policy</TH>
                <TH>Seq</TH>
              </TR>
            </THead>
            <tbody>
              {correlated.hops.map((hop, index) => (
                <TR key={`${hop.eventType}-${hop.timestamp}-${index}`}>
                  <TD className="whitespace-nowrap text-ink-muted">
                    {formatDate(hop.timestamp)}
                  </TD>
                  <TD>
                    <Badge variant={agentEventBadgeVariant(hop.eventType)}>
                      {formatAgentEventLabel(hop.eventType, hop.toolName)}
                    </Badge>
                    {hop.resultSummary || hop.assistantMessage ? (
                      <p className="mt-1 max-w-md truncate text-xs text-ink-muted">
                        {hop.resultSummary ?? hop.assistantMessage}
                      </p>
                    ) : null}
                  </TD>
                  <TD className="font-mono text-xs text-ink-muted">
                    {hop.toolName ?? "—"}
                  </TD>
                  <TD className="text-ink-muted">
                    {hop.policyDecision ?? "—"}
                  </TD>
                  <TD className="text-ink-muted">
                    {hop.sequence != null ? hop.sequence : "—"}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Envelope JSON"
          description="schemaVersion 1.0 ElahEvent. Passwords and scores are stripped."
        />
        <JsonViewer label="ElahEvent" data={display} />
      </Card>
    </PageShell>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
        {k}
      </div>
      <div className="truncate font-mono text-ink">{v}</div>
    </div>
  );
}

function SignalList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
        {label}
      </div>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-ink-muted">None</p>
      ) : (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={`${label}-${item}`} variant="default">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function scoreStatusBadge(snapshot: ElahScoreSnapshot) {
  if (snapshot.kind === "unavailable") {
    return <Badge variant="warning">unavailable</Badge>;
  }
  if (snapshot.status === "abstained") {
    return <Badge variant="warning">abstained</Badge>;
  }
  return <Badge variant="info">scored</Badge>;
}

function ElahScoreCard({ snapshot }: { snapshot: ElahScoreSnapshot | null }) {
  return (
    <Card>
      <CardHeader
        title="ELAH score (rules_v0)"
        description="Intention reading only. This is not an allow, deny, confirm, or execute decision. Bank policy remains the authority. ELAH never allows, blocks, or executes."
        action={snapshot ? scoreStatusBadge(snapshot) : undefined}
      />
      {!snapshot ? (
        <p className="text-sm text-ink-muted">
          Not scored (Phase 3 snapshot missing)
        </p>
      ) : snapshot.kind === "unavailable" ? (
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <KV k="Status" v="unavailable" />
          <KV k="Reason" v={snapshot.reason} />
          <KV k="requestId" v={snapshot.requestId ?? "—"} />
          <KV
            k="HTTP"
            v={snapshot.httpStatus != null ? String(snapshot.httpStatus) : "—"}
          />
          <KV k="Error code" v={snapshot.errorCode ?? "—"} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <KV k="Status" v={snapshot.status} />
            <KV k="elahScore" v={formatScoreNumber(snapshot.elahScore)} />
            <KV k="confidence" v={formatScoreNumber(snapshot.confidence)} />
            <KV k="uncertainty" v={formatScoreNumber(snapshot.uncertainty)} />
            <KV k="intentLabel" v={snapshot.intentLabel ?? "—"} />
            <KV k="requestId" v={snapshot.requestId ?? "—"} />
            <KV k="scoredAt" v={snapshot.scoredAt ?? "—"} />
            <KV k="scorer" v={snapshot.provenanceScorer ?? "rules_v0"} />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <KV
              k="humanAgency"
              v={formatScoreNumber(snapshot.coordinates?.humanAgency ?? null)}
            />
            <KV
              k="financialRisk"
              v={formatScoreNumber(snapshot.coordinates?.financialRisk ?? null)}
            />
            <KV
              k="emotionalUrgency"
              v={formatScoreNumber(
                snapshot.coordinates?.emotionalUrgency ?? null,
              )}
            />
          </div>
          {snapshot.explanation.summary ? (
            <p className="text-sm text-ink">{snapshot.explanation.summary}</p>
          ) : null}
          <div className="space-y-3">
            <SignalList
              label="matchedSignals"
              items={snapshot.explanation.matchedSignals}
            />
            <SignalList
              label="weakSignals"
              items={snapshot.explanation.weakSignals}
            />
            <SignalList
              label="negativeSignals"
              items={snapshot.explanation.negativeSignals}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
            <KV
              k="policyHook"
              v={snapshot.policyHook.recommendation ?? "—"}
            />
            <KV
              k="policyHook reasons"
              v={
                snapshot.policyHook.reasons.length > 0
                  ? snapshot.policyHook.reasons.join("; ")
                  : "—"
              }
            />
          </div>
        </div>
      )}
    </Card>
  );
}
