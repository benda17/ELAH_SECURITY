import { createHash } from "crypto";
import type {
  ElahBankingIntent,
  ElahExplanationSignals,
  ElahTrainingContext,
} from "./types";

const MATRIX_TO_TRAINING_INTENT: Record<string, ElahBankingIntent> = {
  balance_awareness: "balance_awareness",
  recent_transactions: "recent_transactions",
  spending_understanding: "spending_summary",
  payment_card_review: "recent_transactions",
  internal_transfer: "internal_transfer",
  external_transfer: "external_transfer",
  bill_payment: "bill_payment",
  scheduled_payment: "scheduled_payment",
  statement_download: "statement_download",
  card_freeze: "card_freeze",
  card_unfreeze: "card_unfreeze",
  fraud_report: "fraud_report",
  dispute_chargeback: "dispute_chargeback",
  fee_overdraft_complaint: "fee_or_overdraft_question",
  loan_inquiry: "loan_inquiry",
  loan_application: "loan_application",
  savings_optimization: "savings_optimization",
  profile_settings_update: "profile_update",
  support_escalation: "support_escalation",
  unsafe_prompt_injection: "prompt_injection_or_policy_bypass",
  securities_trading: "loan_inquiry",
  atm_branch_help: "support_escalation",
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

export function hashUserId(userId: string): string {
  const salt = process.env.ELAH_HASH_SALT ?? "elah-banking-demo-v1";
  return createHash("sha256").update(`${salt}:${userId}`).digest("hex").slice(0, 32);
}

export function sanitizeToolArgs(
  toolArgs: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!toolArgs) return {};
  const forbidden = new Set([
    "userId",
    "customerProfileId",
    "profileId",
    "actorId",
    "sessionId",
    "accountId",
    "fromAccountId",
    "toAccountId",
    "password",
    "token",
    "cardId",
  ]);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(toolArgs)) {
    if (forbidden.has(key)) continue;
    if (typeof value === "string" && /^\d{8,}$/.test(value.replace(/\D/g, ""))) {
      out[key] = "[redacted_account_number]";
      continue;
    }
    if (typeof value === "string" && value.length > 120) {
      out[key] = `${value.slice(0, 120)}…`;
      continue;
    }
    if (/recipient|merchant|name/i.test(key) && typeof value === "string") {
      out[key] = "[recipient_redacted]";
      continue;
    }
    out[key] = value;
  }
  return out;
}

