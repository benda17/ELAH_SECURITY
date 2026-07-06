import phraseBank from "../data/assistant-phrase-bank.json";

export type PhraseBankKey = keyof typeof phraseBank;

export type DatasetActionSample = {
  actionType: string;
  amountIls?: number | null;
  inputDataSummary?: Record<string, unknown>;
  userIntent?: string | null;
  /** Stable key (e.g. logId) to pick a consistent but varied phrase per row */
  seedKey?: string;
};

/** Actions that should remain direct audit rows (not assistant chat). */
export const DIRECT_AUDIT_ACTIONS = new Set(["login", "logout"]);

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pickFromList(phrases: string[], seedKey?: string): string {
  if (phrases.length === 0) return "";
  if (!seedKey) {
    return phrases[Math.floor(Math.random() * phrases.length)]!;
  }
  return phrases[hashSeed(seedKey) % phrases.length]!;
}

function fillTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    String(vars[key] ?? ""),
  );
}

function billHint(sample: DatasetActionSample): string {
  const cat = sample.inputDataSummary?.["merchantCategory"];
  if (typeof cat === "string") {
    if (/util|electric/i.test(cat)) return "electricity bill";
    if (/phone|mobile/i.test(cat)) return "phone bill";
    if (/water/i.test(cat)) return "water bill";
  }
  const merchant = sample.inputDataSummary?.["merchantOrRecipient"];
  if (typeof merchant === "string" && merchant.length > 0) {
    return merchant.toLowerCase();
  }
  return "phone bill";
}

function recipientName(sample: DatasetActionSample): string | null {
  const fromInput = sample.inputDataSummary?.["merchantOrRecipient"];
  if (typeof fromInput === "string" && fromInput.trim().length > 0) {
    return fromInput.trim().split(/\s+/).slice(0, 2).join(" ");
  }
  return null;
}

function phraseKeyForAction(actionType: string): PhraseBankKey | null {
  switch (actionType) {
    case "account_balance_viewed":
      return "account_balance_viewed";
    case "transactions_viewed":
    case "transaction_search_filtered":
      return actionType as PhraseBankKey;
    case "card_payment":
    case "mobile_wallet_payment":
      return "spending_summary";
    case "dashboard_viewed":
      return "dashboard_greeting";
    case "bill_payment":
      return "bill_payment";
    case "internal_transfer":
      return "internal_transfer";
    case "external_transfer":
    case "transfer_approved":
    case "transfer_rejected":
      return "external_transfer";
    case "statement_downloaded":
    case "document_downloaded":
    case "document_list_viewed":
      return "statement_download";
    case "support_ticket_created":
      return "support_escalation";
    case "investment_viewed":
      return "investment_viewed";
    default:
      return null;
  }
}

export function pickConfirmPhrase(seedKey?: string): string {
  return pickFromList(phraseBank.confirm_action, seedKey);
}

export function isAssistantSeedAction(actionType: string): boolean {
  if (DIRECT_AUDIT_ACTIONS.has(actionType)) return false;
  return datasetActionToAssistantMessage({
    actionType,
    amountIls: null,
    inputDataSummary: {},
  }) !== null;
}

export function datasetActionToAssistantMessage(
  sample: DatasetActionSample,
): string | null {
  const amount =
    sample.amountIls != null && sample.amountIls > 0
      ? Math.round(sample.amountIls)
      : null;

  const key = phraseKeyForAction(sample.actionType);
  if (!key) return null;

  const phrases = phraseBank[key];
  if (!phrases?.length) return null;

  const seed = sample.seedKey ?? `${sample.actionType}-${amount ?? 0}`;

  if (key === "dashboard_greeting") {
    const base = pickFromList(phrases, seed);
    return sample.userIntent ? `${base.split("?")[0]} — ${sample.userIntent}` : base;
  }

  if (key === "bill_payment") {
    return fillTemplate(pickFromList(phrases, seed), {
      bill: billHint(sample),
      amount: amount ?? 120,
    });
  }

  if (key === "internal_transfer") {
    return fillTemplate(pickFromList(phrases, seed), {
      amount: amount ?? 100,
    });
  }

  if (key === "external_transfer") {
    const recipient = recipientName(sample);
    if (!amount || !recipient) return null;
    return fillTemplate(pickFromList(phrases, seed), {
      amount,
      recipient,
    });
  }

  return pickFromList(phrases, seed);
}

/** All phrase variants grouped by banking action */
export function getAssistantPhraseBank() {
  return phraseBank;
}
