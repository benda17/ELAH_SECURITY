import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getHealth,
  getVersion,
  handleScore,
  resetIdempotencyStore,
  type ErrorResponse,
  type ScoreResponse,
} from "@/lib/elah/service";

const TOKEN = "test-elah-service-token";

const samples = JSON.parse(
  readFileSync(
    path.join(__dirname, "../events/fixtures/elah-event-samples.json"),
    "utf8",
  ),
) as Record<string, unknown>;

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function scoreBody(event: unknown, requestId = "req_01JEXAMPLE_SCORE_001") {
  return {
    contractVersion: "1.0",
    requestId,
    mode: "pre_tool",
    event,
  };
}

async function post(body: unknown, headers?: Record<string, string>) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return handleScore(headers ?? authHeaders(), raw);
}

describe("ELAH scoring service", () => {
  beforeEach(() => {
    process.env.ELAH_SERVICE_TOKEN = TOKEN;
    resetIdempotencyStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GET health is unauthenticated", () => {
    expect(getHealth()).toEqual({ status: "ok", service: "elah-scorer" });
  });

  it("GET version reports contract 1.0 / rules_v0 / 0.3.0", () => {
    expect(getVersion()).toEqual({
      contractVersion: "1.0",
      scorer: "rules_v0",
      serviceVersion: "0.3.0",
    });
  });

  it("rejects missing bearer with 401 unauthorized and null requestId", async () => {
    const result = await post(scoreBody(samples["8.1"]), { "Content-Type": "application/json" });
    expect(result.status).toBe(401);
    const body = result.body as ErrorResponse;
    expect(body.requestId).toBeNull();
    expect(body.error.code).toBe("unauthorized");
    expect(body.error.message).not.toContain(TOKEN);
    expect(body.error.message).not.toMatch(/utterance/i);
  });

  it("rejects invalid bearer with 401", async () => {
    const result = await post(scoreBody(samples["8.1"]), {
      Authorization: "Bearer wrong-token",
    });
    expect(result.status).toBe(401);
    expect((result.body as ErrorResponse).error.code).toBe("unauthorized");
  });

  it("rejects oversized Content-Length with 413", async () => {
    const result = await handleScore(
      authHeaders({ "Content-Length": "32769" }),
      "{}",
    );
    expect(result.status).toBe(413);
    expect((result.body as ErrorResponse).error.code).toBe("payload_too_large");
  });

  it("rejects oversized raw body with 413", async () => {
    const raw = "x".repeat(32769);
    const result = await handleScore(authHeaders(), raw);
    expect(result.status).toBe(413);
    expect((result.body as ErrorResponse).error.code).toBe("payload_too_large");
  });

  it("rejects invalid JSON with 400", async () => {
    const result = await handleScore(authHeaders(), "{not json");
    expect(result.status).toBe(400);
    expect((result.body as ErrorResponse).error.code).toBe("invalid_json");
    expect((result.body as ErrorResponse).requestId).toBeNull();
  });

  it("rejects extra wrapper fields with 400 additional_properties", async () => {
    const result = await post({
      ...scoreBody(samples["8.1"]),
      elahScore: 0.5,
    });
    expect(result.status).toBe(400);
    expect((result.body as ErrorResponse).error.code).toBe("additional_properties");
  });

  it("rejects missing wrapper fields with 400 missing_field", async () => {
    const result = await post({
      contractVersion: "1.0",
      requestId: "req_missing_mode",
      event: samples["8.1"],
    });
    expect(result.status).toBe(400);
    expect((result.body as ErrorResponse).error.code).toBe("missing_field");
  });

  it("rejects unsupported contractVersion with 422", async () => {
    const result = await post({ ...scoreBody(samples["8.1"]), contractVersion: "2.0" });
    expect(result.status).toBe(422);
    expect((result.body as ErrorResponse).error.code).toBe(
      "unsupported_contract_version",
    );
  });

  it("rejects unsupported mode with 422", async () => {
    const result = await post({ ...scoreBody(samples["8.1"]), mode: "batch_train" });
    expect(result.status).toBe(422);
    expect((result.body as ErrorResponse).error.code).toBe("unsupported_mode");
  });

  it("rejects invalid ElahEvent with 422 event_schema_violation", async () => {
    const result = await post(scoreBody(samples["8.6"]));
    expect(result.status).toBe(422);
    const body = result.body as ErrorResponse;
    expect(body.error.code).toBe("event_schema_violation");
    expect(body.error.details?.[0]?.path).toBe("event.source");
  });

  it("rejects unsanitized args with 422 sanitization_failed", async () => {
    const result = await post(scoreBody(samples["8.7"]));
    expect(result.status).toBe(422);
    const body = result.body as ErrorResponse;
    expect(body.error.code).toBe("sanitization_failed");
    expect(
      body.error.details?.some((d) => d.path === "event.action.args.userId"),
    ).toBe(true);
  });

  it("rejects post_tool with 422 wrong_execution_state", async () => {
    const event = { ...(samples["8.1"] as object), executionState: "post_tool" };
    const result = await post(scoreBody(event));
    expect(result.status).toBe(422);
    expect((result.body as ErrorResponse).error.code).toBe("wrong_execution_state");
  });

  it("rejects X-Elah-App-Id mismatch with 422", async () => {
    const result = await post(scoreBody(samples["8.1"]), authHeaders({
      "X-Elah-App-Id": "other-app",
    }));
    expect(result.status).toBe(422);
    expect((result.body as ErrorResponse).error.code).toBe("app_id_mismatch");
  });

  it("rejects Idempotency-Key mismatch with 422 and details path", async () => {
    const result = await post(
      scoreBody(samples["8.1"], "req_01JEXAMPLE_SCORE_001"),
      authHeaders({ "Idempotency-Key": "req_other" }),
    );
    expect(result.status).toBe(422);
    const body = result.body as ErrorResponse;
    expect(body.error.code).toBe("event_schema_violation");
    expect(body.error.details?.[0]?.path).toBe("Idempotency-Key");
  });

  it("rejects a valid token for a foreign appId with 403", async () => {
    const event = { ...(samples["8.4"] as object), appId: "other-tenant" };
    const result = await post(scoreBody(event, "req_forbidden_app"));
    expect(result.status).toBe(403);
    expect((result.body as ErrorResponse).error.code).toBe("forbidden_app");
  });

  it("scores P0 external transfer with watch (not allow/deny)", async () => {
    const result = await post(scoreBody(samples["8.1"]));
    expect(result.status).toBe(200);
    const body = result.body as ScoreResponse;
    expect(Object.keys(body).sort()).toEqual(
      ["contractVersion", "eventId", "requestId", "score", "scoredAt", "status"].sort(),
    );
    expect(body.status).toBe("scored");
    expect(body.eventId).toBe("evt_01JEXAMPLE000000000000001");
    expect(body.score.elahScore).toBe(0.87);
    expect(body.score.confidence).toBe(0.82);
    expect(body.score.uncertainty).toBe(0.18);
    expect(body.score.intentLabel).toBe("external_transfer");
    expect(body.score.coordinates).toEqual({
      humanAgency: 0.72,
      financialRisk: 0.78,
      emotionalUrgency: 0.35,
    });
    expect(body.score.policyHook.recommendation).toBe("watch");
    expect(body.score.policyHook.recommendation).not.toMatch(
      /allow|deny|block|confirm/,
    );
    expect(body.score.provenance).toEqual({
      scorer: "rules_v0",
      modelVersion: null,
      labelSource: "rules_v0",
    });
    expect(body.scoredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(JSON.stringify(body)).not.toContain("Send 500 shekels to Daniel");
  });

  it("scores prompt injection low with review", async () => {
    const result = await post(scoreBody(samples["8.3"], "req_01JEXAMPLE_SCORE_002"));
    expect(result.status).toBe(200);
    const body = result.body as ScoreResponse;
    expect(body.status).toBe("scored");
    expect(body.score.elahScore).toBe(0.08);
    expect(body.score.confidence).toBe(0.91);
    expect(body.score.uncertainty).toBe(0.09);
    expect(body.score.intentLabel).toBe("prompt_injection_or_policy_bypass");
    expect(body.score.policyHook.recommendation).toBe("review");
    expect(body.score.coordinates).toEqual({
      humanAgency: 0.15,
      financialRisk: 0.92,
      emotionalUrgency: 0.25,
    });
  });

  it("scores statement download", async () => {
    const result = await post(scoreBody(samples["8.2"], "req_statement"));
    expect(result.status).toBe(200);
    const body = result.body as ScoreResponse;
    expect(body.score.elahScore).toBe(0.81);
    expect(body.score.confidence).toBe(0.88);
    expect(body.score.uncertainty).toBe(0.12);
    expect(body.score.intentLabel).toBe("statement_download");
    expect(body.score.policyHook.recommendation).toBe("none");
  });

  it("abstains on ambiguous_banking_request when confidence < 0.40", async () => {
    const event = {
      ...(samples["8.1"] as object),
      eventId: "evt_01JEXAMPLE000000000000010",
      actionType: "internal_transfer",
      detectedIntent: "ambiguous_banking_request",
      action: {
        ...(samples["8.1"] as { action: object }).action,
        toolName: null,
        args: {},
        amount: null,
        currency: null,
        amountBucket: "none",
        recipientType: "none",
      },
    };
    const result = await post(scoreBody(event, "req_ambiguous"));
    expect(result.status).toBe(200);
    const body = result.body as ScoreResponse;
    expect(body.status).toBe("abstained");
    expect(body.score.elahScore).toBe(0.48);
    expect(body.score.confidence).toBe(0.35);
    expect(body.score.uncertainty).toBe(0.65);
    expect(body.score.intentLabel).toBe("ambiguous_banking_request");
  });

  it("replays the same requestId + body with the original scoredAt", async () => {
    const first = await post(scoreBody(samples["8.1"]));
    const second = await post(scoreBody(samples["8.1"]));
    expect(second.status).toBe(200);
    expect((second.body as ScoreResponse).scoredAt).toBe((first.body as ScoreResponse).scoredAt);
    expect((second.body as ScoreResponse).score).toEqual((first.body as ScoreResponse).score);
  });

  it("conflicts when the same requestId is reused with a different body", async () => {
    await post(scoreBody(samples["8.1"], "req_conflict"));
    const result = await post(scoreBody(samples["8.2"], "req_conflict"));
    expect(result.status).toBe(409);
    expect((result.body as ErrorResponse).error.code).toBe("idempotency_conflict");
  });

  it("returns the original score for a new requestId on the same eventId+mode", async () => {
    const first = await post(scoreBody(samples["8.1"], "req_original"));
    const second = await post(scoreBody(samples["8.1"], "req_retry"));
    expect(second.status).toBe(200);
    expect((second.body as ScoreResponse).requestId).toBe("req_retry");
    expect((second.body as ScoreResponse).scoredAt).toBe(
      (first.body as ScoreResponse).scoredAt,
    );
    expect((second.body as ScoreResponse).score).toEqual(
      (first.body as ScoreResponse).score,
    );
  });

  it("does not log utterance, args, or Authorization", async () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    await post(scoreBody(samples["8.1"]));
    expect(spy).toHaveBeenCalledTimes(1);
    const line = String(spy.mock.calls[0]?.[0]);
    expect(line).not.toContain("Send 500 shekels to Daniel");
    expect(line).not.toContain(TOKEN);
    expect(line).not.toContain("recipientName");
    const payload = JSON.parse(line) as Record<string, unknown>;
    expect(payload).toMatchObject({
      requestId: "req_01JEXAMPLE_SCORE_001",
      eventId: "evt_01JEXAMPLE000000000000001",
      mode: "pre_tool",
      appId: "elah-banking-demo",
      source: "agent",
      actionType: "external_transfer",
      httpStatus: 200,
      scorer: "rules_v0",
    });
    expect(typeof payload.latencyMs).toBe("number");
  });
});
