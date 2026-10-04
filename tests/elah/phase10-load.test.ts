import { describe, expect, it } from "vitest";
import { scoreElahEvent } from "@/lib/elah/baseline";
import { injectionEvent, transferEvent } from "./fixtures";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx]!;
}

describe("Phase 10 in-process load (not HTTP)", () => {
  it("keeps extract+predict p95 well under the 250 ms client ceiling", () => {
    const events = [transferEvent(), injectionEvent()];
    for (const event of events) scoreElahEvent(event);

    const samples: number[] = [];
    const iterations = 200;
    for (let i = 0; i < iterations; i++) {
      const event = events[i % events.length]!;
      const t0 = performance.now();
      scoreElahEvent(event);
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    const p50 = percentile(samples, 50);
    const p95 = percentile(samples, 95);
    expect(p50).toBeLessThan(80);
    expect(p95).toBeLessThan(200);
    expect(p95).toBeLessThan(250);
  });
});
