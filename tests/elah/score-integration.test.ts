import { describe, expect, it } from "vitest";
import {
  asScore,
  authHeaders,
  elahEventSample,
  errorCode,
  invokeHandleScore,
  nextRequestId,
  SCORE_RESPONSE_KEYS,
} from "./fixtures";

describe("handleScore integration", () => {
  it("returns 200 for a valid ScoreRequest wrapping sample 8.1", async () => {
    const event = elahEventSample("8.1");
    const request = {
      contractVersion: "1.0",
      requestId: nextRequestId("req_01JEXAMPLE_SCORE"),
      mode: "pre_tool",
      event,
    };
    const { status, body } = await invokeHandleScore(
      authHeaders(),
      JSON.stringify(request),
    );
    expect(status).toBe(200);
    const rec = body as Record<string, unknown>;
    expect(rec.contractVersion).toBe("1.0");
    expect(rec.requestId).toBe(request.requestId);
    expect(rec.eventId).toBe(event.eventId);
    expect(["scored", "abstained"]).toContain(rec.status);
    expect(typeof rec.scoredAt).toBe("string");
    expect(rec.scoredAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
    const score = asScore(body);
    expect(score.intentLabel).toBe("external_transfer");
    expect(score.elahScore).toBeGreaterThanOrEqual(0.75);
    for (const key of SCORE_RESPONSE_KEYS) {
      expect(rec).toHaveProperty(key);
    }
  });

  it("replays the same requestId+body with the same scoredAt", async () => {
    const event = elahEventSample("8.1");
    const request = {
      contractVersion: "1.0",
      requestId: nextRequestId("req_replay"),
      mode: "pre_tool" as const,
      event,
    };
    const rawBody = JSON.stringify(request);
    const first = await invokeHandleScore(authHeaders(), rawBody);
    const second = await invokeHandleScore(authHeaders(), rawBody);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const firstBody = first.body as { scoredAt: string; requestId: string };
    const secondBody = second.body as { scoredAt: string; requestId: string };
    expect(secondBody.scoredAt).toBe(firstBody.scoredAt);
    expect(secondBody.requestId).toBe(request.requestId);
  });

  it("returns 409 when the same requestId is reused with a different body", async () => {
    const requestId = nextRequestId("req_conflict");
    const firstEvent = elahEventSample("8.1");
    const secondEvent = { ...elahEventSample("8.1"), eventId: "evt_01JEXAMPLE_DIFFERENT01" };
    const first = await invokeHandleScore(
      authHeaders(),
      JSON.stringify({
        contractVersion: "1.0",
        requestId,
        mode: "pre_tool",
        event: firstEvent,
      }),
    );
    expect(first.status).toBe(200);
    const second = await invokeHandleScore(
      authHeaders(),
      JSON.stringify({
        contractVersion: "1.0",
        requestId,
        mode: "pre_tool",
        event: secondEvent,
      }),
    );
    expect(second.status).toBe(409);
    expect(errorCode(second.body)).toBe("idempotency_conflict");
  });

  it("returns 401 when Authorization is omitted", async () => {
    const request = {
      contractVersion: "1.0",
      requestId: nextRequestId("req_unauth"),
      mode: "pre_tool",
      event: elahEventSample("8.1"),
    };
    const { status, body } = await invokeHandleScore(
      authHeaders({}, { token: null }),
      JSON.stringify(request),
    );
    expect(status).toBe(401);
    expect(errorCode(body)).toBe("unauthorized");
  });
});
