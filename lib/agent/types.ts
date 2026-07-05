import type { SessionUser } from "@/lib/auth/session";

export type AgentIntent =
  | "balance_query"
  | "transaction_search"
  | "spending_analysis"
  | "internal_transfer"
  | "external_transfer"
  | "bill_payment"
  | "card_management"
  | "statement_download"
  | "support_request"
  | "recipients_query"
  | "small_talk"
  | "confirm"
  | "cancel"
  | "unsafe_request"
  | "prompt_injection_attempt"
  | "ambiguous_request";

export interface ToolContext {
  user: SessionUser;
  profileId: string;
  ipAddress: string;
  userAgent?: string;
  sessionCookieId: string | null;
  conversationId: string;
}

export interface ToolResult {
  ok: boolean;
  summary: string; // short natural-language summary of the outcome
  data?: unknown; // structured payload (safe to show)
  error?: string; // failure reason if !ok
  auditLogId?: string;
}

export interface ToolDefinition<Args = Record<string, unknown>> {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: false;
  };
  requiresConfirmation: boolean;
  /** Category is used for logging + policy classification only. */
  category:
    | "read"
    | "money_move"
    | "card_control"
    | "document_export"
    | "support";
  /** Given the args returned by the LLM, produce a compact human summary
   * suitable for showing in a confirmation prompt (e.g. "Transfer ₪250 to Daniel Cohen"). */
  summarize: (args: Args, ctx: ToolContext) => Promise<string>;
  /** Perform the actual backend work. Must re-check ownership. */
  execute: (args: Args, ctx: ToolContext) => Promise<ToolResult>;
}

export interface AgentPlan {
  /** Human-readable reply. Always present, even when a tool call is planned. */
  reply: string;
  /** Detected intent for logging and downstream policy checks. */
  intent: AgentIntent;
  /** Optional tool call the agent wants to perform. */
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  /** If true, do NOT execute the tool call; just refuse safely. */
  refuse?: boolean;
  /** True when the model reused the built-in rules-based planner because
   * no LLM provider was configured. */
  usedFallback: boolean;
}

export interface AgentChatRequestBody {
  message: string;
  conversationId?: string;
}

export interface AgentPendingActionView {
  id: string;
  actionType: string;
  toolName: string;
  summary: string;
  createdAt: string;
  expiresAt: string;
  status: string;
}

export interface AgentChatResponseBody {
  ok: boolean;
  conversationId: string;
  messageId: string;
  reply: string;
  intent: AgentIntent;
  toolCalls: Array<{
    name: string;
    summary: string;
    ok: boolean;
    data?: unknown;
    error?: string;
  }>;
  pendingAction: AgentPendingActionView | null;
  refused: boolean;
  error?: string;
}
