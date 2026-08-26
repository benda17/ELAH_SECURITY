import { describe, expect, it } from "vitest";
import {
  authHeaders,
  errorCode,
  invokeHandleScore,
  nextRequestId,
  transferEvent,
  wrapScoreRequest,
} from "./fixtures";

describe("POST /v1/score request validation", () => {
  it("rejects invalid JSON with 400 invalid_json", async () => {
    const { status, body } = await invokeHandleScore(authHeaders(), "{not-json");
    expect(status).toBe(400);
    expect(errorCode(body)).toBe("invalid_json");
  });

  it("rejects an extra top-level key with 400 additional_properties", async () => {
    const request = {
      ...wrapScoreRequest(transferEvent()),
      elahScore: 0.5,
    };
    const { status, body } = await invokeHandleScore(
      authHeaders(),
      JSON.stringify(request),
    );
    expect(status).toBe(400);
    expect(errorCode(body)).toBe("additional_properties");
  });

  it("rejects a bad contractVersion with 422 unsupported_contract_version", async () => {
    const request = wrapScoreRequest(transferEvent(), { contractVersion: "9.9" });
    const { status, body } = await invokeHandleScore(
      authHeaders(),
      JSON.stringify(request),
    );
    expect(status).toBe(422);
    expect(errorCode(body)).toBe("unsupported_contract_version");
  });

  it("rejects mode other than pre_tool with 422 unsupported_mode", async () => {
    const request = wrapScoreRequest(transferEvent(), { mode: "batch_train" });
    const { status, body } = await invokeHandleScore(
      authHeaders(),
      JSON.stringify(request),
    );
    expect(status).toBe(422);
    expect(errorCode(body)).toBe("unsupported_mode");
  });

  it("rejects post_tool executionState with 422 wrong_execution_state", async () => {
    const event = transferEvent();
    event.executionState = "post_tool";
    const request = wrapScoreRequest(event);
    const { status, body } = await invokeHandleScore(
      authHeaders(),
      JSON.stringify(request),
    );
    expect(status).toBe(422);
    expect(errorCode(body)).toBe("wrong_execution_state");
  });

  it("rejects an oversize body with 413 payload_too_large", async () => {
    const rawBody = "x".repeat(32769);
    const { status, body } = await invokeHandleScore(
      authHeaders({
        "content-length": String(rawBody.length),
        "Content-Length": String(rawBody.length),
      }),
      rawBody,
    );
    expect(status).toBe(413);
    expect(errorCode(body)).toBe("payload_too_large");
  });

  it("rejects a missing bearer token with 401 unauthorized", async () => {
    const request = wrapScoreRequest(transferEvent(), {
      requestId: nextRequestId("req_no_bearer"),
    });
    const { status, body } = await invokeHandleScore(
      authHeaders({}, { token: null }),
      JSON.stringify(request),
    );
    expect(status).toBe(401);
    expect(errorCode(body)).toBe("unauthorized");
  });
});
