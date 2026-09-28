/**
 * Closed ElahEvent 1.0 vocabularies. Client-safe (no server imports).
 * `lib/elah/envelope.ts` re-exports these; import from here in client code.
 */

export const ELAH_ACTION_TYPES = [
  "login",
  "login_failed",
  "logout",
  "password_reset",
  "internal_transfer",
  "external_transfer",
  "bill_payment",
  "card_freeze",
  "card_unfreeze",
  "statement_download",
  "account_balance_read",
  "transactions_read",
  "transaction_lookup",
  "spending_summary",
  "recipients_read",
  "cards_read",
  "support_case_created",
  "document_download",
  "document_bulk_download",
  "profile_update",
  "card_request",
  "loan_application",
  "prompt_injection",
] as const;

export type ElahActionType = (typeof ELAH_ACTION_TYPES)[number];

export const ELAH_TOOL_NAMES = [
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
] as const;

export type ElahToolName = (typeof ELAH_TOOL_NAMES)[number];

export const ELAH_SOURCES = ["ui", "agent", "system"] as const;

export const ELAH_OUTCOMES = [
  "executed",
  "blocked",
  "cancelled",
  "failed",
  "pending_confirmation",
  "conversational",
  "refused",
  "session",
] as const;
