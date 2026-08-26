import { createHash } from "node:crypto";
import { errorResult } from "./errors";
import type { ErrorResponse, ScoreResponse } from "./types";

type RequestEntry = {
  bodyHash: string;
  response: ScoreResponse;
};

const byRequestId = new Map<string, RequestEntry>();
const byEventMode = new Map<string, ScoreResponse>();

export function hashScoreBody(raw: Buffer): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function eventModeKey(eventId: string, mode: string): string {
  return `${eventId}::${mode}`;
}

export function resetIdempotencyStore(): void {
  byRequestId.clear();
  byEventMode.clear();
}

export function lookupIdempotency(
  requestId: string,
  bodyHash: string,
  eventId: string,
  mode: string,
):
  | { kind: "replay"; response: ScoreResponse }
  | { kind: "event_replay"; response: ScoreResponse }
  | { kind: "conflict"; status: number; body: ErrorResponse }
  | { kind: "miss" } {
  const byRequest = byRequestId.get(requestId);
  if (byRequest) {
    if (byRequest.bodyHash === bodyHash) {
      return { kind: "replay", response: byRequest.response };
    }
    return {
      kind: "conflict",
      ...errorResult(
        409,
        "idempotency_conflict",
        "Idempotency key reused with a different body.",
        requestId,
        [{ path: "requestId", reason: "body_mismatch" }],
      ),
    };
  }

  const prior = byEventMode.get(eventModeKey(eventId, mode));
  if (prior) {
    const response: ScoreResponse = { ...prior, requestId };
    byRequestId.set(requestId, { bodyHash, response });
    return { kind: "event_replay", response };
  }

  return { kind: "miss" };
}

export function storeScoreResponse(
  requestId: string,
  bodyHash: string,
  eventId: string,
  mode: string,
  response: ScoreResponse,
): void {
  byRequestId.set(requestId, { bodyHash, response });
  const key = eventModeKey(eventId, mode);
  if (!byEventMode.has(key)) {
    byEventMode.set(key, response);
  }
}
