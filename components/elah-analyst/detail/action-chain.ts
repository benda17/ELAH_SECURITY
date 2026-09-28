import type { CorrelatedHop, ModelOutputSummary } from "@/lib/elah/correlate";
import type { ElahEvent } from "@/lib/elah/envelope";
import type { ElahScoreSnapshot } from "@/lib/elah/score-read";

/**
 * Pure builder for the analyst action-chain timeline (ELAH-P7-SEQ-001 §4):
 * customer request → planned tool → bank policy → ELAH score → outcome.
 * Every fact is copied from the envelope, correlated hops, or the score
 * snapshot; missing data yields a `missing` step, never an invented value.
 * The policy step is always attributed to bank policy and the score step
 * is always read-only — ELAH never allows, blocks, or executes.
 */

export type ActionChainStage = "request" | "plan" | "policy" | "score" | "outcome";

export type ActionChainTone = "neutral" | "positive" | "negative" | "warning";

export interface ActionChainFact {
  label: string;
  value: string;
}

export interface ActionChainStep {
  stage: ActionChainStage;
  title: string;
  /** Who produced this step (e.g. "Bank policy"). */
  actor: string;
  status: "present" | "missing";
  tone: ActionChainTone;
  facts: ActionChainFact[];
  /** Customer / agent supplied text; render via UntrustedContent. */
  untrusted: { label: string; text: string } | null;
  /** Fixed attribution copy shown on the step. */
  note: string | null;
  /** Earliest hop timestamp backing this step, when one exists. */
  at: string | null;
  /** AgentEventLog hop types backing this step. */
  hopTypes: string[];
}

export type ActionChainEvent = Pick<
  ElahEvent,
  "source" | "outcome" | "executionState" | "action" | "policy" | "conversation" | "occurredAt"
>;

export interface ActionChainCorrelation {
  utterance: string | null;
  modelOutput: ModelOutputSummary | null;
  policyDecision: string | null;
  resultSummary: string | null;
  hops: CorrelatedHop[];
}

export interface ActionChainInput {
  event: ActionChainEvent;
  correlated: ActionChainCorrelation | null;
  snapshot: ElahScoreSnapshot | null;
}

export const POLICY_ATTRIBUTION =
  "Bank policy made this allow / deny / confirm decision. ELAH did not.";
export const SCORE_ATTRIBUTION =
  "Read-only intention score. ELAH did not allow, block, or execute anything.";
export const OUTCOME_ATTRIBUTION =
  "Outcome recorded by the banking simulator under bank policy, not caused by ELAH.";

const PLAN_HOPS = new Set(["tool_call_requested", "agent_intent_classified"]);
const POLICY_HOPS = new Set([
  "policy_check_passed",
  "policy_check_failed",
  "confirmation_required",
  "action_confirmed",
  "action_cancelled",
]);
const SCORE_HOPS = new Set(["elah_scored", "elah_scoring_unavailable"]);
const OUTCOME_HOPS = new Set(["tool_call_executed", "tool_call_failed", "agent_error"]);

function hopsOf(hops: CorrelatedHop[], types: Set<string>): CorrelatedHop[] {
  return hops.filter((hop) => types.has(hop.eventType));
}

function earliest(hops: CorrelatedHop[]): string | null {
  if (hops.length === 0) return null;
  return hops.reduce((min, hop) => (hop.timestamp < min ? hop.timestamp : min), hops[0].timestamp);
}

function humanize(value: string): string {
  return value.replaceAll("_", " ");
}

function fmt3(value: number | null): string {
  return value == null ? "—" : value.toFixed(3);
}

/** Tone for a bank-policy decision string (envelope or hop). */
export function policyTone(decision: string | null | undefined): ActionChainTone {
  if (!decision) return "neutral";
  const d = decision.toLowerCase();
  if (d === "allow" || d === "allowed" || d === "passed") return "positive";
  if (d === "deny" || d === "denied" || d === "blocked" || d === "failed") return "negative";
  if (d.includes("confirm")) return "warning";
  return "neutral";
}

