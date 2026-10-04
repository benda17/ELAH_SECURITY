import { describe, expect, it } from "vitest";
import {
  DEFAULT_DISPLAY_THRESHOLDS,
  bandForScore,
  validateThresholds,
} from "@/lib/elah/analyst/bands";
import { scoreElahEvent } from "@/lib/elah/baseline";
import { injectionEvent, transferEvent } from "./fixtures";

describe("Phase 10 threshold separation", () => {
  it("keeps stored elahScore identical when display bands change", () => {
    const transfer = scoreElahEvent(transferEvent()).score;
    const injection = scoreElahEvent(injectionEvent()).score;
    const tight = validateThresholds({ reviewBelow: 0.9, watchBelow: 0.95 });
    expect(tight.ok).toBe(true);
    if (!tight.ok) return;

    expect(bandForScore(transfer.elahScore, DEFAULT_DISPLAY_THRESHOLDS)).not.toBe(
      bandForScore(transfer.elahScore, tight.value),
    );
    expect(scoreElahEvent(transferEvent()).score.elahScore).toBe(transfer.elahScore);
    expect(scoreElahEvent(injectionEvent()).score.elahScore).toBe(injection.elahScore);
    expect(scoreElahEvent(transferEvent()).score.intentLabel).toBe(transfer.intentLabel);
  });

  it("does not feed display thresholds into the scorer module", () => {
    expect(bandForScore(0.87, { reviewBelow: 0.4, watchBelow: 0.7 })).toBe("clear");
    expect(bandForScore(0.87, { reviewBelow: 0.9, watchBelow: 0.95 })).toBe("review");
    expect(scoreElahEvent(transferEvent()).score.elahScore).toBe(0.87);
  });
});
