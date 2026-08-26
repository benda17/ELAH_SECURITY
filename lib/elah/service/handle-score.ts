import { timingSafeEqual } from "node:crypto";
import { ELAH_APP_ID } from "@/lib/elah/envelope";
import { errorResult } from "./errors";
import {
  hashScoreBody,
  lookupIdempotency,
  storeScoreResponse,
} from "./idempotency";
import { scoreElahEvent } from "./mock-scorer";
import {
  ELAH_CONTRACT_VERSION,
  ELAH_SCORER,
  type HandleScoreResult,
  type ScoreHeaders,
  type ScoreResponse,
} from "./types";
import {
  MAX_SCORE_BODY_BYTES,
  getHeader,
  parseScoreJson,
  validateScoreRequest,
} from "./validate-request";

function toBuffer(rawBody: string | Buffer): Buffer {
  return Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");
}

function tokensEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    if (a.length > 0) timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

function authorize(headers: ScoreHeaders): boolean {
  const expected = process.env.ELAH_SERVICE_TOKEN;
  if (!expected) return false;
  const auth = getHeader(headers, "Authorization");
  if (!auth) return false;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(auth);
  if (!match) return false;
  return tokensEqual(match[1]!, expected);
}

function payloadTooLarge(headers: ScoreHeaders, raw: Buffer): boolean {
  const contentLength = getHeader(headers, "Content-Length");
  if (contentLength != null) {
    const n = Number(contentLength);
    if (Number.isFinite(n) && n > MAX_SCORE_BODY_BYTES) return true;
  }
  return raw.length > MAX_SCORE_BODY_BYTES;
}

function scoredAtNow(): string {
  return new Date().toISOString();
}

type LogFields = {
  requestId: string | null;
  eventId: string | null;
  mode: string | null;
  appId: string | null;
  source: string | null;
  actionType: string | null;
  httpStatus: number;
  latencyMs: number;
  scorer?: string;
  error?: { code: string };
};

function logRequest(fields: LogFields): void {
  console.info(JSON.stringify(fields));
}

export async function handleScore(
  headers: ScoreHeaders,
  rawBody: string | Buffer,
): Promise<HandleScoreResult> {
  const started = Date.now();
  let requestId: string | null = null;
  let eventId: string | null = null;
  let mode: string | null = null;
  let appId: string | null = null;
  let source: string | null = null;
  let actionType: string | null = null;
  let result: HandleScoreResult | undefined;

  try {
    if (!authorize(headers)) {
      result = errorResult(
        401,
        "unauthorized",
        "Missing or invalid bearer token.",
        null,
      );
      return result;
    }

    const raw = toBuffer(rawBody);
    if (payloadTooLarge(headers, raw)) {
      result = errorResult(
        413,
        "payload_too_large",
        "Request body exceeds 32768 bytes.",
        null,
      );
      return result;
    }

    const parsed = parseScoreJson(raw.toString("utf8"));
    if (!parsed.ok) {
      result = { status: 400, body: parsed.body };
      return result;
    }

    const validated = validateScoreRequest(parsed.value, headers);
    if (!validated.ok) {
      requestId = validated.body.requestId;
      result = { status: validated.status, body: validated.body };
      return result;
    }

    const { request } = validated;
    requestId = request.requestId;
    eventId = request.event.eventId;
    mode = request.mode;
    appId = request.event.appId;
    source = request.event.source;
    actionType = request.event.actionType;

    if (request.event.appId !== ELAH_APP_ID) {
      result = errorResult(
        403,
        "forbidden_app",
        "Token is not allowed to score this appId.",
        request.requestId,
        [{ path: "event.appId", reason: "forbidden_app" }],
      );
      return result;
    }

    const bodyHash = hashScoreBody(raw);
    const idem = lookupIdempotency(
      request.requestId,
      bodyHash,
      request.event.eventId,
      request.mode,
    );
    if (idem.kind === "conflict") {
      result = { status: idem.status, body: idem.body };
      return result;
    }
    if (idem.kind === "replay" || idem.kind === "event_replay") {
      result = { status: 200, body: idem.response };
      return result;
    }

    const scored = scoreElahEvent(request.event);
    const response: ScoreResponse = {
      contractVersion: ELAH_CONTRACT_VERSION,
      requestId: request.requestId,
      eventId: request.event.eventId,
      status: scored.status,
      scoredAt: scoredAtNow(),
      score: scored.score,
    };
    storeScoreResponse(
      request.requestId,
      bodyHash,
      request.event.eventId,
      request.mode,
      response,
    );
    result = { status: 200, body: response };
    return result;
  } catch {
    result = errorResult(
      500,
      "internal_error",
      "Internal error.",
      requestId,
    );
    return result;
  } finally {
    const body = result?.body;
    const errorCode =
      body && "error" in body && body.error ? body.error.code : undefined;
    logRequest({
      requestId,
      eventId,
      mode,
      appId,
      source,
      actionType,
      httpStatus: result?.status ?? 500,
      latencyMs: Date.now() - started,
      ...(errorCode ? { error: { code: errorCode } } : { scorer: ELAH_SCORER }),
    });
  }
}