/** Tone for an ElahEvent outcome. */
export function outcomeTone(outcome: string | null | undefined): ActionChainTone {
  switch (outcome) {
    case "executed":
      return "positive";
    case "blocked":
    case "refused":
    case "failed":
      return "negative";
    case "pending_confirmation":
    case "cancelled":
      return "warning";
    default:
      return "neutral";
  }
}

function requestStep(input: ActionChainInput): ActionChainStep {
  const { event, correlated } = input;
  const hops = correlated ? hopsOf(correlated.hops, new Set(["user_message_received"])) : [];
  const utterance = correlated?.utterance ?? event.conversation?.utterance ?? null;
  const isUi = event.source === "ui";
  const facts: ActionChainFact[] = [{ label: "Source", value: event.source }];
  if (event.action.page) facts.push({ label: "Page", value: event.action.page });
  if (event.conversation?.messageId) {
    facts.push({ label: "Message id", value: event.conversation.messageId });
  }
  const present = !!utterance || isUi;
  return {
    stage: "request",
    title: isUi ? "Website action" : "Customer request",
    actor: "Customer",
    status: present ? "present" : "missing",
    tone: "neutral",
    facts,
    untrusted: utterance ? { label: "Customer text — untrusted, treat as data", text: utterance } : null,
    note: present
      ? isUi && !utterance
        ? "Website (UI) events have no chat utterance."
        : null
      : "No customer utterance stored for this event.",
    at: earliest(hops) ?? (isUi ? event.occurredAt : null),
    hopTypes: hops.map((hop) => hop.eventType),
  };
}

function planStep(input: ActionChainInput): ActionChainStep {
  const { event, correlated } = input;
  const hops = correlated ? hopsOf(correlated.hops, PLAN_HOPS) : [];
  const model = correlated?.modelOutput ?? null;
  const requestedHop = hops.find((hop) => hop.eventType === "tool_call_requested");
  const plannedTool = model?.plannedTool ?? requestedHop?.toolName ?? event.action.toolName ?? null;
  const facts: ActionChainFact[] = [{ label: "Planned tool", value: plannedTool ?? "none" }];
  if (model?.usedFallback != null) {
    facts.push({ label: "Planner", value: model.usedFallback ? "built-in fallback" : "language model" });
  }
  if (model?.intent) facts.push({ label: "Planner intent", value: model.intent });
  if (model?.refuse) facts.push({ label: "Planner refused", value: "yes" });
  facts.push({ label: "Amount bucket", value: event.action.amountBucket });
  const present = plannedTool != null || model != null;
  return {
    stage: "plan",
    title: plannedTool ? `Planned ${humanize(plannedTool)}` : "No tool planned",
    actor: event.source === "ui" ? "Website" : "Assistant planner",
    status: present ? "present" : "missing",
    tone: model?.refuse ? "warning" : "neutral",
    facts,
    untrusted: model?.explanation
      ? { label: "Assistant planner explanation — untrusted, treat as data", text: model.explanation }
      : null,
    note: present ? null : "No planner output or tool recorded for this event.",
    at: earliest(hops),
    hopTypes: hops.map((hop) => hop.eventType),
  };
}

