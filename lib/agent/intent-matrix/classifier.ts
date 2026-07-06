import { computeIntentPoint, riskLevelFromVectors } from "./compute-point";
import { INTENT_MATRIX_BY_ID } from "./seed-data";
import type {
  ClassifyAgentIntentInput,
  ClassifyAgentIntentResult,
  IntentVector5,
} from "./types";

export function normalizeIntentMessage(message: string): string {
  return message.trim().toLowerCase().replace(/\s+/g, " ");
}

interface RuleMatch {
  intentId: string;
  score: number;
  signals: string[];
  suspicious?: string[];
}

const INJECTION_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /ignore\s+(all\s+)?previous\s+instructions/, label: "ignore_previous_instructions" },
  { re: /show\s+all\s+users/, label: "show_all_users" },
  { re: /act\s+as\s+admin/, label: "act_as_admin" },
  { re: /disable\s+logging/, label: "disable_logging" },
  { re: /change\s+user\s*id/, label: "change_userid" },
  { re: /bypass\s+confirmation/, label: "bypass_confirmation" },
  { re: /reveal\s+(the\s+)?system\s+prompt/, label: "reveal_system_prompt" },
  { re: /you\s+are\s+now\s+(daniel|admin|root)/, label: "role_override" },
  { re: /dump\s+(the\s+)?database/, label: "dump_database" },
];

function includesAny(text: string, words: string[]): string[] {
  return words.filter((w) => text.includes(w));
}

function scoreRules(text: string): RuleMatch[] {
  const matches: RuleMatch[] = [];

  const injectionHits = INJECTION_PATTERNS.filter((p) => p.re.test(text)).map(
    (p) => p.label,
  );
  if (injectionHits.length > 0) {
    matches.push({
      intentId: "unsafe_prompt_injection",
      score: 0.95 + injectionHits.length * 0.01,
      signals: injectionHits,
      suspicious: injectionHits,
    });
  }

  if (includesAny(text, ["fraud", "stolen", "hacked", "didn't make", "unauthorized charge"]).length) {
    matches.push({
      intentId: "fraud_report",
      score: 0.88,
      signals: ["fraud_language"],
    });
  }

  if (includesAny(text, ["dispute", "chargeback", "don't recognize", "unrecognized charge"]).length) {
    matches.push({
      intentId: "dispute_chargeback",
      score: 0.86,
      signals: ["dispute_language"],
    });
  }

  if (includesAny(text, ["unfreeze", "unblock card", "reactivate card"]).length) {
    matches.push({ intentId: "card_unfreeze", score: 0.84, signals: ["card_unfreeze_words"] });
  } else if (includesAny(text, ["freeze", "block card", "lost card", "stolen card"]).length) {
    matches.push({ intentId: "card_freeze", score: 0.84, signals: ["card_freeze_words"] });
  }

  if (includesAny(text, ["statement", "download", "pdf", "monthly report"]).length) {
    matches.push({ intentId: "statement_download", score: 0.82, signals: ["statement_words"] });
  }

  if (includesAny(text, ["every month", "monthly payment", "standing order", "recurring"]).length) {
    matches.push({ intentId: "scheduled_payment", score: 0.8, signals: ["scheduled_words"] });
  }

  if (
    includesAny(text, ["bill", "electricity", "water", "arnona", "phone bill", "utility"]).length
  ) {
    matches.push({ intentId: "bill_payment", score: 0.78, signals: ["bill_words"] });
  }

  const ownAccount =
    includesAny(text, [
      "my savings",
      "my checking",
      "between my accounts",
      "own account",
      "to savings",
      "from checking to savings",
      "internal transfer",
    ]).length > 0;
  const externalWords = includesAny(text, [
    "send ",
    "pay ",
    "wire",
    "transfer to",
    "send to",
  ]);
  if (ownAccount) {
    matches.push({ intentId: "internal_transfer", score: 0.76, signals: ["own_account_transfer"] });
  } else if (externalWords.length > 0) {
    matches.push({ intentId: "external_transfer", score: 0.74, signals: externalWords });
  } else if (includesAny(text, ["transfer", "move money"]).length) {
    matches.push({ intentId: "external_transfer", score: 0.62, signals: ["generic_transfer"] });
  }

  if (includesAny(text, ["balance", "how much money", "account amount", "how much do i have"]).length) {
    matches.push({ intentId: "balance_awareness", score: 0.9, signals: ["balance_words"] });
  }

  if (includesAny(text, ["transactions", "recent activity", "charges", "recent payments"]).length) {
    matches.push({ intentId: "recent_transactions", score: 0.85, signals: ["transaction_words"] });
  }

  if (includesAny(text, ["spend", "expenses", "category", "food", "spending summary"]).length) {
    matches.push({ intentId: "spending_understanding", score: 0.83, signals: ["spending_words"] });
  }

  if (includesAny(text, ["my cards", "payment card", "which card"]).length) {
    matches.push({ intentId: "payment_card_review", score: 0.7, signals: ["card_review_words"] });
  }

  if (includesAny(text, ["overdraft", "fee", "negative balance", "interest charge"]).length) {
    matches.push({ intentId: "fee_overdraft_complaint", score: 0.75, signals: ["fee_words"] });
  }

  if (includesAny(text, ["apply for", "submit", "borrow", "loan application"]).length) {
    matches.push({ intentId: "loan_application", score: 0.78, signals: ["loan_apply_words"] });
  } else if (includesAny(text, ["loan", "mortgage", "credit"]).length) {
    matches.push({ intentId: "loan_inquiry", score: 0.72, signals: ["loan_inquiry_words"] });
  }

  if (includesAny(text, ["savings", "deposit", "sweep", "put aside", "put money aside"]).length) {
    matches.push({ intentId: "savings_optimization", score: 0.71, signals: ["savings_words"] });
  }

  if (includesAny(text, ["stock", "securities", "buy shares", "sell shares", "trade"]).length) {
    matches.push({ intentId: "securities_trading", score: 0.8, signals: ["securities_words"] });
  }

  if (includesAny(text, ["atm", "branch", "cash withdrawal", "nearest branch"]).length) {
    matches.push({ intentId: "atm_branch_help", score: 0.68, signals: ["atm_branch_words"] });
  }

  if (includesAny(text, ["change phone", "change email", "update address", "password", "settings"]).length) {
    matches.push({ intentId: "profile_settings_update", score: 0.77, signals: ["profile_settings_words"] });
  }

  if (includesAny(text, ["human", "representative", "talk to someone", "contact support", "help me"]).length) {
    matches.push({ intentId: "support_escalation", score: 0.65, signals: ["support_words"] });
  }

  return matches;
}

