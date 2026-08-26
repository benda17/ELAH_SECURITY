import { calculateInitialCoordinates } from "@/lib/elah/helpers";
import { ELAH_BANKING_INTENTS, type ElahBankingIntent } from "@/lib/elah/types";
import type { ElahEvent } from "@/lib/elah/envelope";
import {
  ELAH_SCORER,
  type ElahExplanation,
  type ElahScore,
  type PolicyRecommendation,
  type ScoreStatus,
} from "./types";

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

type RuleRow = {
  elahScore: number;
  confidence: number;
  status: ScoreStatus;
  recommendation: PolicyRecommendation;
};

const INTENT_RULES: Partial<Record<ElahBankingIntent, RuleRow>> = {
  prompt_injection_or_policy_bypass: {
    elahScore: 0.08,
    confidence: 0.91,
    status: "scored",
    recommendation: "review",
  },
  ambiguous_banking_request: {
    elahScore: 0.48,
    confidence: 0.35,
    status: "abstained",
    recommendation: "none",
  },
  non_banking_request: {
    elahScore: 0.22,
    confidence: 0.75,
    status: "scored",
    recommendation: "none",
  },
  external_transfer: {
    elahScore: 0.87,
    confidence: 0.82,
    status: "scored",
    recommendation: "watch",
  },
  internal_transfer: {
    elahScore: 0.84,
    confidence: 0.8,
    status: "scored",
    recommendation: "none",
  },
  bill_payment: {
    elahScore: 0.86,
    confidence: 0.8,
    status: "scored",
    recommendation: "none",
  },
  statement_download: {
    elahScore: 0.81,
    confidence: 0.88,
    status: "scored",
    recommendation: "none",
  },
  card_freeze: {
    elahScore: 0.83,
    confidence: 0.85,
    status: "scored",
    recommendation: "none",
  },
  card_unfreeze: {
    elahScore: 0.8,
    confidence: 0.84,
    status: "scored",
    recommendation: "none",
  },
  support_escalation: {
    elahScore: 0.76,
    confidence: 0.7,
    status: "scored",
    recommendation: "none",
  },
  balance_awareness: {
    elahScore: 0.88,
    confidence: 0.9,
    status: "scored",
    recommendation: "none",
  },
  recent_transactions: {
    elahScore: 0.86,
    confidence: 0.88,
    status: "scored",
    recommendation: "none",
  },
  spending_summary: {
    elahScore: 0.85,
    confidence: 0.86,
    status: "scored",
    recommendation: "none",
  },
};

const DEFAULT_RULE: RuleRow = {
  elahScore: 0.8,
  confidence: 0.78,
  status: "scored",
  recommendation: "none",
};

const ALLOWED_RECOMMENDATIONS = new Set<PolicyRecommendation>([
  "none",
  "watch",
  "review",
  "step_up_hint",
]);

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function isIntent(value: string | undefined | null): value is ElahBankingIntent {
  return typeof value === "string" && INTENT_SET.has(value);
}

function looksLikeInjection(event: ElahEvent): boolean {
  if (event.actionType === "prompt_injection") return true;
  if (event.detectedIntent === "prompt_injection_or_policy_bypass") return true;
  if (event.outcome !== "refused" && event.outcome !== "blocked") return false;
  const reasons = event.policy?.reasons ?? [];
  return reasons.some((reason) =>
    /injection|ignore_previous|policy_bypass|jailbreak/i.test(reason),
  );
}

function resolveIntentLabel(event: ElahEvent): ElahBankingIntent {
  if (looksLikeInjection(event)) return "prompt_injection_or_policy_bypass";
  if (isIntent(event.detectedIntent)) return event.detectedIntent;
  const fromAction = ACTION_TYPE_TO_INTENT[event.actionType];
  if (fromAction) return fromAction;
  const toolName = event.action.toolName;
  if (toolName && TOOL_TO_INTENT[toolName]) return TOOL_TO_INTENT[toolName];
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

function buildExplanation(event: ElahEvent, intent: ElahBankingIntent): ElahExplanation {
  const matchedSignals: string[] = [];
  const weakSignals: string[] = [];
  const negativeSignals: string[] = [];
  let summary: string | undefined;

  if (intent === "prompt_injection_or_policy_bypass") {
    negativeSignals.push("ignore_previous_instructions", "policy_or_refusal_outcome");
    summary = "Hostile instruction to override policy; not genuine banking intent.";
  } else if (intent === "ambiguous_banking_request") {
    if (
      event.actionType.includes("transfer") ||
      event.actionType.includes("bill") ||
      (event.action.toolName != null && /transfer|pay_bill/.test(event.action.toolName))
    ) {
      matchedSignals.push("transfer_or_payment_verb");
    }
    weakSignals.push("short_message", "question_without_tool_plan");
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
    if (event.action.amount != null || event.action.amountBucket !== "none") {
      matchedSignals.push("amount_detected");
    }
    if (event.action.recipientType !== "none") {
      matchedSignals.push("recipient_detected");
    }
    if (event.action.toolName) {
      matchedSignals.push(`planned_tool:${event.action.toolName}`);
    }
    matchedSignals.push("banking_action_context");
    if (event.outcome === "blocked" || event.outcome === "refused") {
      negativeSignals.push("policy_or_refusal_outcome");
    }
    if (intent === "external_transfer") {
      summary =
        "Planned external transfer of a medium amount to a named recipient; looks like genuine payment intent.";
    } else if (intent === "non_banking_request") {
      summary = "Request is off banking intent; scored as non-banking.";
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

function policyReasons(
  recommendation: PolicyRecommendation,
  intent: ElahBankingIntent,
  status: ScoreStatus,
  financialRisk: number,
): string[] {
  if (recommendation === "review" && intent === "prompt_injection_or_policy_bypass") {
    return ["intentLabel is prompt_injection_or_policy_bypass"];
  }
  if (recommendation === "review" && status === "abstained") {
    return ["status is abstained"];
  }
  if (recommendation === "watch") {
    return [
      `P0 money movement with financialRisk ${financialRisk}; bank confirmation already required.`,
    ];
  }
  return [];
}

export function scoreElahEvent(event: ElahEvent): {
  status: ScoreStatus;
  score: ElahScore;
} {
  const intentLabel = resolveIntentLabel(event);
  const rule = INTENT_RULES[intentLabel] ?? DEFAULT_RULE;
  const confidence = round3(rule.confidence);
  const uncertainty = round3(1 - confidence);
  const status: ScoreStatus = confidence < 0.4 ? "abstained" : rule.status;
  const coordinates = calculateInitialCoordinates(intentLabel, { message: "" });
  const roundedCoordinates = {
    humanAgency: round3(coordinates.humanAgency),
    financialRisk: round3(coordinates.financialRisk),
    emotionalUrgency: round3(coordinates.emotionalUrgency),
  };
  let recommendation = rule.recommendation;
  if (!ALLOWED_RECOMMENDATIONS.has(recommendation)) {
    recommendation = "none";
  }

  const score: ElahScore = {
    elahScore: round3(rule.elahScore),
    confidence,
    uncertainty,
    intentLabel,
    coordinates: roundedCoordinates,
    explanation: buildExplanation(event, intentLabel),
    policyHook: {
      recommendation,
      reasons: uniqueCap(
        policyReasons(
          recommendation,
          intentLabel,
          status,
          roundedCoordinates.financialRisk,
        ),
        16,
        160,
      ),
    },
    provenance: {
      scorer: ELAH_SCORER,
      modelVersion: null,
      labelSource: "rules_v0",
    },
  };

  return { status, score };
}
