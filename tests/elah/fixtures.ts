import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, expect } from "vitest";
import {
  handleScore,
  resetIdempotencyStore,
  type HandleScoreResult,
} from "@/lib/elah/service";
import type { ElahEvent } from "@/lib/elah";

beforeEach(() => {
  resetIdempotencyStore();
});

export const TEST_ELAH_TOKEN = "test-elah-service-token-min-32-chars";

export const SCORE_RESPONSE_KEYS = [
  "contractVersion",
  "requestId",
  "eventId",
  "status",
  "scoredAt",
  "score",
] as const;

export const ELAH_SCORE_KEYS = [
  "elahScore",
  "confidence",
  "uncertainty",
  "intentLabel",
  "coordinates",
  "explanation",
  "policyHook",
  "provenance",
] as const;

export const COORDINATE_KEYS = [
  "humanAgency",
  "financialRisk",
  "emotionalUrgency",
] as const;

export const EXPLANATION_KEYS = [
  "matchedSignals",
  "weakSignals",
  "negativeSignals",
  "summary",
] as const;

export const POLICY_HOOK_KEYS = ["recommendation", "reasons"] as const;

export const PROVENANCE_KEYS = ["scorer", "modelVersion", "labelSource"] as const;

export const POLICY_RECOMMENDATIONS = [
  "none",
  "watch",
  "review",
  "step_up_hint",
] as const;

export const FORBIDDEN_RECOMMENDATIONS = [
  "allow",
  "deny",
  "block",
  "confirm",
  "execute",
  "decision",
] as const;

const samples = JSON.parse(
  readFileSync(
    path.join(__dirname, "../events/fixtures/elah-event-samples.json"),
    "utf8",
  ),
) as Record<string, ElahEvent>;

export function elahEventSample(id: string): ElahEvent {
  const event = samples[id];
  if (!event) throw new Error(`Missing ElahEvent sample ${id}`);
  return structuredClone(event);
}

export function transferEvent(): ElahEvent {
  return elahEventSample("8.1");
}

export function injectionEvent(): ElahEvent {
  return elahEventSample("8.3");
}

/** Short utterance, no tool plan — mock scorer should abstain. */
export function ambiguousEvent(): ElahEvent {
  return {
    schemaVersion: "1.0",
    eventId: "evt_01JEXAMPLE000000000000010",
    occurredAt: "2026-08-17T07:20:00.000Z",
    appId: "elah-banking-demo",
    source: "agent",
    actionType: "recipients_read",
    outcome: "conversational",
    executionState: "no_tool",
    actor: {
      userIdHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
      sessionId: "clxsessionexample0001",
      actorType: "customer",
      role: "premium_customer",
      customerTier: "premium",
    },
    action: {
      toolName: null,
      page: "/assistant",
      args: {},
      amount: null,
      currency: null,
      amountBucket: "none",
      accountContext: "unspecified",
      recipientType: "none",
    },
    policy: {
      decision: "not_applicable",
      reasons: [],
      confirmationRequired: false,
    },
    conversation: {
      conversationId: "clxconvexample0001",
      messageId: "clxmsgexample0010",
      utterance: "pay?",
    },
    mfaStatus: "unknown",
    detectedIntent: "ambiguous_banking_request",
  };
}

let requestSeq = 0;

export function nextRequestId(prefix = "req_test"): string {
  requestSeq += 1;
  return `${prefix}_${Date.now()}_${requestSeq}_${Math.random().toString(36).slice(2, 8)}`;
}

export function wrapScoreRequest(
  event: ElahEvent,
  overrides: { requestId?: string; contractVersion?: string; mode?: string } = {},
): {
  contractVersion: string;
  requestId: string;
  mode: string;
  event: ElahEvent;
} {
  return {
    contractVersion: overrides.contractVersion ?? "1.0",
    requestId: overrides.requestId ?? nextRequestId(),
    mode: overrides.mode ?? "pre_tool",
    event,
  };
}

export function authHeaders(
  extra: Record<string, string> = {},
  opts: { token?: string | null } = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "Content-Type": "application/json",
    ...extra,
  };
  if (opts.token !== null) {
    const token = opts.token ?? process.env.ELAH_SERVICE_TOKEN ?? TEST_ELAH_TOKEN;
    headers.authorization = `Bearer ${token}`;
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function invokeHandleScore(
  headers: Record<string, string>,
  rawBody: string,
): Promise<HandleScoreResult> {
  return handleScore(headers, rawBody);
}

export async function scoreValidEvent(
  event: ElahEvent,
  overrides: { requestId?: string } = {},
): Promise<{ status: number; body: Record<string, unknown>; requestId: string; rawBody: string }> {
  const request = wrapScoreRequest(event, overrides);
  const rawBody = JSON.stringify(request);
  const result = await invokeHandleScore(authHeaders(), rawBody);
  return {
    status: result.status,
    body: (result.body ?? {}) as Record<string, unknown>,
    requestId: request.requestId,
    rawBody,
  };
}

export function errorCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const error = (body as { error?: { code?: unknown } }).error;
  return typeof error?.code === "string" ? error.code : undefined;
}

export function asScore(body: unknown): {
  elahScore: number;
  confidence: number;
  uncertainty: number;
  intentLabel: string;
  policyHook: { recommendation: string; reasons: unknown };
  coordinates: Record<string, unknown>;
  explanation: Record<string, unknown>;
  provenance: Record<string, unknown>;
} {
  const score = (body as { score?: unknown }).score;
  if (!score || typeof score !== "object") {
    throw new Error("ScoreResponse is missing score");
  }
  return score as ReturnType<typeof asScore>;
}

export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function expectAllowedKeys(
  obj: object,
  allowed: readonly string[],
  required: readonly string[] = allowed,
): void {
  const keys = Object.keys(obj);
  for (const key of keys) {
    expect(allowed, `unexpected key '${key}'`).toContain(key);
  }
  for (const key of required) {
    expect(keys, `missing required key '${key}'`).toContain(key);
  }
}

export function expectRecommendationNeverEnforces(recommendation: string): void {
  expect(POLICY_RECOMMENDATIONS).toContain(recommendation);
  expect(FORBIDDEN_RECOMMENDATIONS).not.toContain(recommendation);
}
