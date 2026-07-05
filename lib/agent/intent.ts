import type { AgentIntent } from "./types";

const CONFIRM = /^(confirm|yes|yes please|proceed|go ahead|do it|ok|okay|approve|approved)\.?$/i;
const CANCEL = /^(cancel|no|stop|never mind|nevermind|abort|don't|do not)\.?$/i;

export function isConfirmMessage(text: string): boolean {
  return CONFIRM.test(text.trim());
}

export function isCancelMessage(text: string): boolean {
  return CANCEL.test(text.trim());
}

/**
 * Lightweight intent classifier used for logging and the rules-based
 * fallback planner when no LLM provider is configured.
 */
export function classifyIntent(message: string): AgentIntent {
  const m = message.trim().toLowerCase();
  if (isConfirmMessage(m)) return "confirm";
  if (isCancelMessage(m)) return "cancel";

  if (
    /\b(balance|how much (do i|money)|what('?s| is) (my )?balance|account balance)\b/.test(m)
  ) {
    return "balance_query";
  }
  if (
    /\b(last \d+|recent|show (my )?transactions|transaction history|latest transactions)\b/.test(m)
  ) {
    return "transaction_search";
  }
  if (
    /\b(spent|spending|spend the most|how much did i spend|category breakdown)\b/.test(m)
  ) {
    return "spending_analysis";
  }
  if (
    /\b(move|transfer|send)\b.+\b(savings|checking|investment|my (savings|checking))\b/.test(m) ||
    /\b(from checking to savings|from savings to checking)\b/.test(m)
  ) {
    return "internal_transfer";
  }
  if (
    /\b(transfer|send|pay)\b.+\b(to [a-z]|recipient)\b/.test(m) &&
    !/\b(bill|electricity|phone|water|biller)\b/.test(m)
  ) {
    if (!/\d/.test(m)) return "ambiguous_request";
    return "external_transfer";
  }
  if (
    /\b(pay (my )?(bill|electricity|phone|water|internet)|bill payment|pay the bill)\b/.test(m)
  ) {
    if (!/\d/.test(m)) return "ambiguous_request";
    return "bill_payment";
  }
  if (/\b(freeze|unfreeze|block|card)\b/.test(m)) {
    return "card_management";
  }
  if (/\b(statement|download (my )?(monthly|latest))\b/.test(m)) {
    return "statement_download";
  }
  if (/\b(support|help (me )?with|open (a )?ticket|contact support)\b/.test(m)) {
    return "support_request";
  }
  if (/\b(recipient|payee|who can i (send|pay))\b/.test(m)) {
    return "recipients_query";
  }
  if (/\b(hi|hello|hey|thanks|thank you|good (morning|afternoon|evening))\b/.test(m) && m.length < 40) {
    return "small_talk";
  }
  if (
    /\b(transfer|send|move|pay)\b/.test(m) &&
    !/\d/.test(m)
  ) {
    return "ambiguous_request";
  }
  if (/\b(show me the account|the account)\b/.test(m) && !/\b(balance|transaction)\b/.test(m)) {
    return "ambiguous_request";
  }

  return "ambiguous_request";
}