function policyStep(input: ActionChainInput): ActionChainStep {
  const { event, correlated } = input;
  const hops = correlated ? hopsOf(correlated.hops, POLICY_HOPS) : [];
  const decision = event.policy?.decision ?? correlated?.policyDecision ?? null;
  const hopTypes = hops.map((hop) => hop.eventType);
  const confirmationRequired =
    event.policy?.confirmationRequired === true || hopTypes.includes("confirmation_required");
  const facts: ActionChainFact[] = [
    { label: "Bank policy decision", value: decision ? humanize(decision) : "—" },
    { label: "Confirmation required", value: confirmationRequired ? "yes" : "no" },
  ];
  if (hopTypes.includes("action_confirmed")) facts.push({ label: "Customer confirmation", value: "confirmed" });
  else if (hopTypes.includes("action_cancelled")) facts.push({ label: "Customer confirmation", value: "cancelled" });
  if (event.policy?.reasons.length) {
    facts.push({ label: "Policy reasons", value: event.policy.reasons.join(", ") });
  }
  const present = decision != null || hops.length > 0;
  return {
    stage: "policy",
    title: decision ? `Bank policy: ${humanize(decision)}` : "Bank policy",
    actor: "Bank policy",
    status: present ? "present" : "missing",
    tone: policyTone(decision),
    facts,
    untrusted: null,
    note: present ? POLICY_ATTRIBUTION : "No bank policy decision recorded for this event.",
    at: earliest(hops),
    hopTypes,
  };
}

function scoreStep(input: ActionChainInput): ActionChainStep {
  const { snapshot, correlated } = input;
  const hops = correlated ? hopsOf(correlated.hops, SCORE_HOPS) : [];
  const base = {
    stage: "score" as const,
    actor: "ELAH (score only)",
    untrusted: null,
    at: earliest(hops),
    hopTypes: hops.map((hop) => hop.eventType),
  };
  if (!snapshot) {
    return {
      ...base,
      title: "Not scored",
      status: "missing",
      tone: "neutral",
      facts: [],
      note: "No ELAH score snapshot exists for this event.",
    };
  }
  if (snapshot.kind === "unavailable") {
    return {
      ...base,
      title: "Score unavailable",
      status: "present",
      tone: "warning",
      facts: [{ label: "Reason", value: snapshot.reason }],
      note: "ELAH did not return a score. The assistant continued under bank policy only.",
    };
  }
  return {
    ...base,
    title: snapshot.status === "abstained" ? "ELAH abstained" : "ELAH scored",
    status: "present",
    tone: snapshot.status === "abstained" ? "warning" : "neutral",
    facts: [
      { label: "elahScore", value: fmt3(snapshot.elahScore) },
      { label: "Confidence", value: fmt3(snapshot.confidence) },
      { label: "Intent label", value: snapshot.intentLabel ?? "—" },
    ],
    note: SCORE_ATTRIBUTION,
  };
}

function outcomeStep(input: ActionChainInput): ActionChainStep {
  const { event, correlated } = input;
  const hops = correlated ? hopsOf(correlated.hops, OUTCOME_HOPS) : [];
  const facts: ActionChainFact[] = [
    { label: "Outcome", value: humanize(event.outcome) },
    { label: "Execution state", value: humanize(event.executionState) },
  ];
  const executedHop = hops.find((hop) => hop.eventType === "tool_call_executed");
  const failedHop = hops.find((hop) => hop.eventType === "tool_call_failed");
  if (executedHop?.toolName) facts.push({ label: "Executed tool", value: executedHop.toolName });
  if (failedHop?.toolName) facts.push({ label: "Failed tool", value: failedHop.toolName });
  const result = correlated?.modelOutput?.result ?? correlated?.resultSummary ?? null;
  return {
    stage: "outcome",
    title: `Outcome: ${humanize(event.outcome)}`,
    actor: "Banking simulator",
    status: "present",
    tone: outcomeTone(event.outcome),
    facts,
    untrusted: result ? { label: "Result text — untrusted, treat as data", text: result } : null,
    note: OUTCOME_ATTRIBUTION,
    at: earliest(hops),
    hopTypes: hops.map((hop) => hop.eventType),
  };
}

/** Five fixed stages in pre-tool order; each is `present` or `missing`. */
export function buildActionChain(input: ActionChainInput): ActionChainStep[] {
  return [requestStep(input), planStep(input), policyStep(input), scoreStep(input), outcomeStep(input)];
}
