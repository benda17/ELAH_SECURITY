import type { ElahEvent } from "@/lib/elah/envelope";
import type { ElahScoreSnapshot } from "@/lib/elah/score-read";
import { DEFAULT_DISPLAY_THRESHOLDS } from "@/lib/elah/analyst/bands";
import { buildAnalystRow, type AnalystEventRow, type EventReviewState } from "@/lib/elah/analyst/types";

export function makeEvent(overrides: Partial<ElahEvent> = {}): ElahEvent {
  return {
    schemaVersion: "1.0",
    eventId: "evt_analyst_0001",
    occurredAt: "2026-09-28T07:00:00.000Z",
    appId: "elah-banking-demo",
    source: "agent",
    actionType: "external_transfer",
    outcome: "pending_confirmation",
    executionState: "pre_tool",
    actor: {
      userIdHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
      sessionId: "sess-analyst-1",
      actorType: "customer",
    },
    action: {
      toolName: "create_external_transfer",
      args: {},
      amountBucket: "medium_500_1999",
      accountContext: "checking",
      recipientType: "person_name",
    },
    conversation: {
      conversationId: "conv-1",
      messageId: "msg-1",
      utterance: "Send 500 shekels to Daniel",
    },
    ...overrides,
  };
}

export function scored(
  elahScore: number | null,
  extra: Partial<Extract<ElahScoreSnapshot, { kind: "scored" }>> = {},
): ElahScoreSnapshot {
  return {
    kind: "scored",
    eventType: "elah_scored",
    status: "scored",
    elahScore,
    confidence: 0.8,
    uncertainty: 0.2,
    intentLabel: "external_transfer",
    coordinates: null,
    explanation: { matchedSignals: [], weakSignals: [], negativeSignals: [], summary: null },
    policyHook: { recommendation: null, reasons: [] },
    requestId: "req_1",
    scoredAt: "2026-09-28T07:00:00.100Z",
    provenanceScorer: "rules_v0",
    provenanceModelVersion: null,
    ...extra,
  };
}

export function makeRow(opts: {
  event?: Partial<ElahEvent>;
  score?: ElahScoreSnapshot | null;
  review?: Partial<EventReviewState>;
  qualityOk?: boolean;
} = {}): AnalystEventRow {
  const event = makeEvent(opts.event);
  return buildAnalystRow(
    {
      event,
      quality: { ok: opts.qualityOk ?? true, eventId: event.eventId, ruleIds: [] },
      auditLogId: `audit_${event.eventId}`,
    },
    opts.score === undefined ? scored(0.8) : opts.score,
    opts.review
      ? {
          eventId: event.eventId,
          reviewStatus: "unreviewed",
          outcomeMark: null,
          noteCount: 0,
          feedbackCount: 0,
          lastActivityAt: null,
          ...opts.review,
        }
      : null,
    DEFAULT_DISPLAY_THRESHOLDS,
  );
}
