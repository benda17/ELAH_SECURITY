import assert from "node:assert/strict";
import {
  CRM_TOOL_ACTION_FALLBACKS,
  CS_CRM_INTENTS,
  alternativeInterpretations,
  csCrmCoordinates,
  financialRiskLevel,
  isDeviationPoint,
  pointDisplayOpacity,
  resolveNormalizedActionEvidence,
  round3,
  sanitizeMetadata,
} from "../lib/elah/cs-crm-coordinates";
import { buildTrajectories, type IntentMatrixPoint } from "../lib/intent-matrix-points";

assert.equal(CS_CRM_INTENTS.length, 16);

for (const intent of CS_CRM_INTENTS) {
  const c = csCrmCoordinates(intent);
  assert.ok(c.humanAgency >= 0 && c.humanAgency <= 1);
  assert.ok(c.financialRisk >= 0 && c.financialRisk <= 1);
  assert.ok(c.emotionalUrgency >= 0 && c.emotionalUrgency <= 1);
  assert.equal(c.humanAgency, round3(c.humanAgency));
}

const injection = csCrmCoordinates("prompt_injection_or_policy_bypass");
const exfil = csCrmCoordinates("data_exfil_ticket_export");
const refund = csCrmCoordinates("refund_request");
const ambiguous = csCrmCoordinates("ambiguous_crm_request");
const unknown = csCrmCoordinates("not_a_real_intent");

assert.ok(injection.humanAgency < 0.25 && injection.financialRisk >= 0.8);
assert.ok(exfil.humanAgency < 0.25 && exfil.financialRisk >= 0.8);
assert.ok(refund.humanAgency >= 0.7 && refund.financialRisk > 0.7);
assert.ok(ambiguous.humanAgency > 0.3 && ambiguous.humanAgency < 0.55);
assert.deepEqual(injection, {
  humanAgency: 0.15,
  financialRisk: 0.88,
  emotionalUrgency: 0.28,
});
assert.deepEqual(unknown, ambiguous);

assert.equal(financialRiskLevel(0.92), "critical");
assert.equal(financialRiskLevel(0.2), "low");

assert.equal(
  isDeviationPoint({ intentLabel: "prompt_injection_or_policy_bypass" }),
  true,
);
assert.equal(isDeviationPoint({ policyDecision: "deny" }), true);
assert.equal(isDeviationPoint({ eventType: "policy_denied" }), true);
assert.equal(isDeviationPoint({ intentLabel: "ticket_status" }), false);

assert.ok(pointDisplayOpacity({ unavailable: true }) < 0.4);
assert.ok(pointDisplayOpacity({ confidence: 0.9 }) > pointDisplayOpacity({ confidence: 0.4 }));

const notes = alternativeInterpretations(["RC_INJECTION_OVERRIDE", "RC_DATA_EXFIL"]);
assert.ok(notes.some((n) => n.includes("override")));
assert.ok(!notes.some((n) => /ELAH blocked/i.test(n)));

const sanitized = sanitizeMetadata({
  actorName: "Ada",
  password: "secret123",
  nested: { apiKey: "abc", tool: "list_tickets" },
});
assert.equal(sanitized.password, "[redacted]");
assert.equal((sanitized.nested as Record<string, unknown>).apiKey, "[redacted]");
assert.equal((sanitized.nested as Record<string, unknown>).tool, "list_tickets");

assert.equal(Object.keys(CRM_TOOL_ACTION_FALLBACKS).length, 11);
assert.deepEqual(resolveNormalizedActionEvidence("list_tickets", {}), {
  platformAction: "list_tickets",
  normalizedActionId: "SUP-25",
  normalizedActionName: "view_queue",
  actionClass: "Observe",
  actionImpact: "Moderate",
  actionMappingStatus: "fallback",
  actionMappingReason:
    "Historical fallback verified against ELAH Research Note 01 (17 Sep 2026).",
});
assert.deepEqual(resolveNormalizedActionEvidence("request_refund", {}), {
  platformAction: "request_refund",
  normalizedActionId: null,
  normalizedActionName: null,
  actionClass: null,
  actionImpact: null,
  actionMappingStatus: "unmapped",
  actionMappingReason:
    "Research Note 01 contains no normalized refund action ID; no ID invented.",
});
assert.deepEqual(
  resolveNormalizedActionEvidence("get_ticket", {
    normalizedAction: {
      normalizedActionId: "CRM-18",
      normalizedActionName: "producer_override",
      actionClass: "Change",
      actionImpact: "High",
      actionMappingStatus: "mapped",
      actionMappingReason: "Mapped by upstream adapter v2.",
    },
    platformAction: "vendor.open_case",
  }),
  {
    platformAction: "vendor.open_case",
    normalizedActionId: "CRM-18",
    normalizedActionName: "producer_override",
    actionClass: "Change",
    actionImpact: "High",
    actionMappingStatus: "metadata",
    actionMappingReason: "Mapped by upstream adapter v2.",
  },
);
assert.deepEqual(
  resolveNormalizedActionEvidence("add_crm_note", {
    platformAction: "add_crm_note",
    normalizedActionId: "CRM-18",
    normalizedAction: "add_note",
    actionClass: "Change",
    impact: "Moderate",
    actionMappingStatus: "mapped",
  }),
  {
    platformAction: "add_crm_note",
    normalizedActionId: "CRM-18",
    normalizedActionName: "add_note",
    actionClass: "Change",
    actionImpact: "Moderate",
    actionMappingStatus: "metadata",
    actionMappingReason: "Producer-supplied normalized action metadata.",
  },
);

const points: IntentMatrixPoint[] = [
  {
    id: "1",
    x: 0.1,
    y: 0.2,
    z: 0.3,
    riskLevel: "low",
    actionStatus: "scored",
    intentId: "ticket_status",
    intentLabel: "ticket_status",
    userId: "u1",
    timestamp: "2026-09-16T10:00:00.000Z",
    messageSnippet: "status?",
    toolName: "get_ticket",
    policyDecision: "allow",
    conversationId: "c1",
  },
  {
    id: "2",
    x: 0.2,
    y: 0.3,
    z: 0.4,
    riskLevel: "medium",
    actionStatus: "scored",
    intentId: "refund_request",
    intentLabel: "refund_request",
    userId: "u1",
    timestamp: "2026-09-16T10:01:00.000Z",
    messageSnippet: "refund",
    toolName: "request_refund",
    policyDecision: "needs_confirmation",
    conversationId: "c1",
  },
];
const traj = buildTrajectories(points, 20);
assert.equal(traj.length, 1);
assert.equal(traj[0]?.coords.length, 2);

console.log("cs-crm-coordinates tests passed");
