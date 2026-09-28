import { describe, expect, it } from "vitest";
import {
  hasAnalystOnlyFilters,
  matchesAnalystFilters,
  parseAnalystFilters,
  resolveDateRange,
  serializeAnalystFilters,
  type AnalystEventFilters,
} from "@/lib/elah/analyst/filters";
import { makeRow, scored } from "./analyst-helpers";

const FULL: AnalystEventFilters = {
  q: "daniel",
  preset: "24h",
  from: "2026-09-27T00:00:00.000Z",
  to: "2026-09-28T00:00:00.000Z",
  userIdHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
  sessionId: "sess-analyst-1",
  source: "agent",
  actionType: "external_transfer",
  toolName: "create_external_transfer",
  channel: "agent",
  outcome: "pending_confirmation",
  quality: "ok",
  modelVersion: "rules_v0",
  scoreMin: 0.1,
  scoreMax: 0.9,
  confidenceMin: 0.5,
  intentLabel: "external_transfer",
  reviewStatus: "in_review",
  outcomeMark: "fp_or_fn",
  band: "watch",
  limit: 250,
};

describe("parseAnalystFilters / serializeAnalystFilters", () => {
  it("round-trips every filter", () => {
    const query = serializeAnalystFilters(FULL);
    expect(parseAnalystFilters(query)).toEqual(FULL);
    expect(parseAnalystFilters(new URLSearchParams(query))).toEqual(FULL);
    expect(serializeAnalystFilters(parseAnalystFilters(`?${query}`))).toBe(query);
  });

  it("accepts Next.js searchParams records (first array value wins)", () => {
    expect(
      parseAnalystFilters({ source: ["ui", "agent"], actionType: "login", junk: "x" }),
    ).toEqual({ source: "ui", actionType: "login" });
  });

  it("drops junk, 'all', and out-of-range values", () => {
    const parsed = parseAnalystFilters({
      q: "   ",
      preset: "2y",
      from: "not-a-date",
      source: "all",
      actionType: "dashboard_view",
      toolName: "rm_rf",
      channel: "fax",
      outcome: "maybe",
      quality: "great",
      modelVersion: "<script>",
      scoreMin: "-1",
      scoreMax: "abc",
      confidenceMin: "2",
      intentLabel: "steal_money",
      reviewStatus: "done",
      outcomeMark: "true_negative",
      band: "red",
      limit: "-5",
      userIdHash: "short",
      sessionId: "bad id with spaces",
    });
    expect(parsed).toEqual({});
  });

  it("clamps limit, swaps inverted ranges, and normalizes dates", () => {
    const parsed = parseAnalystFilters(
      "limit=99999&scoreMin=0.9&scoreMax=0.2&from=2026-09-28&to=2026-09-01T00:00:00Z",
    );
    expect(parsed.limit).toBe(1000);
    expect(parsed.scoreMin).toBe(0.2);
    expect(parsed.scoreMax).toBe(0.9);
    expect(parsed.from).toBe("2026-09-01T00:00:00.000Z");
    expect(parsed.to).toBe("2026-09-28T00:00:00.000Z");
  });

  it("truncates long free-text search", () => {
    expect(parseAnalystFilters({ q: "x".repeat(500) }).q).toHaveLength(200);
  });

  it("serializes nothing for empty filters", () => {
    expect(serializeAnalystFilters({})).toBe("");
  });
});

