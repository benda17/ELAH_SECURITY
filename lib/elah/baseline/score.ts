import { calculateInitialCoordinates } from "@/lib/elah/helpers";
import { ELAH_BANKING_INTENTS, type ElahBankingIntent } from "@/lib/elah/types";
import type { ElahEvent } from "@/lib/elah/envelope";
import {
  ELAH_SCORER,
  type ElahExplanation,
  type ElahScore,
  type PolicyRecommendation,
  type ScoreStatus,
} from "../service/types";
import {
  extractBaselineFeatures,
  type BaselineFeatures,
} from "./features";
import {
  complementaryUncertainty,
  normalizeCoordinates,
  normalizeUnitInterval,
  round3,
} from "./normalize";
import {
  RC_ABSTAIN_LOW_CONFIDENCE,
  RC_HIGH_VALUE,
  RC_INJECTION_OVERRIDE,
  RC_NO_TOOL_AMBIGUOUS,
  RC_NON_BANKING,
  RC_NONE,
  RC_P0_BILL_PAYMENT,
  RC_P0_EXTERNAL_TRANSFER,
  RC_P0_INTERNAL_TRANSFER,
  RC_PLANNED_TOOL,
  RC_POLICY_DENIED_NOT_ELAH,
  type ReasonCode,
} from "./reason-codes";

const INTENT_SET = new Set<string>(ELAH_BANKING_INTENTS);

const ACTION_TYPE_TO_INTENT: Record<string, ElahBankingIntent> = {
  internal_transfer: "internal_transfer",
  external_transfer: "external_transfer",
  bill_payment: "bill_payment",
  statement_download: "statement_download",
  card_freeze: "card_freeze",
  card_unfreeze: "card_unfreeze",
  support_case_created: "support_escalation",
  account_balance_read: "balance_awareness",
  transactions_read: "recent_transactions",
  transaction_lookup: "recent_transactions",
  spending_summary: "spending_summary",
  prompt_injection: "prompt_injection_or_policy_bypass",
  profile_update: "profile_update",
  loan_application: "loan_application",
  document_download: "statement_download",
  document_bulk_download: "statement_download",
  recipients_read: "recent_transactions",
  cards_read: "recent_transactions",
  card_request: "profile_update",
  login: "non_banking_request",
  login_failed: "non_banking_request",
  logout: "non_banking_request",
  password_reset: "profile_update",
};

const TOOL_TO_INTENT: Record<string, ElahBankingIntent> = {
  get_account_balance: "balance_awareness",
  get_recent_transactions: "recent_transactions",
  get_transaction_by_id: "recent_transactions",
  get_spending_summary: "spending_summary",
  create_internal_transfer: "internal_transfer",
  create_external_transfer: "external_transfer",
  pay_bill: "bill_payment",
  get_monthly_statement: "statement_download",
  freeze_card: "card_freeze",
  unfreeze_card: "card_unfreeze",
  create_support_case: "support_escalation",
  get_cards: "recent_transactions",
  get_saved_recipients: "external_transfer",
};

/** Weak conversational defaults — do not steal greeting / short-utterance fallbacks. */
const WEAK_READ_ACTION_TYPES = new Set(["recipients_read", "cards_read"]);

const GREETING_RE =
  /^(hi|hello|hey|thanks|thank you|good morning|good afternoon|good evening|bye|ok|okay)\b/i;

const BANKING_VERB_RE =
  /\b(pay|transfer|send|wire|balance|statement|card|freeze|unfreeze|bill|loan|account|transaction|spend|spending)\b/i;

const MONEY_MOVEMENT_INTENTS = new Set<ElahBankingIntent>([
  "external_transfer",
  "internal_transfer",
  "bill_payment",
  "scheduled_payment",
]);

const URGENCY_INTENTS = new Set<ElahBankingIntent>([
  "card_freeze",
  "fraud_report",
  "dispute_chargeback",
]);

const BONUS_AMOUNT = 0.04;
const BONUS_RECIPIENT = 0.03;
const BONUS_PLANNED_TOOL = 0.05;
const INJECTION_CAP = 0.12;
const NON_BANKING_CAP = 0.35;
const ABSTAIN_SCORE = 0.48;
const SCORE_MIN = 0.05;
const SCORE_MAX = 0.99;
const ABSTAIN_CONFIDENCE = 0.4;

type RuleRow = {
  elahScore: number;
  confidence: number;
  recommendation: PolicyRecommendation;
};