function parseAmount(text: string, toolArgs?: Record<string, unknown> | null): number | null {
  const fromArgs = toolArgs?.amount ?? toolArgs?.transferAmount;
  if (typeof fromArgs === "number" && fromArgs > 0) return fromArgs;
  if (typeof fromArgs === "string") {
    const n = Number(fromArgs.replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  const m = text.match(/(?:₪|nis|shekel|shekels|\bils\b)?\s*(\d[\d,]*(?:\.\d+)?)/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function detectAmountBucket(
  message: string,
  toolArgs?: Record<string, unknown> | null,
): string {
  const amount = parseAmount(message, toolArgs);
  if (amount == null) return "none";
  if (amount < 100) return "micro_1_99";
  if (amount < 500) return "small_100_499";
  if (amount < 2000) return "medium_500_1999";
  if (amount < 10000) return "large_2000_9999";
  return "very_large_10000_plus";
}

export function detectRecipientType(
  message: string,
  toolArgs?: Record<string, unknown> | null,
): string {
  const lower = message.toLowerCase();
  if (/electric|water|phone|utility|bill|arnona|bezeq|iec/i.test(lower)) {
    return "utility";
  }
  if (/my savings|my checking|between my accounts|to savings|to checking/i.test(lower)) {
    return "self";
  }
  if (toolArgs?.recipientType && typeof toolArgs.recipientType === "string") {
    return toolArgs.recipientType;
  }
  if (/\b(to|send|pay)\s+[A-Za-z]/i.test(message)) return "person_name";
  if (/\b(company|ltd|inc|shop|store)\b/i.test(lower)) return "business";
  if (toolArgs?.recipient || toolArgs?.merchantOrRecipient) return "saved_payee";
  return "none";
}

export function detectAccountContext(
  message: string,
  toolArgs?: Record<string, unknown> | null,
): string {
  const lower = message.toLowerCase();
  const accountType = toolArgs?.accountType ?? toolArgs?.fromAccountType;
  if (typeof accountType === "string") {
    if (/savings/i.test(accountType)) return "savings";
    if (/checking/i.test(accountType)) return "checking";
    if (/investment/i.test(accountType)) return "investment";
    if (/all/i.test(accountType)) return "all";
  }
  if (/savings/i.test(lower) && /checking/i.test(lower)) return "checking_and_savings";
  if (/savings/i.test(lower)) return "savings";
  if (/checking/i.test(lower)) return "checking";
  if (/investment/i.test(lower)) return "investment";
  if (/all accounts|every account/i.test(lower)) return "all";
  return "unspecified";
}

export function detectInitialIntent(
  message: string,
  plannedTool?: string | null,
  matrixIntentId?: string | null,
): ElahBankingIntent {
  if (matrixIntentId && MATRIX_TO_TRAINING_INTENT[matrixIntentId]) {
    return MATRIX_TO_TRAINING_INTENT[matrixIntentId];
  }
  if (plannedTool && TOOL_TO_INTENT[plannedTool]) {
    return TOOL_TO_INTENT[plannedTool];
  }
  const lower = message.trim().toLowerCase();
  if (/^(hi|hello|hey|thanks|thank you|good morning)\b/.test(lower)) {
    return "non_banking_request";
  }
  if (/\b(balance|how much money|account total)\b/.test(lower)) {
    return "balance_awareness";
  }
  if (/\b(recent|last \d+|transaction history)\b/.test(lower)) {
    return "recent_transactions";
  }
  if (/\b(spent|spending|expenses)\b/.test(lower)) {
    return "spending_summary";
  }
  if (/\b(transfer|send|pay|wire)\b/.test(lower)) {
    return "ambiguous_banking_request";
  }
  return "ambiguous_banking_request";
}

export function calculateInitialCoordinates(
  intent: ElahBankingIntent,
  context: ElahTrainingContext,
): { humanAgency: number; financialRisk: number; emotionalUrgency: number } {
  if (context.matrixCoordinates) {
    return {
      humanAgency: round3(context.matrixCoordinates.x),
      financialRisk: round3(context.matrixCoordinates.y),
      emotionalUrgency: round3(context.matrixCoordinates.z),
    };
  }

  const defaults: Record<
    ElahBankingIntent,
    { humanAgency: number; financialRisk: number; emotionalUrgency: number }
  > = {
    balance_awareness: { humanAgency: 0.28, financialRisk: 0.12, emotionalUrgency: 0.18 },
    recent_transactions: { humanAgency: 0.3, financialRisk: 0.16, emotionalUrgency: 0.2 },
    spending_summary: { humanAgency: 0.32, financialRisk: 0.18, emotionalUrgency: 0.22 },
    internal_transfer: { humanAgency: 0.62, financialRisk: 0.42, emotionalUrgency: 0.28 },
    external_transfer: { humanAgency: 0.72, financialRisk: 0.78, emotionalUrgency: 0.35 },
    bill_payment: { humanAgency: 0.68, financialRisk: 0.65, emotionalUrgency: 0.3 },
    scheduled_payment: { humanAgency: 0.66, financialRisk: 0.6, emotionalUrgency: 0.26 },
    statement_download: { humanAgency: 0.4, financialRisk: 0.22, emotionalUrgency: 0.18 },
    card_freeze: { humanAgency: 0.7, financialRisk: 0.48, emotionalUrgency: 0.55 },
    card_unfreeze: { humanAgency: 0.68, financialRisk: 0.4, emotionalUrgency: 0.42 },
    fraud_report: { humanAgency: 0.58, financialRisk: 0.62, emotionalUrgency: 0.82 },
    dispute_chargeback: { humanAgency: 0.6, financialRisk: 0.58, emotionalUrgency: 0.78 },
    fee_or_overdraft_question: { humanAgency: 0.45, financialRisk: 0.35, emotionalUrgency: 0.48 },
    loan_inquiry: { humanAgency: 0.52, financialRisk: 0.38, emotionalUrgency: 0.24 },
    loan_application: { humanAgency: 0.64, financialRisk: 0.55, emotionalUrgency: 0.32 },
    savings_optimization: { humanAgency: 0.58, financialRisk: 0.38, emotionalUrgency: 0.22 },
    profile_update: { humanAgency: 0.55, financialRisk: 0.28, emotionalUrgency: 0.2 },
    support_escalation: { humanAgency: 0.42, financialRisk: 0.15, emotionalUrgency: 0.52 },
    ambiguous_banking_request: { humanAgency: 0.35, financialRisk: 0.25, emotionalUrgency: 0.3 },
    non_banking_request: { humanAgency: 0.12, financialRisk: 0.08, emotionalUrgency: 0.1 },
    prompt_injection_or_policy_bypass: {
      humanAgency: 0.15,
      financialRisk: 0.92,
      emotionalUrgency: 0.25,
    },
  };

  return defaults[intent];
}

export function calculateInitialElahScore(
  intent: ElahBankingIntent,
  context: ElahTrainingContext,
): number {
  let score = context.matrixConfidence ?? 0.55;

  if (intent === "prompt_injection_or_policy_bypass") score = Math.max(score, 0.12);
  if (intent === "non_banking_request") score = Math.min(score, 0.35);
  if (intent === "ambiguous_banking_request") score = Math.min(score, 0.62);

  if (context.plannedTool) score += 0.08;
  if (context.actionOutcome === "executed") score += 0.05;
  if (context.actionOutcome === "blocked" || context.actionOutcome === "refused") {
    score -= 0.15;
  }
  if (detectAmountBucket(context.message, context.toolArgs ?? null) !== "none") {
    score += 0.04;
  }
  if (detectRecipientType(context.message, context.toolArgs ?? null) !== "none") {
    score += 0.03;
  }

  return round3(Math.min(0.99, Math.max(0.05, score)));
}

export function extractExplanationSignals(
  message: string,
  plannedTool?: string | null,
  context?: ElahTrainingContext,
): ElahExplanationSignals {
  const matchedSignals: string[] = [];
  const weakSignals: string[] = [];
  const negativeSignals: string[] = [];

  const lower = message.toLowerCase();
  if (/\b(transfer|send|pay|move|wire)\b/.test(lower)) {
    matchedSignals.push("transfer_or_payment_verb");
  }
  if (/\d/.test(message)) matchedSignals.push("amount_detected");
  if (/\b(to|for)\s+[A-Za-z]/.test(message)) matchedSignals.push("recipient_detected");
  if (plannedTool) matchedSignals.push(`planned_tool:${plannedTool}`);
  if (/\b(balance|transaction|card|bill|statement|loan|savings)\b/.test(lower)) {
    matchedSignals.push("banking_action_context");
  }

  if (context?.matrixMatchedSignals?.length) {
    matchedSignals.push(...context.matrixMatchedSignals.slice(0, 6));
  }
  if (message.trim().split(/\s+/).length < 4) {
    weakSignals.push("short_message");
  }
  if (!plannedTool && /\?/.test(message)) {
    weakSignals.push("question_without_tool_plan");
  }
  if (context?.matrixSuspiciousPatterns?.length) {
    negativeSignals.push(...context.matrixSuspiciousPatterns.slice(0, 6));
  }
  if (context?.actionOutcome === "blocked" || context?.actionOutcome === "refused") {
    negativeSignals.push("policy_or_refusal_outcome");
  }

  return {
    matchedSignals: [...new Set(matchedSignals)],
    weakSignals: [...new Set(weakSignals)],
    negativeSignals: [...new Set(negativeSignals)],
  };
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