describe("resolveDateRange", () => {
  const now = new Date("2026-09-28T12:00:00.000Z");

  it("applies presets relative to now", () => {
    expect(resolveDateRange({ preset: "1h" }, now).from?.toISOString()).toBe(
      "2026-09-28T11:00:00.000Z",
    );
    expect(resolveDateRange({ preset: "7d" }, now).from?.toISOString()).toBe(
      "2026-09-21T12:00:00.000Z",
    );
  });

  it("lets an explicit from win over the preset", () => {
    const range = resolveDateRange({ preset: "1h", from: "2026-09-01T00:00:00.000Z" }, now);
    expect(range.from?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(range.to).toBeNull();
  });
});

describe("matchesAnalystFilters", () => {
  it("searches eventId, userIdHash, utterance, and toolName case-insensitively", () => {
    const row = makeRow();
    expect(matchesAnalystFilters(row, { q: "DANIEL" })).toBe(true);
    expect(matchesAnalystFilters(row, { q: "evt_analyst" })).toBe(true);
    expect(matchesAnalystFilters(row, { q: "a1b2c3d4" })).toBe(true);
    expect(matchesAnalystFilters(row, { q: "external_transfer" })).toBe(true);
    expect(matchesAnalystFilters(row, { q: "nothing-here" })).toBe(false);
  });

  it("filters by score range, confidence, band, and model version", () => {
    const row = makeRow({ score: scored(0.55, { provenanceModelVersion: "hybrid-2026.09" }) });
    expect(row.band).toBe("watch");
    expect(matchesAnalystFilters(row, { scoreMin: 0.5, scoreMax: 0.6 })).toBe(true);
    expect(matchesAnalystFilters(row, { scoreMin: 0.6 })).toBe(false);
    expect(matchesAnalystFilters(row, { confidenceMin: 0.9 })).toBe(false);
    expect(matchesAnalystFilters(row, { band: "watch" })).toBe(true);
    expect(matchesAnalystFilters(row, { modelVersion: "hybrid-2026.09" })).toBe(true);
    expect(matchesAnalystFilters(row, { modelVersion: "rules_v0" })).toBe(true);
    expect(matchesAnalystFilters(row, { modelVersion: "other" })).toBe(false);
  });

  it("excludes unscored rows from score filters", () => {
    const row = makeRow({ score: null });
    expect(row.band).toBe("unscored");
    expect(matchesAnalystFilters(row, { scoreMax: 1 })).toBe(false);
    expect(matchesAnalystFilters(row, { band: "unscored" })).toBe(true);
  });

  it("filters by review status and outcome marks", () => {
    const fp = makeRow({ review: { reviewStatus: "reviewed", outcomeMark: "false_positive" } });
    const none = makeRow();
    expect(matchesAnalystFilters(fp, { reviewStatus: "reviewed" })).toBe(true);
    expect(matchesAnalystFilters(none, { reviewStatus: "unreviewed" })).toBe(true);
    expect(matchesAnalystFilters(fp, { outcomeMark: "fp_or_fn" })).toBe(true);
    expect(matchesAnalystFilters(none, { outcomeMark: "fp_or_fn" })).toBe(false);
    expect(matchesAnalystFilters(none, { outcomeMark: "unmarked" })).toBe(true);
    expect(matchesAnalystFilters(fp, { outcomeMark: "false_negative" })).toBe(false);
  });

  it("splits agent vs UI channel", () => {
    const agent = makeRow();
    const ui = makeRow({ event: { source: "ui", conversation: undefined } });
    expect(matchesAnalystFilters(agent, { channel: "agent" })).toBe(true);
    expect(matchesAnalystFilters(agent, { channel: "ui" })).toBe(false);
    expect(matchesAnalystFilters(ui, { channel: "ui" })).toBe(true);
  });

  it("applies date range on occurredAt", () => {
    const row = makeRow();
    expect(
      matchesAnalystFilters(row, { from: "2026-09-28T06:00:00.000Z", to: "2026-09-28T08:00:00.000Z" }),
    ).toBe(true);
    expect(matchesAnalystFilters(row, { from: "2026-09-28T07:30:00.000Z" })).toBe(false);
  });

  it("knows which filters need the analyst join", () => {
    expect(hasAnalystOnlyFilters({ source: "ui", actionType: "login", preset: "24h" })).toBe(false);
    expect(hasAnalystOnlyFilters({ channel: "agent" })).toBe(false);
    expect(hasAnalystOnlyFilters({ channel: "ui" })).toBe(true);
    expect(hasAnalystOnlyFilters({ band: "review" })).toBe(true);
  });
});
