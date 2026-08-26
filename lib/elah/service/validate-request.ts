import { validateElahEvent, type ElahEvent } from "@/lib/elah/envelope";
import { errorResult } from "./errors";
import {
  ELAH_CONTRACT_VERSION,
  ELAH_SCORE_MODE,
  type ErrorDetail,
  type ErrorResponse,
  type ScoreHeaders,
  type ScoreRequest,
} from "./types";

export const MAX_SCORE_BODY_BYTES = 32768;

const SCORE_REQUEST_KEYS = new Set([
  "contractVersion",
  "requestId",
  "mode",
  "event",
]);

/** Same set as `FORBIDDEN_ARG_KEYS` in `lib/elah/envelope.ts`. */
const FORBIDDEN_ARG_KEYS = new Set([
  "userId",
  "customerProfileId",
  "profileId",
  "actorId",
  "sessionId",
  "accountId",
  "fromAccountId",
  "toAccountId",
  "ownerId",
  "targetUserId",
  "password",
  "token",
  "role",
  "cardId",
]);

const SANITIZATION_ERROR_RE =
  /forbidden key|is not redacted|unsanitized digit run|exceeds 400 characters/;

export function getHeader(headers: ScoreHeaders, name: string): string | null {
  const lower = name.toLowerCase();
  if (headers && typeof (headers as { get?: unknown }).get === "function") {
    const getter = headers as { get(name: string): string | null | undefined };
    const value = getter.get(name) ?? getter.get(lower);
    if (value == null || value === "") return null;
    return value;
  }
  const rec = headers as Record<string, string | string[] | undefined>;
  for (const [key, value] of Object.entries(rec)) {
    if (key.toLowerCase() !== lower) continue;
    if (Array.isArray(value)) return value[0] ?? null;
    if (value == null || value === "") return null;
    return value;
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function peekRequestId(value: unknown): string | null {
  const obj = asRecord(value);
  if (!obj) return null;
  return typeof obj.requestId === "string" && obj.requestId.length > 0
    ? obj.requestId
    : null;
}

function eventErrorToDetail(error: string): ErrorDetail {
  const forbidden = error.match(/forbidden key '([^']+)'/);
  if (forbidden) {
    return { path: `event.action.args.${forbidden[1]}`, reason: "forbidden_key" };
  }
  const unknownTop = error.match(/unknown top-level property '([^']+)'/);
  if (unknownTop) {
    return { path: `event.${unknownTop[1]}`, reason: "additional_properties" };
  }
  const unknownActor = error.match(/unknown actor property '([^']+)'/);
  if (unknownActor) {
    return { path: `event.actor.${unknownActor[1]}`, reason: "additional_properties" };
  }
  const unknownAction = error.match(/unknown action property '([^']+)'/);
  if (unknownAction) {
    return { path: `event.action.${unknownAction[1]}`, reason: "additional_properties" };
  }
  const argField = error.match(/^action\.args\.(\S+)/);
  if (argField) {
    return { path: `event.action.args.${argField[1]}`, reason: error };
  }
  if (error === "missing source" || error === "source must be ui | agent | system") {
    return { path: "event.source", reason: error };
  }
  if (error.startsWith("action.")) {
    return { path: `event.${error.split(" ")[0]}`, reason: error };
  }
  const firstToken = error.split(" ")[0];
  if (firstToken.includes(".")) {
    return { path: `event.${firstToken}`, reason: error };
  }
  if (
    /^(schemaVersion|eventId|occurredAt|appId|source|actionType|outcome|executionState|actor|client|action|policy|conversation|mfaStatus|detectedIntent)\b/.test(
      error,
    )
  ) {
    return { path: `event.${firstToken}`, reason: error };
  }
  return { path: "event", reason: error };
}

function forbiddenArgDetails(args: unknown): ErrorDetail[] {
  const obj = asRecord(args);
  if (!obj) return [];
  const details: ErrorDetail[] = [];
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_ARG_KEYS.has(key)) {
      details.push({ path: `event.action.args.${key}`, reason: "forbidden_key" });
    }
  }
  return details;
}

function isSanitizationError(error: string): boolean {
  return SANITIZATION_ERROR_RE.test(error);
}

export function parseScoreJson(
  raw: string,
): { ok: true; value: unknown } | { ok: false; body: ErrorResponse } {
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return {
      ok: false,
      body: errorResult(
        400,
        "invalid_json",
        "Request body is not valid JSON.",
        null,
      ).body,
    };
  }
}

