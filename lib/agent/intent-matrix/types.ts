export type IntentVector5 = [number, number, number, number, number];

export type IntentRiskLevel = "low" | "medium" | "high" | "critical";

export type IntentActionStatus =
  | "classified"
  | "pending_confirmation"
  | "confirmed"
  | "executed"
  | "blocked"
  | "failed"
  | "cancelled";

export interface IntentMatrixSeedDefinition {
  intentId: string;
  label: string;
  examples: string[];
  H: IntentVector5;
  B: IntentVector5;
  S: IntentVector5;
  x: number;
  y: number;
  z: number;
  baselineWeight: number;
  requiresConfirmation: boolean;
  allowedTools: string[];
  policyAction: string;
}

export interface ClassifyAgentIntentInput {
  message: string;
  conversationContext?: {
    conversationId?: string;
    recentMessages?: Array<{ role: string; content: string }>;
  };
  toolCallContext?: {
    toolName?: string | null;
    toolArgs?: Record<string, unknown>;
    policyDecision?: string | null;
  };
}

export interface ClassifyAgentIntentResult {
  intentId: string;
  confidence: number;
  H: IntentVector5;
  B: IntentVector5;
  S: IntentVector5;
  point: { x: number; y: number; z: number };
  requiresConfirmation: boolean;
  riskLevel: IntentRiskLevel;
  explanation: string;
  matchedSignals: string[];
  suspiciousPatterns: string[];
}

export interface RecordIntentEventInput {
  userId: string;
  sessionId: string | null;
  conversationId: string;
  messageId: string;
  rawUserMessage: string;
  classification: ClassifyAgentIntentResult;
  toolName?: string | null;
  toolArgsSanitized?: Record<string, unknown> | null;
  policyDecision?: string | null;
  actionStatus?: IntentActionStatus;
}