/**
 * Phase 3 fixture scores (INTENT_RULES). Used as canonical targets.
 * Feature bonuses are added on top of (target − typical bonuses) so fully
 * specified P0 events reconstruct these numbers.
 */
const INTENT_RULES: Partial<Record<ElahBankingIntent, RuleRow>> = {
  prompt_injection_or_policy_bypass: {
    elahScore: 0.08,
    confidence: 0.91,
    recommendation: "review",
  },
  ambiguous_banking_request: {
    elahScore: 0.48,
    confidence: 0.35,
    recommendation: "none",
  },
  non_banking_request: {
    elahScore: 0.22,
    confidence: 0.75,
    recommendation: "none",
  },
  external_transfer: {
    elahScore: 0.87,
    confidence: 0.82,
    recommendation: "watch",
  },
  internal_transfer: {
    elahScore: 0.84,
    confidence: 0.8,
    recommendation: "none",
  },
  bill_payment: {
    elahScore: 0.86,
    confidence: 0.8,
    recommendation: "none",
  },
  statement_download: {
    elahScore: 0.81,
    confidence: 0.88,
    recommendation: "none",
  },
  card_freeze: {
    elahScore: 0.83,
    confidence: 0.85,
    recommendation: "none",
  },
  card_unfreeze: {
    elahScore: 0.8,
    confidence: 0.84,
    recommendation: "none",
  },
  support_escalation: {
    elahScore: 0.76,
    confidence: 0.7,
    recommendation: "none",
  },
  balance_awareness: {
    elahScore: 0.88,
    confidence: 0.9,
    recommendation: "none",
  },
  recent_transactions: {
    elahScore: 0.86,
    confidence: 0.88,
    recommendation: "none",
  },
  spending_summary: {
    elahScore: 0.85,
    confidence: 0.86,
    recommendation: "none",
  },
};

const DEFAULT_RULE: RuleRow = {
  elahScore: 0.8,
  confidence: 0.78,
  recommendation: "none",
};

const ALLOWED_RECOMMENDATIONS = new Set<PolicyRecommendation>([
  "none",
  "watch",
  "review",
  "step_up_hint",
]);

function isIntent(value: string | undefined | null): value is ElahBankingIntent {
  return typeof value === "string" && INTENT_SET.has(value);
}

function utteranceOf(event: ElahEvent): string {
  return event.conversation?.utterance ?? "";
}

function isGreeting(utterance: string): boolean {
  return GREETING_RE.test(utterance.trim());
}

function looksBanking(utterance: string): boolean {
  return BANKING_VERB_RE.test(utterance);
}

function ruleFor(intent: ElahBankingIntent): RuleRow {
  return INTENT_RULES[intent] ?? DEFAULT_RULE;
}

/**
 * Typical feature bonuses already baked into Phase 3 fixture scores.
 * Subtracted before applying live +0.04 / +0.03 / +0.05 so canonical
 * events (8.1 / 8.2 / 8.3) still land on those numbers.
 */
function typicalBonus(intent: ElahBankingIntent): number {
  if (
    intent === "prompt_injection_or_policy_bypass" ||
    intent === "ambiguous_banking_request" ||
    intent === "non_banking_request"
  ) {
    return 0;
  }
  if (MONEY_MOVEMENT_INTENTS.has(intent)) {
    return BONUS_AMOUNT + BONUS_RECIPIENT + BONUS_PLANNED_TOOL;
  }
  return BONUS_PLANNED_TOOL;
}

function amountPresent(features: BaselineFeatures): boolean {
  return features.amountBucket !== "none";
}

function resolveIntentLabel(event: ElahEvent, features: BaselineFeatures): ElahBankingIntent {
  const utterance = utteranceOf(event);
  if (features.injectionLikely) return "prompt_injection_or_policy_bypass";
  if (isIntent(event.detectedIntent)) return event.detectedIntent;

  const fromAction = ACTION_TYPE_TO_INTENT[event.actionType];
  const skipWeakRead =
    features.noTool &&
    (features.shortUtterance || isGreeting(utterance)) &&
    WEAK_READ_ACTION_TYPES.has(event.actionType);
  if (fromAction && !skipWeakRead) return fromAction;

  const toolName = event.action.toolName;
  if (toolName && TOOL_TO_INTENT[toolName]) return TOOL_TO_INTENT[toolName];

  if (features.noTool && (isGreeting(utterance) || (features.shortUtterance && !looksBanking(utterance)))) {
    return "non_banking_request";
  }
  return "ambiguous_banking_request";
}

