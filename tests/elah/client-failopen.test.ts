import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scoreElahEvent } from "@/lib/elah/client";
import { transferEvent } from "./fixtures";

describe("scoreElahEvent fail-open", () => {
  beforeEach(() => {
    process.env.ELAH_SERVICE_URL = "http://elah.test";
  });

  afterEach(() => {
    delete process.env.ELAH_SERVICE_URL;
    vi.unstubAllGlobals();
  });

  it("returns unavailable timeout and does not throw when fetch hangs past 250ms", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    const started = Date.now();
    const result = await scoreElahEvent(transferEvent());
    const elapsed = Date.now() - started;
    expect(result.kind).toBe("unavailable");
    expect(result.reason).toBe("timeout");
    expect(elapsed).toBeGreaterThanOrEqual(200);
    expect(elapsed).toBeLessThan(5_000);
  });

  it("returns unavailable when the scorer responds 503", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            contractVersion: "1.0",
            requestId: "req_503",
            error: { code: "unavailable", message: "scorer unavailable" },
          }),
          { status: 503, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    const result = await scoreElahEvent(transferEvent());
    expect(result.kind).toBe("unavailable");
    expect(result.reason).toBe("unavailable");
  });

  it("never throws out of scoreElahEvent on a hanging scorer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    await expect(scoreElahEvent(transferEvent())).resolves.toMatchObject({
      kind: "unavailable",
    });
  });
});
