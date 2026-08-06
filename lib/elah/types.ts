export const ELAH_BANKING_INTENTS = [
  "balance_awareness",
  "recent_transactions",
  "spending_summary",
  "internal_transfer",
  "external_transfer",
  "bill_payment",
  "scheduled_payment",
  "statement_download",
  "card_freeze",
  "card_unfreeze",
  "fraud_report",
  "dispute_chargeback",
  "fee_or_overdraft_question",
  "loan_inquiry",
  "loan_application",
  "savings_optimization",
  "profile_update",
  "support_escalation",
  "ambiguous_banking_request",
  "non_banking_request",
  "prompt_injection_or_policy_bypass",
] as const;

export type ElahBankingIntent = (typeof ELAH_BANKING_INTENTS)[number];

export type ElahLabelSource = "rules_v0" | "intent_matrix" | "backfill" | "manual";

export type ElahActionOutcome =
  | "executed"
  | "blocked"
  | "cancelled"
  | "failed"
  | "pending_confirmation"
  | "conversational"
  | "refused";

export interface ElahExplanationSignals {
  matchedSignals: string[];
  weakSignals: string[];
  negativeSignals: string[];
}

export interface ElahTrainingContext {
  message: string;
  plannedTool?: string | null;
  toolArgs?: Record<string, unknown> | null;
  matrixIntentId?: string | null;
  matrixConfidence?: number | null;
  matrixMatchedSignals?: string[];
  matrixSuspiciousPatterns?: string[];
  actionOutcome?: ElahActionOutcome;
}

export interface AssistantInteractionInput {
  appId?: string;
  userId: string;
  sessionId?: string | null;
  conversationId: string;
  messageId: string;
  userQuestion: string;
  assistantAnswer: string;
  previousUserMessages?: string[];
  previousAssistantMessages?: string[];
  plannedTool?: string | null;
  executedTool?: string | null;
  toolArgs?: Record<string, unknown> | null;
  toolResultSummary?: string | null;
  actionOutcome: ElahActionOutcome;
  userHadActiveSession?: boolean;
  mfaStatus?: string;
  matrixIntentId?: string | null;
  matrixConfidence?: number | null;
  matrixCoordinates?: { x: number; y: number; z: number } | null;
  matrixMatchedSignals?: string[];
  matrixSuspiciousPatterns?: string[];
  labelSource?: ElahLabelSource;
  notes?: string | null;
  createdAt?: Date;
}

export interface ElahTrainingEventFilters {
  finalIntent?: string;
  labelSource?: string;
  minScore?: number;
  maxScore?: number;
  from?: Date;
  to?: Date;
  actionOutcome?: string;
  limit?: number;
  offset?: number;
}