export function validateScoreRequest(
  parsed: unknown,
  headers: ScoreHeaders,
):
  | { ok: true; request: ScoreRequest }
  | { ok: false; status: number; body: ErrorResponse } {
  const requestId = peekRequestId(parsed);
  const obj = asRecord(parsed);
  if (!obj) {
    return errorResult(
      400,
      "missing_field",
      "ScoreRequest must be an object.",
      requestId,
      [{ path: "$", reason: "object_required" }],
    );
  }

  const extra = Object.keys(obj).filter((key) => !SCORE_REQUEST_KEYS.has(key));
  if (extra.length > 0) {
    return errorResult(
      400,
      "additional_properties",
      "Unknown top-level field.",
      requestId,
      extra.map((key) => ({ path: key, reason: "additional_properties" })),
    );
  }

  const missing: ErrorDetail[] = [];
  if (!("contractVersion" in obj)) {
    missing.push({ path: "contractVersion", reason: "required" });
  }
  if (!("requestId" in obj)) {
    missing.push({ path: "requestId", reason: "required" });
  }
  if (!("mode" in obj)) {
    missing.push({ path: "mode", reason: "required" });
  }
  if (!("event" in obj)) {
    missing.push({ path: "event", reason: "required" });
  }
  if (missing.length > 0) {
    return errorResult(
      400,
      "missing_field",
      "Required field is missing.",
      requestId,
      missing,
    );
  }

  if (typeof obj.requestId !== "string" || obj.requestId.length === 0) {
    return errorResult(
      400,
      "missing_field",
      "Required field is missing.",
      null,
      [{ path: "requestId", reason: "non_empty_string_required" }],
    );
  }
  if (obj.requestId.length > 128) {
    return errorResult(
      422,
      "event_schema_violation",
      "requestId exceeds 128 characters.",
      obj.requestId.slice(0, 128),
      [{ path: "requestId", reason: "max_length" }],
    );
  }

  // Cross-field rules (input contract §5.3). First failure wins.
  if (obj.contractVersion !== ELAH_CONTRACT_VERSION) {
    return errorResult(
      422,
      "unsupported_contract_version",
      "contractVersion must be 1.0.",
      obj.requestId,
      [{ path: "contractVersion", reason: "must_be_1.0" }],
    );
  }

  if (obj.mode !== ELAH_SCORE_MODE) {
    return errorResult(
      422,
      "unsupported_mode",
      "mode must be pre_tool.",
      obj.requestId,
      [{ path: "mode", reason: "must_be_pre_tool" }],
    );
  }

  const eventObj = asRecord(obj.event);
  if (!eventObj) {
    return errorResult(
      422,
      "event_schema_violation",
      "event is not a valid ElahEvent 1.0.",
      obj.requestId,
      [{ path: "event", reason: "object_required" }],
    );
  }

  const validated = validateElahEvent(obj.event);
  if (!validated.ok) {
    const schemaErrors = validated.errors.filter((error) => !isSanitizationError(error));
    const sanitizationErrors = validated.errors.filter(isSanitizationError);
    if (schemaErrors.length > 0) {
      return errorResult(
        422,
        "event_schema_violation",
        "event is not a valid ElahEvent 1.0.",
        obj.requestId,
        schemaErrors.map(eventErrorToDetail),
      );
    }
    const details = [
      ...sanitizationErrors.map(eventErrorToDetail),
      ...forbiddenArgDetails(eventObj.action && asRecord(eventObj.action)?.args),
    ];
    return errorResult(
      422,
      "sanitization_failed",
      "Forbidden or unredacted fields in event.action.args.",
      obj.requestId,
      details.length > 0
        ? details
        : [{ path: "event.action.args", reason: "sanitization_failed" }],
    );
  }

  const action = asRecord(eventObj.action);
  const forbidden = forbiddenArgDetails(action?.args);
  if (forbidden.length > 0) {
    return errorResult(
      422,
      "sanitization_failed",
      "Forbidden or unredacted fields in event.action.args.",
      obj.requestId,
      forbidden,
    );
  }

  const executionState = eventObj.executionState;
  if (executionState !== "pre_tool" && executionState !== "no_tool") {
    return errorResult(
      422,
      "wrong_execution_state",
      "POST /v1/score does not accept post_tool events.",
      obj.requestId,
      [{ path: "event.executionState", reason: "must_be_pre_tool_or_no_tool" }],
    );
  }

  const appHeader = getHeader(headers, "X-Elah-App-Id");
  if (appHeader != null && appHeader !== eventObj.appId) {
    return errorResult(
      422,
      "app_id_mismatch",
      "X-Elah-App-Id does not match event.appId.",
      obj.requestId,
      [{ path: "X-Elah-App-Id", reason: "must_equal_event.appId" }],
    );
  }

  const idempotencyKey = getHeader(headers, "Idempotency-Key");
  if (idempotencyKey != null && idempotencyKey !== obj.requestId) {
    return errorResult(
      422,
      "event_schema_violation",
      "Idempotency-Key must equal requestId.",
      obj.requestId,
      [{ path: "Idempotency-Key", reason: "must_equal_requestId" }],
    );
  }

  return {
    ok: true,
    request: {
      contractVersion: ELAH_CONTRACT_VERSION,
      requestId: obj.requestId,
      mode: ELAH_SCORE_MODE,
      event: obj.event as ElahEvent,
    },
  };
}
