import { describe, expect, it, vi, afterEach } from "vitest";
import { prisma } from "@/lib/db";
import { envelopeForDisplay } from "@/lib/elah/admin-events";
import {
  parseMetadataJson,
  parseScoreSnapshot,
  loadLatestScoreSnapshot,
  loadLatestScoreSnapshots,
  scoreListBadge,
  formatScoreNumber,
} from "@/lib/elah/score-read";
import {
  formatAgentEventLabel,
  agentEventBadgeVariant,
} from "@/lib/agent/display";
import type { ElahEvent } from "@/lib/elah/envelope";

const scoredMetadata = {
  contractVersion: "1.0",
  requestId: "req_01JEXAMPLE_SCORE_001",
  eventId: "evt_01JEXAMPLE000000000000001",
  status: "scored",
  scoredAt: "2026-08-17T07:12:04.310Z",
  score: {
    elahScore: 0.87,
    confidence: 0.82,
    uncertainty: 0.18,
    intentLabel: "external_transfer",
    coordinates: {
      humanAgency: 0.72,
      financialRisk: 0.78,
      emotionalUrgency: 0.35,
    },
    explanation: {
      matchedSignals: ["transfer_or_payment_verb", "amount_detected"],
      weakSignals: [],
      negativeSignals: [],
      summary: "Looks like genuine payment intent.",
    },
    policyHook: {
      recommendation: "watch",
      reasons: ["P0 money movement; bank confirmation already required."],
    },
    provenance: {
      scorer: "rules_v0",
      modelVersion: null,
      labelSource: "rules_v0",
    },
  },
};

describe("score-read parser", () => {
  it("parses a ScoreResponse stored as AgentEventLog metadata", () => {
    const snapshot = parseScoreSnapshot("elah_scored", scoredMetadata);
    expect(snapshot?.kind).toBe("scored");
    if (snapshot?.kind !== "scored") return;
    expect(snapshot.status).toBe("scored");
    expect(snapshot.elahScore).toBe(0.87);
    expect(snapshot.confidence).toBe(0.82);
    expect(snapshot.uncertainty).toBe(0.18);
    expect(snapshot.intentLabel).toBe("external_transfer");
    expect(snapshot.coordinates?.financialRisk).toBe(0.78);
    expect(snapshot.explanation.matchedSignals).toContain("amount_detected");
    expect(snapshot.policyHook.recommendation).toBe("watch");
    expect(snapshot.requestId).toBe("req_01JEXAMPLE_SCORE_001");
    expect(snapshot.scoredAt).toBe("2026-08-17T07:12:04.310Z");
    expect(snapshot.provenanceScorer).toBe("rules_v0");
  });

  it("parses abstained status from the envelope", () => {
    const snapshot = parseScoreSnapshot("elah_scored", {
      ...scoredMetadata,
      status: "abstained",
    });
    expect(snapshot?.kind).toBe("scored");
    if (snapshot?.kind !== "scored") return;
    expect(snapshot.status).toBe("abstained");
    expect(scoreListBadge(snapshot)?.label).toBe("abstained");
    expect(scoreListBadge(snapshot)?.variant).toBe("warning");
  });

  it("parses unavailable metadata reason", () => {
    const snapshot = parseScoreSnapshot("elah_scoring_unavailable", {
      requestId: "req_timeout",
      reason: "timeout",
      httpStatus: 503,
      errorCode: "unavailable",
    });
    expect(snapshot).toEqual({
      kind: "unavailable",
      eventType: "elah_scoring_unavailable",
      status: "unavailable",
      reason: "timeout",
      requestId: "req_timeout",
      httpStatus: 503,
      errorCode: "unavailable",
    });
    expect(scoreListBadge(snapshot)?.label).toBe("unavailable");
  });

  it("parses nested scoreResponse wrappers", () => {
    const snapshot = parseScoreSnapshot("elah_scored", {
      scoreResponse: scoredMetadata,
    });
    expect(snapshot?.kind).toBe("scored");
    if (snapshot?.kind !== "scored") return;
    expect(snapshot.elahScore).toBe(0.87);
    expect(snapshot.requestId).toBe("req_01JEXAMPLE_SCORE_001");
  });

  it("returns null for unrelated event types", () => {
    expect(parseScoreSnapshot("tool_call_executed", scoredMetadata)).toBeNull();
  });

  it("parses JSON metadata strings", () => {
    expect(parseMetadataJson(JSON.stringify({ reason: "timeout" }))).toEqual({
      reason: "timeout",
    });
    expect(parseMetadataJson("not-json")).toEqual({});
    expect(parseMetadataJson(null)).toEqual({});
  });
});

