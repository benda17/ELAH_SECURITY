import Link from "next/link";
import { ArrowLeft, ScanSearch } from "lucide-react";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Empty } from "@/components/ui/empty";
import { listIngestibleEvents } from "@/lib/elah/envelope";
import { correlateTurn, type CorrelatedMessage } from "@/lib/elah/correlate";
import { envelopeForDisplay } from "@/lib/elah/admin-events";
import { loadLatestScoreSnapshot } from "@/lib/elah/score-read";
import {
  DEFAULT_DISPLAY_THRESHOLDS,
  can,
  getEventAnnotations,
  getEventAuditHistory,
  getThresholds,
  requireAnalystPermission,
} from "@/lib/elah/analyst";
import { buildActionChain } from "@/components/elah-analyst/detail/action-chain";
import { ActionChainTimeline } from "@/components/elah-analyst/detail/action-chain-timeline";
import { AuditHistory } from "@/components/elah-analyst/detail/audit-history";
import { ChatTurn } from "@/components/elah-analyst/detail/chat-turn";
import {
  EnvelopeJson,
  EventBadges,
  EventDetails,
  QualityRules,
} from "@/components/elah-analyst/detail/event-overview";
import { ExplanationPanel } from "@/components/elah-analyst/detail/explanation-panel";
import { IntentionCoordinates } from "@/components/elah-analyst/detail/intention-coordinates";
import { ReviewPanel } from "@/components/elah-analyst/detail/review-panel";
import { ScoreSummary } from "@/components/elah-analyst/detail/score-summary";
import { SectionLoadError } from "@/components/elah-analyst/detail/primitives";
import { Card, CardHeader } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function BackLink() {
  return (
    <Link
      href="/admin/elah-events"
      className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-accent-cyan"
    >
      <ArrowLeft className="size-4" aria-hidden />
      All ELAH events
    </Link>
  );
}

/** Secondary sections degrade to an inline error instead of failing the whole page. */
async function attempt<T>(load: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
  try {
    return { ok: true, value: await load() };
  } catch (error) {
    console.error("[elah-event-detail] section load failed", error);
    return { ok: false };
  }
}

export default async function ElahEventDetailPage({
  params,
}: {
  params: { eventId: string };
}) {
  const page = `/admin/elah-events/${params.eventId}`;
  const user = await requireAnalystPermission("analyst:view", { page });
  const canAnnotate = can(user.role, "analyst:annotate");
  const canViewAudit = can(user.role, "analyst:view_audit");

  const matches = await listIngestibleEvents({
    eventId: params.eventId,
    take: 5,
  });
  const found = matches[0];

  if (!found) {
    await writeAuditLog({
      actionType: "elah_event_opened",
      page,
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
          action={<BackLink />}
        />
        <Empty
          icon={<ScanSearch className="size-5" />}
          title="Event not found"
          description="No ingestible ElahEvent matches this id. Page-view audit rows are not ElahEvents."
          action={<BackLink />}
        />
      </PageShell>
    );
  }

  const { event, quality } = found;
  const display = envelopeForDisplay(event);
  const conversation = event.conversation;
  const hasConversation = !!(conversation?.conversationId && conversation.messageId);

  const [scoreSnapshot, correlatedResult, annotationsResult, historyResult, thresholdsResult] = await Promise.all([
    loadLatestScoreSnapshot(event.eventId),
    attempt(() =>
      hasConversation
        ? correlateTurn({
            conversationId: conversation!.conversationId,
            messageId: conversation!.messageId,
            eventId: event.eventId,
          })
        : Promise.resolve(null),
    ),
    attempt(() => getEventAnnotations(event.eventId)),
    attempt(() => (canViewAudit ? getEventAuditHistory(event.eventId) : Promise.resolve([]))),
    attempt(() => getThresholds()),
  ]);

  const correlated = correlatedResult.ok ? correlatedResult.value : null;
  const correlationFailed = !correlatedResult.ok;
  const annotations = annotationsResult.ok ? annotationsResult.value : null;
  const history = historyResult.ok ? historyResult.value : null;
  const thresholds = thresholdsResult.ok ? thresholdsResult.value : null;

  await writeAuditLog({
    actionType: "elah_event_opened",
    page,
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

  const chatMessages: CorrelatedMessage[] =
    correlated && correlated.messages.length > 0
      ? correlated.messages
      : [
          ...(correlated?.utterance
            ? [{ id: "utterance", role: "user", content: correlated.utterance, createdAt: event.occurredAt }]
            : []),
          ...(correlated?.assistantReply
            ? [{ id: "reply", role: "assistant", content: correlated.assistantReply, createdAt: event.occurredAt }]
            : []),
        ];

  const steps = buildActionChain({ event, correlated, snapshot: scoreSnapshot });

  return (
    <PageShell>
      <SectionHeader
        title="ElahEvent detail"
        description="Mapped ingest envelope for this scoring unit, with its separate ELAH score snapshot and analyst review. ELAH never allows, blocks, or executes — bank policy decides."
        action={<BackLink />}
      />

      <EventBadges event={event} quality={quality} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <ScoreSummary
            snapshot={scoreSnapshot}
            thresholds={thresholds ?? DEFAULT_DISPLAY_THRESHOLDS}
            thresholdsLoaded={thresholds !== null}
          />
          <ExplanationPanel
            snapshot={scoreSnapshot}
            policy={event.policy}
            alternatives={{
              detectedIntent: event.detectedIntent ?? correlated?.modelOutput?.intent ?? null,
              classifierIntent: correlated?.intent?.intentLabel ?? null,
            }}
          />
          <IntentionCoordinates snapshot={scoreSnapshot} />
          {correlationFailed ? (
            <Card>
              <CardHeader title="Action chain" />
              <SectionLoadError what="the correlated chat turn and assistant hops" />
            </Card>
          ) : (
            <ActionChainTimeline
              steps={steps}
              hops={correlated?.hops ?? []}
              correlationAvailable={hasConversation}
            />
          )}
          {event.source === "agent" || chatMessages.length > 0 ? <ChatTurn messages={chatMessages} /> : null}
          <EventDetails event={event} classifierIntent={correlated?.intent ?? null} />
          <QualityRules quality={quality} />
          <EnvelopeJson display={display} />
        </div>

        <aside className="min-w-0 space-y-6" aria-label="Analyst review and audit history">
          <ReviewPanel eventId={event.eventId} annotations={annotations} canAnnotate={canAnnotate} />
          {canViewAudit ? <AuditHistory entries={history} /> : null}
        </aside>
      </div>
    </PageShell>
  );
}