function uniqueCap(items: string[], maxItems: number, maxChars: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const clipped = item.slice(0, maxChars);
    if (!clipped || seen.has(clipped)) continue;
    seen.add(clipped);
    out.push(clipped);
    if (out.length >= maxItems) break;
  }
  return out;
}

function computeConfidence(intent: ElahBankingIntent, features: BaselineFeatures): number {
  if (features.injectionLikely) {
    return normalizeUnitInterval(ruleFor("prompt_injection_or_policy_bypass").confidence);
  }
  if (intent === "ambiguous_banking_request") {
    return normalizeUnitInterval(ruleFor("ambiguous_banking_request").confidence);
  }
  if (intent === "non_banking_request") {
    return normalizeUnitInterval(ruleFor("non_banking_request").confidence);
  }

  const rule = ruleFor(intent);
  if (features.hasPlannedTool) {
    return normalizeUnitInterval(rule.confidence);
  }
  if (features.noTool && features.shortUtterance) {
    return normalizeUnitInterval(Math.min(rule.confidence, 0.35));
  }
  if (features.noTool && amountPresent(features) && features.recipientType !== "none") {
    return normalizeUnitInterval(rule.confidence - 0.05);
  }
  if (features.noTool) {
    return normalizeUnitInterval(0.35);
  }
  return normalizeUnitInterval(rule.confidence);
}

function computeElahScore(
  intent: ElahBankingIntent,
  features: BaselineFeatures,
  status: ScoreStatus,
): number {
  if (status === "abstained" || intent === "ambiguous_banking_request") {
    return round3(ABSTAIN_SCORE);
  }

  let score = ruleFor(intent).elahScore - typicalBonus(intent);
  if (amountPresent(features)) score += BONUS_AMOUNT;
  if (features.recipientType !== "none") score += BONUS_RECIPIENT;
  if (features.hasPlannedTool) score += BONUS_PLANNED_TOOL;

  if (intent === "prompt_injection_or_policy_bypass") {
    score = Math.min(score, INJECTION_CAP);
  }
  if (intent === "non_banking_request") {
    score = Math.min(score, NON_BANKING_CAP);
  }

  return round3(Math.min(SCORE_MAX, Math.max(SCORE_MIN, score)));
}

function computeCoordinates(
  intent: ElahBankingIntent,
  features: BaselineFeatures,
  utterance: string,
): ElahScore["coordinates"] {
  const base = calculateInitialCoordinates(intent, { message: utterance });
  let humanAgency = base.humanAgency;
  let financialRisk = base.financialRisk;
  let emotionalUrgency = base.emotionalUrgency;

  if (features.highValue) {
    financialRisk += 0.06;
  }
  if (URGENCY_INTENTS.has(intent)) {
    emotionalUrgency += 0.05;
  }
  if (features.injectionLikely) {
    humanAgency = Math.min(humanAgency, 0.15);
  }

  return normalizeCoordinates({ humanAgency, financialRisk, emotionalUrgency });
}