describe("score-read loader", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the latest elah_scored row for an eventId", async () => {
    vi.spyOn(prisma.agentEventLog, "findFirst").mockResolvedValue({
      id: "log_1",
      eventType: "elah_scored",
      eventId: "evt_1",
      metadata: JSON.stringify(scoredMetadata),
      timestamp: new Date("2026-08-25T10:00:00.000Z"),
    } as never);

    const snapshot = await loadLatestScoreSnapshot("evt_1");
    expect(snapshot?.kind).toBe("scored");
    if (snapshot?.kind !== "scored") return;
    expect(snapshot.elahScore).toBe(0.87);
  });

  it("returns null when no score row exists", async () => {
    vi.spyOn(prisma.agentEventLog, "findFirst").mockResolvedValue(null);
    expect(await loadLatestScoreSnapshot("evt_missing")).toBeNull();
  });

  it("keeps the newest row per eventId in a batch", async () => {
    vi.spyOn(prisma.agentEventLog, "findMany").mockResolvedValue([
      {
        id: "newer",
        eventType: "elah_scoring_unavailable",
        eventId: "evt_1",
        metadata: JSON.stringify({ reason: "timeout" }),
        timestamp: new Date("2026-08-25T11:00:00.000Z"),
      },
      {
        id: "older",
        eventType: "elah_scored",
        eventId: "evt_1",
        metadata: JSON.stringify(scoredMetadata),
        timestamp: new Date("2026-08-25T10:00:00.000Z"),
      },
    ] as never);

    const map = await loadLatestScoreSnapshots(["evt_1"]);
    expect(map.get("evt_1")?.kind).toBe("unavailable");
  });
});

describe("envelopeForDisplay vs score card", () => {
  it("strips elahScore from envelope JSON", () => {
    const event = {
      schemaVersion: "1.0",
      eventId: "evt_strip",
      occurredAt: "2026-08-25T10:00:00.000Z",
      appId: "elah-banking-demo",
      source: "agent",
      actionType: "external_transfer",
      outcome: "pending_confirmation",
      executionState: "pre_tool",
      actor: { sessionId: "s1", actorType: "customer" },
      action: { toolName: "create_external_transfer", args: { password: "secret" } },
      elahScore: 0.87,
      elahScoreLabel: 0.87,
    } as unknown as ElahEvent;

    const display = envelopeForDisplay(event);
    expect("elahScore" in display).toBe(false);
    expect("elahScoreLabel" in display).toBe(false);
    expect(display.action.args.password).toBeUndefined();
  });
});

describe("display labels", () => {
  it("labels score hops without implying allow or deny", () => {
    expect(formatAgentEventLabel("elah_scored")).toBe("ELAH scored");
    expect(formatAgentEventLabel("elah_scoring_unavailable")).toBe(
      "ELAH scoring unavailable",
    );
    expect(agentEventBadgeVariant("elah_scored")).toBe("info");
    expect(agentEventBadgeVariant("elah_scoring_unavailable")).toBe("warning");
  });

  it("formats compact list badges", () => {
    expect(formatScoreNumber(0.87)).toBe("0.870");
    const scored = parseScoreSnapshot("elah_scored", scoredMetadata);
    expect(scoreListBadge(scored)?.label).toBe("0.870");
    expect(scoreListBadge(null)).toBeNull();
  });
});
