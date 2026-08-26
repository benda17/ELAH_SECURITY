import "server-only";
import { randomUUID } from "node:crypto";
import {
  handleScore,
  type ErrorResponse,
  type ScoreResponse,
} from "@/lib/elah/service";
import type { ElahEvent } from "./envelope";

export type ScoreUnavailableReason =
  | "timeout"
  | "unavailable"
  | "misconfigured"
  | "producer_error";

export type ScoreElahResult =
  | {
      kind: "scored";
      response: ScoreResponse;
      requestId: string;
      latencyMs: number;
    }
  | {
      kind: "unavailable";
      reason: ScoreUnavailableReason;
      requestId: string;
      latencyMs: number;
      httpStatus?: number;
      errorCode?: string;
    };

const DEFAULT_SCORE_TIMEOUT_MS = 250;
const SCORE_CONTRACT_VERSION = "1.0";
const SCORE_MODE = "pre_tool";

function scoreTimeoutMs(): number {
  const raw = process.env.ELAH_SCORE_TIMEOUT_MS;
  if (raw == null || raw.trim() === "") return DEFAULT_SCORE_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SCORE_TIMEOUT_MS;
  return parsed;
}

function serviceUrl(): string | null {
  const raw = process.env.ELAH_SERVICE_URL;
  if (raw == null || raw.trim() === "") return null;
  return raw.trim().replace(/\/$/, "");
}

function scoreEndpoint(base: string): string {
  return base.endsWith("/v1/score") ? base : `${base}/v1/score`;
}

function newRequestId(): string {
  return `req_${randomUUID()}`;
}

function headerRecord(event: ElahEvent, requestId: string): Record<string, string> {
  const token = process.env.ELAH_SERVICE_TOKEN ?? "";
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Idempotency-Key": requestId,
    "X-Elah-App-Id": event.appId,
  };
}

function scoreRequestBody(event: ElahEvent, requestId: string): string {
  return JSON.stringify({
    contractVersion: SCORE_CONTRACT_VERSION,
    requestId,
    mode: SCORE_MODE,
    event,
  });
}

function errorCodeFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const error = (body as ErrorResponse).error;
  if (!error || typeof error !== "object") return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}

function asScoreResponse(body: unknown): ScoreResponse | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Partial<ScoreResponse>;
  if (obj.contractVersion !== SCORE_CONTRACT_VERSION) return null;
  if (typeof obj.requestId !== "string" || !obj.requestId) return null;
  if (typeof obj.eventId !== "string" || !obj.eventId) return null;
  if (obj.status !== "scored" && obj.status !== "abstained") return null;
  if (!obj.score || typeof obj.score !== "object") return null;
  if (typeof obj.score.elahScore !== "number") return null;
  return obj as ScoreResponse;
}

function unavailableFromStatus(
  status: number,
  body: unknown,
  requestId: string,
  latencyMs: number,
): ScoreElahResult {
  if (status === 401 || status === 403) {
    return {
      kind: "unavailable",
      reason: "misconfigured",
      requestId,
      latencyMs,
      httpStatus: status,
      errorCode: errorCodeFromBody(body),
    };
  }
  if (status === 500 || status === 503) {
    return {
      kind: "unavailable",
      reason: "unavailable",
      requestId,
      latencyMs,
      httpStatus: status,
      errorCode: errorCodeFromBody(body),
    };
  }
  if (status >= 400 && status < 500) {
    return {
      kind: "unavailable",
      reason: "producer_error",
      requestId,
      latencyMs,
      httpStatus: status,
      errorCode: errorCodeFromBody(body),
    };
  }
  return {
    kind: "unavailable",
    reason: "unavailable",
    requestId,
    latencyMs,
    httpStatus: status,
    errorCode: errorCodeFromBody(body),
  };
}

async function parseResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function resultFromHttp(
  status: number,
  body: unknown,
  requestId: string,
  latencyMs: number,
): ScoreElahResult {
  if (status === 200) {
    const response = asScoreResponse(body);
    if (response) {
      return { kind: "scored", response, requestId: response.requestId, latencyMs };
    }
    return {
      kind: "unavailable",
      reason: "unavailable",
      requestId,
      latencyMs,
      httpStatus: status,
      errorCode: "score_invalid",
    };
  }
  return unavailableFromStatus(status, body, requestId, latencyMs);
}

class ScoreTimeoutError extends Error {
  constructor() {
    super("ELAH score timeout");
    this.name = "ScoreTimeoutError";
  }
}

async function raceTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ScoreTimeoutError()), timeoutMs);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function scoreInProcess(
  event: ElahEvent,
  requestId: string,
  timeoutMs: number,
): Promise<{ status: number; body: unknown }> {
  const rawBody = scoreRequestBody(event, requestId);
  const headers = headerRecord(event, requestId);
  const work = handleScore(headers, rawBody);
  void work.catch(() => undefined);
  return raceTimeout(work, timeoutMs);
}

async function scoreViaFetch(
  event: ElahEvent,
  requestId: string,
  timeoutMs: number,
  baseUrl: string,
): Promise<{ status: number; body: unknown }> {
    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), timeoutMs);
    const work = fetch(scoreEndpoint(baseUrl), {
      method: "POST",
      headers: headerRecord(event, requestId),
      body: scoreRequestBody(event, requestId),
      signal: controller.signal,
      credentials: "omit",
    });
    void work.catch(() => undefined);
    try {
      const res = await raceTimeout(work, timeoutMs);
      const body = await parseResponseBody(res);
      return { status: res.status, body };
    } catch (err) {
      if (!controller.signal.aborted) controller.abort();
      throw err;
    } finally {
      clearTimeout(abortTimer);
    }
}

/**
 * Score one ElahEvent. Never throws. Timeout / 5xx / auth defects
 * return `unavailable` so bank policy still runs.
 */
export async function scoreElahEvent(event: ElahEvent): Promise<ScoreElahResult> {
  const requestId = newRequestId();
  const started = Date.now();
  const timeoutMs = scoreTimeoutMs();
  try {
    const url = serviceUrl();
    const { status, body } =
      url == null
        ? await scoreInProcess(event, requestId, timeoutMs)
        : await scoreViaFetch(event, requestId, timeoutMs, url);
    return resultFromHttp(status, body, requestId, Date.now() - started);
  } catch (err) {
    const latencyMs = Date.now() - started;
    const errName =
      err && typeof err === "object" && "name" in err
        ? String((err as { name: unknown }).name)
        : "";
    const aborted =
      err instanceof ScoreTimeoutError ||
      errName === "AbortError" ||
      errName === "TimeoutError" ||
      errName === "ScoreTimeoutError";
    if (aborted) {
      return { kind: "unavailable", reason: "timeout", requestId, latencyMs };
    }
    return {
      kind: "unavailable",
      reason: "unavailable",
      requestId,
      latencyMs,
    };
  }
}
