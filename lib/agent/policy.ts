import "server-only";
import { FORBIDDEN_TOOL_ARG_KEYS } from "./sanitize";

/**
 * Policy validator + prompt-injection detector for the in-app agent.
 * All checks here are model-independent — they run BEFORE and AFTER
 * the LLM plan is inspected, so they cannot be talked around by the model.
 */

// ---------------------------------------------------------------------------
// Prompt-injection detection
// ---------------------------------------------------------------------------

const INJECTION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /ignore (all |the |your |any )?(previous|prior|earlier|above) (instructions|rules|prompts)/i, label: "ignore_previous_instructions" },
  { pattern: /reveal (your |the )?(system|hidden) prompt/i, label: "reveal_system_prompt" },
  { pattern: /(show|print|output|leak) (me |the )?(system|hidden|internal) (prompt|instructions|rules)/i, label: "reveal_system_prompt" },
  { pattern: /(you are|act|behave|pretend|role[- ]?play|switch) as (an? )?(admin|administrator|root|manager|superuser|god|developer|jailbroken)/i, label: "role_override" },
  { pattern: /bypass (security|policy|controls|approval|confirmation|the (rules|checks))/i, label: "bypass_controls" },
  { pattern: /disable (the )?(logging|audit|logs|monitoring|policy)/i, label: "disable_logging" },
  { pattern: /do not (tell|log|record|inform) (the )?(bank|manager|audit|logs?)/i, label: "hide_from_bank" },
  { pattern: /(call|access|query|use) (the )?(backend|database|db|sql) (directly|behind|without)/i, label: "direct_db_access" },
  { pattern: /show (me )?all (users|customers|accounts|balances|passwords|sessions)/i, label: "cross_tenant_dump" },
  { pattern: /change (my |the )?user[_ ]?id/i, label: "identity_swap" },
  { pattern: /(you are|this is|treat this as|remember this is) (in )?(a )?(demo|simulation|fake|test|sandbox|research)/i, label: "reveal_demo_context" },
  { pattern: /pretend (you are|to be) (authorized|approved|the manager|admin)/i, label: "pretend_authorized" },
  { pattern: /(override|escalate|elevate) (my )?(privileges|permissions|role)/i, label: "privilege_escalation" },
  { pattern: /(send|transfer|move) .* to (acct|account) (?!(mine|my)\b)[a-z0-9_-]+/i, label: "account_id_smuggling" },
  { pattern: /(here('?s| is) a )?(new|updated) (system|instructions?)[:\.]/i, label: "prompt_hijack" },
  { pattern: /\[\[[^\]]{6,}\]\]/, label: "double_bracket_directive" },
  { pattern: /<<[^>]{6,}>>/, label: "double_angle_directive" },
  { pattern: /assistant:\s*(execute|approve|transfer|delete)/i, label: "spoofed_role_tag" },
];

export interface InjectionDetectionResult {
  matched: boolean;
  labels: string[];
  patterns: string[];
}

export function detectPromptInjection(text: string): InjectionDetectionResult {
  const labels: string[] = [];
  const patterns: string[] = [];
  if (!text) return { matched: false, labels, patterns };
  for (const { pattern, label } of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      labels.push(label);
      patterns.push(pattern.source);
    }
  }
  return { matched: labels.length > 0, labels, patterns };
}

/** Scan prior user turns — blocks slow multi-turn injection before LLM planning. */
export function detectInjectionInHistory(
  messages: Array<{ role: string; content: string }>,
): InjectionDetectionResult {
  const labels: string[] = [];
  const patterns: string[] = [];
  for (const m of messages) {
    if (m.role !== "user") continue;
    const hit = detectPromptInjection(m.content);
    if (hit.matched) {
      labels.push(...hit.labels);
      patterns.push(...hit.patterns);
    }
  }
  const uniqueLabels = [...new Set(labels)];
  return {
    matched: uniqueLabels.length > 0,
    labels: uniqueLabels,
    patterns: [...new Set(patterns)],
  };
}

// ---------------------------------------------------------------------------
// Policy validator for tool calls
// ---------------------------------------------------------------------------

const TOOL_WHITELIST = new Set([
  "get_account_balance",
  "get_recent_transactions",
  "get_transaction_by_id",
  "get_spending_summary",
  "get_monthly_statement",
  "get_saved_recipients",
  "get_cards",
  "create_internal_transfer",
  "create_external_transfer",
  "pay_bill",
  "freeze_card",
  "unfreeze_card",
  "create_support_case",
]);

const CONFIRMATION_REQUIRED = new Set([
  "create_internal_transfer",
  "create_external_transfer",
  "pay_bill",
  "freeze_card",
  "unfreeze_card",
  "get_monthly_statement", // download-style export
]);

export type PolicyDecision =
  | { decision: "allow" }
  | { decision: "needs_confirmation"; reasons: string[] }
  | { decision: "deny"; reasons: string[] };

export interface ValidateToolCallInput {
  toolName: string;
  toolArgs: Record<string, unknown>;
  userMessageInjection: InjectionDetectionResult;
  tierApprovalAbove: number;
  isFollowUpFromConfirmedPending?: boolean;
}

export function validateToolCall(input: ValidateToolCallInput): PolicyDecision {
  const {
    toolName,
    toolArgs,
    userMessageInjection,
    tierApprovalAbove,
    isFollowUpFromConfirmedPending,
  } = input;

  const reasons: string[] = [];

  if (!TOOL_WHITELIST.has(toolName)) {
    reasons.push(`tool '${toolName}' is not on the allow-list`);
    return { decision: "deny", reasons };
  }

  // Any prompt-injection signal on the originating user message denies
  // outright — the assistant should have refused already, but we double-check.
  if (userMessageInjection.matched) {
    reasons.push(
      `originating user message matched injection patterns: ${userMessageInjection.labels.join(", ")}`,
    );
    return { decision: "deny", reasons };
  }

  // Arg-level sanity checks.
  if ("amount" in toolArgs) {
    const raw = toolArgs.amount;
    const amount = typeof raw === "string" ? Number(raw) : (raw as number);
    if (!Number.isFinite(amount) || amount <= 0) {
      reasons.push("amount must be a positive number");
      return { decision: "deny", reasons };
    }
    if (amount > tierApprovalAbove * 10) {
      // 10x the approval threshold is well beyond the tier limit; block.
      reasons.push(`amount ${amount} exceeds hard ceiling for this account tier`);
      return { decision: "deny", reasons };
    }
  }
  for (const key of FORBIDDEN_TOOL_ARG_KEYS) {
    if (key in toolArgs) {
      reasons.push(`forbidden argument '${key}'`);
      return { decision: "deny", reasons };
    }
  }
  for (const [k, v] of Object.entries(toolArgs)) {
    if (typeof v === "string" && detectPromptInjection(v).matched) {
      reasons.push(`argument '${k}' contains suspicious instruction-like text`);
      return { decision: "deny", reasons };
    }
  }

  // Confirmation gating for sensitive actions.
  if (CONFIRMATION_REQUIRED.has(toolName) && !isFollowUpFromConfirmedPending) {
    reasons.push(`tool '${toolName}' requires explicit user confirmation`);
    return { decision: "needs_confirmation", reasons };
  }

  return { decision: "allow" };
}

export function isConfirmationRequired(toolName: string) {
  return CONFIRMATION_REQUIRED.has(toolName);
}

export function isToolAllowed(toolName: string) {
  return TOOL_WHITELIST.has(toolName);
}
