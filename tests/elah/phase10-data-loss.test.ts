import { describe, expect, it } from "vitest";
import { envelopeForDisplay } from "@/lib/elah/admin-events";
import { asScore, scoreValidEvent, transferEvent } from "./fixtures";

describe("Phase 10 data-loss / envelope isolation", () => {
  it("strips elahScore from envelope JSON used for display", () => {
    const event = transferEvent() as ReturnType<typeof transferEvent> & {
      elahScore?: number;
      elahScoreLabel?: number;
    };
    event.elahScore = 0.87;
    event.elahScoreLabel = 0.87;
    const display = envelopeForDisplay(event);
    expect("elahScore" in display).toBe(false);
    expect("elahScoreLabel" in display).toBe(false);
  });

  it("keeps ScoreResponse score off the request envelope keys", async () => {
    const { body } = await scoreValidEvent(transferEvent());
    expect(body).not.toHaveProperty("elahScore");
    expect(body).not.toHaveProperty("policyHook");
    expect(asScore(body).elahScore).toEqual(expect.any(Number));
  });
});