function toolHintIntent(toolName?: string | null): string | null {
  if (!toolName) return null;
  const map: Record<string, string> = {
    get_account_balance: "balance_awareness",
    get_recent_transactions: "recent_transactions",
    get_transaction_by_id: "recent_transactions",
    get_spending_summary: "spending_understanding",
    get_cards: "payment_card_review",
    create_internal_transfer: "internal_transfer",
    create_external_transfer: "external_transfer",
    pay_bill: "bill_payment",
    get_monthly_statement: "statement_download",
    freeze_card: "card_freeze",
    unfreeze_card: "card_unfreeze",
    create_support_case: "support_escalation",
    get_saved_recipients: "external_transfer",
  };
  return map[toolName] ?? null;
}

function buildResult(
  intentId: string,
  confidence: number,
  matchedSignals: string[],
  suspiciousPatterns: string[],
  explanation: string,
  vectorOverrides?: { H?: IntentVector5; B?: IntentVector5; S?: IntentVector5 },
): ClassifyAgentIntentResult {
  const seed = INTENT_MATRIX_BY_ID.get(intentId)!;
  const H = vectorOverrides?.H ?? seed.H;
  const B = vectorOverrides?.B ?? seed.B;
  const S = vectorOverrides?.S ?? seed.S;
  const point = computeIntentPoint(H, B, S);
  const riskLevel = riskLevelFromVectors(intentId, S, point.y);

  return {
    intentId,
    confidence: Math.min(0.99, Math.max(0.35, confidence)),
    H,
    B,
    S,
    point,
    requiresConfirmation: seed.requiresConfirmation,
    riskLevel,
    explanation,
    matchedSignals,
    suspiciousPatterns,
  };
}

/**
 * Rules-first intent classifier for the Human Intent Matrix.
 * Structured for future LLM backend swap — keep this signature stable.
 */
export function classifyAgentIntent(
  input: ClassifyAgentIntentInput,
): ClassifyAgentIntentResult {
  const normalized = normalizeIntentMessage(input.message);
  const rules = scoreRules(normalized);
  rules.sort((a, b) => b.score - a.score);

  const toolHint = toolHintIntent(input.toolCallContext?.toolName);
  if (toolHint && rules.length === 0) {
    return buildResult(
      toolHint,
      0.55,
      [`tool_context:${input.toolCallContext?.toolName}`],
      [],
      `Inferred from tool context (${input.toolCallContext?.toolName}).`,
    );
  }

  if (rules.length === 0) {
    return buildResult(
      "support_escalation",
      0.45,
      ["fallback_general"],
      [],
      "No strong keyword match; classified as general support intent.",
    );
  }

  const top = rules[0]!;
  const seed = INTENT_MATRIX_BY_ID.get(top.intentId)!;
  return buildResult(
    top.intentId,
    top.score,
    top.signals,
    top.suspicious ?? [],
    `Matched ${seed.label} via ${top.signals.join(", ")}.`,
  );
}