function buildExplanation(
  event: ElahEvent,
  intent: ElahBankingIntent,
  features: BaselineFeatures,
): ElahExplanation {
  const matchedSignals: string[] = [];
  const weakSignals: string[] = [];
  const negativeSignals: string[] = [];
  let summary: string | undefined;
  const utterance = utteranceOf(event);

  if (intent === "prompt_injection_or_policy_bypass") {
    negativeSignals.push("ignore_previous_instructions", "policy_or_refusal_outcome");
    if (event.actionType === "prompt_injection") {
      negativeSignals.push("injection_action_type");
    }
    summary = "Hostile instruction to override policy; not genuine banking intent.";
  } else if (intent === "ambiguous_banking_request") {
    if (
      event.actionType.includes("transfer") ||
      event.actionType.includes("bill") ||
      looksBanking(utterance) ||
      (event.action.toolName != null && /transfer|pay_bill/.test(event.action.toolName))
    ) {
      matchedSignals.push("transfer_or_payment_verb");
    }
    if (features.shortUtterance) weakSignals.push("short_message");
    if (features.questionMark && features.noTool) {
      weakSignals.push("question_without_tool_plan");
    }
    summary =
      "Payment verb without amount, recipient, or planned tool; score withheld as decisive.";
  } else {
    if (
      intent === "external_transfer" ||
      intent === "internal_transfer" ||
      intent === "bill_payment"
    ) {
      matchedSignals.push("transfer_or_payment_verb");
    }
    if (amountPresent(features) || event.action.amount != null) {
      matchedSignals.push("amount_detected");
    }
    if (features.recipientType !== "none") {
      matchedSignals.push("recipient_detected");
    }
    if (features.toolName) {
      matchedSignals.push(`planned_tool:${features.toolName}`);
    }
    matchedSignals.push("banking_action_context");
    if (features.highValue) matchedSignals.push("high_value_amount");
    if (features.firstPayeeHint) matchedSignals.push("first_payee");
    if (features.oddHours) weakSignals.push("odd_hours");
    if (features.intentToolMismatch) weakSignals.push("intent_tool_mismatch");
    if (features.shortUtterance) weakSignals.push("short_message");
    if (features.policyDenied) {
      negativeSignals.push("policy_or_refusal_outcome");
    }
    if (intent === "external_transfer") {
      summary = features.highValue
        ? "Planned high-value external transfer to a named recipient; looks like genuine payment intent."
        : "Planned external transfer of a medium amount to a named recipient; looks like genuine payment intent.";
    } else if (intent === "non_banking_request") {
      summary = "Request is off banking intent; scored as non-banking.";
    } else if (intent === "internal_transfer") {
      summary = "Planned internal transfer; looks like genuine banking intent.";
    } else if (intent === "bill_payment") {
      summary = "Planned bill payment; looks like genuine banking intent.";
    }
  }

  const explanation: ElahExplanation = {
    matchedSignals: uniqueCap(matchedSignals, 64, 128),
    weakSignals: uniqueCap(weakSignals, 64, 128),
    negativeSignals: uniqueCap(negativeSignals, 64, 128),
  };
  if (summary) {
    explanation.summary = summary.slice(0, 240);
  }
  return explanation;
}

function collectReasonCodes(
  intent: ElahBankingIntent,
  features: BaselineFeatures,
  status: ScoreStatus,
): ReasonCode[] {
  const codes: ReasonCode[] = [];
  if (features.injectionLikely) codes.push(RC_INJECTION_OVERRIDE);
  if (intent === "external_transfer") codes.push(RC_P0_EXTERNAL_TRANSFER);
  if (intent === "internal_transfer") codes.push(RC_P0_INTERNAL_TRANSFER);
  if (intent === "bill_payment") codes.push(RC_P0_BILL_PAYMENT);
  if (status === "abstained") codes.push(RC_ABSTAIN_LOW_CONFIDENCE);
  if (features.noTool && intent === "ambiguous_banking_request") {
    codes.push(RC_NO_TOOL_AMBIGUOUS);
  }
  if (features.highValue) codes.push(RC_HIGH_VALUE);
  if (features.policyDenied) codes.push(RC_POLICY_DENIED_NOT_ELAH);
  if (intent === "non_banking_request") codes.push(RC_NON_BANKING);
  if (features.hasPlannedTool) codes.push(RC_PLANNED_TOOL);
  if (codes.length === 0) codes.push(RC_NONE);
  return codes;
}

function resolveRecommendation(
  intent: ElahBankingIntent,
  status: ScoreStatus,
): PolicyRecommendation {
  if (intent === "prompt_injection_or_policy_bypass") return "review";
  if (status === "abstained") return "none";
  let recommendation = ruleFor(intent).recommendation;
  if (!ALLOWED_RECOMMENDATIONS.has(recommendation)) {
    recommendation = "none";
  }
  return recommendation;
}

export function scoreElahEvent(event: ElahEvent): {
  status: ScoreStatus;
  score: ElahScore;
} {
  const features = extractBaselineFeatures(event);
  const intentLabel = resolveIntentLabel(event, features);
  const confidence = computeConfidence(intentLabel, features);
  const uncertainty = complementaryUncertainty(confidence);
  const status: ScoreStatus = confidence < ABSTAIN_CONFIDENCE ? "abstained" : "scored";
  const elahScore = computeElahScore(intentLabel, features, status);
  const utterance = utteranceOf(event);
  const coordinates = computeCoordinates(intentLabel, features, utterance);
  const recommendation = resolveRecommendation(intentLabel, status);

  const score: ElahScore = {
    elahScore,
    confidence,
    uncertainty,
    intentLabel,
    coordinates,
    explanation: buildExplanation(event, intentLabel, features),
    policyHook: {
      recommendation,
      reasons: uniqueCap(collectReasonCodes(intentLabel, features, status), 16, 128),
    },
    provenance: {
      scorer: ELAH_SCORER,
      modelVersion: null,
      labelSource: "rules_v0",
    },
  };

  return { status, score };
}
