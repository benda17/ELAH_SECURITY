/**
 * seed-normal-activity.ts
 *
 * Generates statistically realistic banking activity for the three demo
 * customers. Modeled on published digital-banking usage stats:
 *
 *   - Active digital-banking users check their app ~5–8 sessions / week.
 *   - Most sessions are SHORT (median ~30s, 2–4 actions): a quick balance check.
 *   - Distribution of session intent (industry-average, rough):
 *       70%  Balance / activity check
 *       15%  Transfer or bill pay
 *       7%   Statement / document view
 *       4%   Profile / settings
 *       3%   Card / loan / support
 *       1%   Investment review (premium / vip only)
 *   - Card-transaction frequency:  ~35–55 per month per active spender.
 *   - Recurring patterns: monthly salary credit, monthly rent debit,
 *     ~4 monthly utilities/subscriptions, ~12–18 monthly grocery/dining,
 *     ~6–10 monthly online shopping, ~3–6 monthly fuel/transport, etc.
 *   - Time-of-day: peaks at lunch (12–13h) and evening (19–22h), almost
 *     nothing between 02–06h.  Slight weekday > weekend skew.
 *
 *  IMPORTANT — this script intentionally produces ZERO prompt-injection
 *  content. All memos, descriptions, and notes are mundane real-world strings.
 *
 *  Run with:   npx tsx scripts/seed-normal-activity.ts
 */

import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

// ----- generic helpers ---------------------------------------------------

const rand = Math.random;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function pickWeighted<T>(items: readonly { v: T; w: number }[]): T {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = rand() * total;
  for (const i of items) {
    if ((r -= i.w) < 0) return i.v;
  }
  return items[items.length - 1].v;
}
function randInt(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function sessionToken(): string {
  return randomBytes(8).toString("hex");
}
function ipv4(): string {
  return `${randInt(10, 220)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(2, 254)}`;
}
function ref(): string {
  return `REF-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Weighted hour-of-day matching real banking-app usage curves. */
const HOUR_WEIGHTS: Record<number, number> = {
  0: 0.4, 1: 0.2, 2: 0.05, 3: 0.05, 4: 0.05, 5: 0.1,
  6: 0.5, 7: 1.2, 8: 2.5, 9: 3.5, 10: 3.0, 11: 2.8,
  12: 4.2, 13: 3.9, 14: 2.7, 15: 2.9, 16: 3.2, 17: 3.4,
  18: 4.0, 19: 5.0, 20: 5.5, 21: 4.8, 22: 3.0, 23: 1.4,
};

function realisticTime(daysBack = 30, when?: Date): Date {
  // Pick a day with a slight weekday bias
  let day: Date;
  if (when) {
    day = new Date(when);
  } else {
    while (true) {
      const offset = randInt(0, daysBack);
      const d = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (!isWeekend || rand() < 0.7) {
        day = d;
        break;
      }
    }
  }
  // Hour by weighted distribution
  const hours = Object.entries(HOUR_WEIGHTS).map(([h, w]) => ({
    v: Number(h),
    w,
  }));
  const hour = pickWeighted(hours);
  day.setHours(hour, randInt(0, 59), randInt(0, 59), randInt(0, 999));
  return day;
}

// ----- realistic fixtures (NO injection content) -------------------------

type Payee = {
  name: string;
  category: string;
  min: number;
  max: number;
};

const MERCHANTS_RECURRING_MONTHLY: readonly Payee[] = [
  { name: "Pacific Gas & Electric", category: "utilities", min: 60, max: 200 },
  { name: "Verizon Wireless", category: "utilities", min: 45, max: 130 },
  { name: "Comcast Xfinity", category: "utilities", min: 65, max: 120 },
  { name: "City of Palo Alto Utilities", category: "utilities", min: 55, max: 145 },
  { name: "Netflix", category: "subscriptions", min: 15.49, max: 22.99 },
  { name: "Spotify Family", category: "subscriptions", min: 16.99, max: 16.99 },
  { name: "New York Times", category: "subscriptions", min: 17, max: 25 },
  { name: "iCloud+ Storage", category: "subscriptions", min: 2.99, max: 9.99 },
  { name: "Adobe Creative Cloud", category: "subscriptions", min: 22.99, max: 59.99 },
  { name: "1Password Subscription", category: "subscriptions", min: 4.99, max: 7.99 },
] as const;

const RENT_PAYEES: readonly Payee[] = [
  { name: "Bay Area Property Mgmt", category: "housing", min: 1850, max: 2800 }, // basic
  { name: "Stanford Federal Credit Union — Mortgage", category: "housing", min: 2900, max: 4400 }, // premium
  { name: "Sotheby's Realty — Escrow", category: "housing", min: 6800, max: 12500 }, // vip
] as const;

const SALARY_SOURCES: readonly Payee[] = [
  { name: "Stripe Inc — Payroll", category: "income", min: 2400, max: 3900 }, // basic
  { name: "Salesforce.com — Payroll", category: "income", min: 6500, max: 11500 }, // premium
  { name: "Goldman Sachs — Compensation", category: "income", min: 22500, max: 48000 }, // vip
] as const;

const GROCERIES: readonly Payee[] = [
  { name: "Whole Foods Market", category: "groceries", min: 32, max: 195 },
  { name: "Trader Joe's", category: "groceries", min: 22, max: 110 },
  { name: "Safeway", category: "groceries", min: 18, max: 145 },
  { name: "Costco Wholesale", category: "groceries", min: 65, max: 320 },
  { name: "Berkeley Bowl", category: "groceries", min: 24, max: 130 },
] as const;

const DINING: readonly Payee[] = [
  { name: "Starbucks", category: "dining", min: 4.5, max: 22 },
  { name: "Blue Bottle Coffee", category: "dining", min: 5, max: 18 },
  { name: "Philz Coffee", category: "dining", min: 4.75, max: 16 },
  { name: "Chipotle", category: "dining", min: 11, max: 38 },
  { name: "Sweetgreen", category: "dining", min: 13, max: 28 },
  { name: "Tartine Bakery", category: "dining", min: 6, max: 28 },
  { name: "Mission Chinese", category: "dining", min: 22, max: 95 },
  { name: "Souvla", category: "dining", min: 14, max: 36 },
] as const;

const TRANSPORT: readonly Payee[] = [
  { name: "Shell Gas Station", category: "transport", min: 28, max: 82 },
  { name: "Chevron", category: "transport", min: 30, max: 86 },
  { name: "Uber", category: "transport", min: 9, max: 64 },
  { name: "Lyft", category: "transport", min: 11, max: 58 },
  { name: "BART", category: "transport", min: 3.5, max: 14 },
  { name: "Caltrain", category: "transport", min: 5.5, max: 19 },
] as const;

const SHOPPING: readonly Payee[] = [
  { name: "Amazon.com", category: "shopping", min: 12, max: 240 },
  { name: "Target", category: "shopping", min: 14, max: 180 },
  { name: "Apple Store", category: "shopping", min: 19, max: 1299 },
  { name: "REI Co-op", category: "shopping", min: 28, max: 320 },
  { name: "Best Buy", category: "shopping", min: 22, max: 599 },
  { name: "Etsy", category: "shopping", min: 14, max: 180 },
  { name: "Patagonia", category: "shopping", min: 49, max: 380 },
] as const;

const WELLNESS: readonly Payee[] = [
  { name: "Equinox Membership", category: "wellness", min: 215, max: 320 },
  { name: "Bay Area Yoga Studio", category: "wellness", min: 22, max: 95 },
  { name: "One Medical", category: "wellness", min: 18, max: 220 },
  { name: "Walgreens", category: "wellness", min: 8, max: 65 },
] as const;

const TRAVEL: readonly Payee[] = [
  { name: "United Airlines", category: "travel", min: 145, max: 720 },
  { name: "Marriott", category: "travel", min: 180, max: 540 },
  { name: "Airbnb", category: "travel", min: 95, max: 480 },
  { name: "Delta Airlines", category: "travel", min: 145, max: 820 },
] as const;

const ZELLE_RECIPIENTS = [
  "Zelle — Marcus Hu",
  "Zelle — Priya Singh",
  "Zelle — Olivia Bennett",
  "Zelle — Ethan Caldwell",
  "Zelle — Maya Rivera",
  "Zelle — Jonas Becker",
  "Zelle — Lin Zhao",
] as const;

const INTERNAL_TRANSFERS = [
  "Internal Transfer — Savings",
  "Internal Transfer — Checking",
] as const;

const TRANSFER_NOTES = [
  "Routine transfer",
  "Monthly savings move",
  "Splitting last weekend's bill",
  "Rent split",
  "Birthday gift",
  "Groceries reimbursement",
  "Dinner share",
  "",
  "",
  "",
] as const;

// ----- types -------------------------------------------------------------

type Tier = "basic" | "premium" | "vip";

type CustomerCtx = {
  userId: string;
  customerProfileId: string;
  actorName: string;
  role: string;
  tier: Tier;
  checkingId: string;
  savingsId?: string;
  investmentId?: string;
};

// ----- intent definitions ------------------------------------------------

const SESSION_INTENTS = [
  { v: "balance_check", w: 70 },
  { v: "review_transactions", w: 12 },
  { v: "transfer", w: 9 },
  { v: "document_view", w: 4 },
  { v: "profile_edit", w: 2 },
  { v: "card_view", w: 1 },
  { v: "loan_view", w: 1 },
  { v: "support_view", w: 0.7 },
  { v: "investments_view", w: 0.3 }, // gated to premium/vip below
] as const;

// ----- main --------------------------------------------------------------

async function loadCustomers(): Promise<CustomerCtx[]> {
  const profiles = await prisma.customerProfile.findMany({
    include: { user: true, accounts: true },
  });
  return profiles.map((p) => {
    const checking = p.accounts.find((a) => a.accountType === "checking")!;
    const savings = p.accounts.find((a) => a.accountType === "savings");
    const investment = p.accounts.find((a) => a.accountType === "investment");
    return {
      userId: p.userId,
      customerProfileId: p.id,
      actorName: p.fullName,
      role: p.user.role,
      tier: p.tier as Tier,
      checkingId: checking.id,
      savingsId: savings?.id,
      investmentId: investment?.id,
    };
  });
}

function transferAmount(tier: Tier): number {
  // Conservative — never trips tier limits
  if (tier === "basic") return round2(20 + rand() * 480); // $20–$500
  if (tier === "premium") return round2(50 + rand() * 1950); // $50–$2,000
  return round2(100 + rand() * 4900); // $100–$5,000
}

/** Build a single browsing session keyed by an intent. */
function buildSession(
  c: CustomerCtx,
  intent: (typeof SESSION_INTENTS)[number]["v"],
  startedAt: Date,
) {
  const sessionId = sessionToken();
  const ip = ipv4();
  const cursor = new Date(startedAt);

  const audit: any[] = [];
  const txns: any[] = [];

  const base = {
    actorType: "customer",
    actorId: c.userId,
    actorName: c.actorName,
    role: c.role,
    customerTier: c.tier,
    sessionId,
    ipAddress: ip,
    riskLevel: "low",
    requiresApproval: false,
    approvalStatus: "not_required",
    createdByAgent: false,
  };

  const tick = (minSec = 2, maxSec = 25) => {
    cursor.setSeconds(cursor.getSeconds() + randInt(minSec, maxSec));
    return new Date(cursor);
  };

  // Every session starts with login + dashboard
  audit.push({
    ...base,
    timestamp: new Date(cursor),
    actionType: "login",
    page: "/login",
    toolOrFeatureUsed: "credential_login",
    actionOutcome: "success",
    inputDataSummary: JSON.stringify({ method: "password" }),
  });
  audit.push({
    ...base,
    timestamp: tick(1, 4),
    actionType: "dashboard_view",
    page: "/dashboard",
    toolOrFeatureUsed: "dashboard_overview",
    actionOutcome: "viewed",
  });

  switch (intent) {
    case "balance_check":
      if (rand() < 0.7) {
        audit.push({
          ...base,
          timestamp: tick(),
          actionType: "accounts_view",
          page: "/accounts",
          toolOrFeatureUsed: "accounts_list",
          actionOutcome: "viewed",
        });
      }
      break;

    case "review_transactions":
      audit.push({
        ...base,
        timestamp: tick(),
        actionType: "transactions_view",
        page: "/transactions",
        toolOrFeatureUsed: "transactions_table",
        actionOutcome: "viewed",
      });
      if (rand() < 0.55) {
        audit.push({
          ...base,
          timestamp: tick(),
          actionType: "transactions_search",
          page: "/transactions",
          toolOrFeatureUsed: "transactions_search",
          actionOutcome: "viewed",
          inputDataSummary: JSON.stringify({
            query: pick([
              "amazon",
              "rent",
              "salary",
              "groceries",
              "uber",
              "starbucks",
              "netflix",
              "venmo",
              "transfer",
            ]),
            direction: pick(["all", "debit", "credit"]),
          }),
        });
      }
      break;

    case "transfer": {
      const recipient =
        rand() < 0.6 ? pick(ZELLE_RECIPIENTS) : pick(INTERNAL_TRANSFERS);
      const amount = transferAmount(c.tier);
      const note = pick(TRANSFER_NOTES);

      const draftAt = tick(2, 12);
      audit.push({
        ...base,
        timestamp: draftAt,
        actionType: "transfer_draft_created",
        page: "/transfer",
        toolOrFeatureUsed: "transfer_form",
        actionOutcome: "draft_created",
        amount,
        targetResource: recipient,
        inputDataSummary: JSON.stringify({
          recipient,
          amount,
          currency: "USD",
        }),
      });
      audit.push({
        ...base,
        timestamp: tick(2, 8),
        actionType: "transfer_confirmation_viewed",
        page: "/transfer/confirm",
        toolOrFeatureUsed: "transfer_review",
        actionOutcome: "viewed",
        amount,
        targetResource: recipient,
      });
      const submittedAt = tick(2, 6);
      audit.push({
        ...base,
        timestamp: submittedAt,
        actionType: "transfer_submitted",
        page: "/transfer/confirm",
        toolOrFeatureUsed: "transfer_submit",
        actionOutcome: "success",
        amount,
        targetResource: recipient,
        inputDataSummary: JSON.stringify({
          recipient,
          amount,
          currency: "USD",
          note,
        }),
      });
      txns.push({
        timestamp: submittedAt,
        accountId: c.checkingId,
        description: `${recipient} — transfer`,
        merchantOrRecipient: recipient,
        amount,
        currency: "USD",
        direction: "debit",
        status: "posted",
        category: "transfer",
        reference: ref(),
      });
      break;
    }

    case "document_view": {
      audit.push({
        ...base,
        timestamp: tick(),
        actionType: "document_list_view",
        page: "/documents",
        toolOrFeatureUsed: "documents_list",
        actionOutcome: "viewed",
      });
      if (rand() < 0.55) {
        const title = pick([
          "Statement — Checking — Last month",
          "Statement — Savings — Last month",
          "Tax form 1099-INT — 2025",
          "Account summary — Q1",
          "Year-end summary 2025",
        ]);
        audit.push({
          ...base,
          timestamp: tick(),
          actionType: "document_downloaded",
          page: "/documents",
          toolOrFeatureUsed: "document_download",
          actionOutcome: "success",
          targetResource: title,
          inputDataSummary: JSON.stringify({ title, format: "pdf" }),
        });
      }
      break;
    }

    case "profile_edit":
      audit.push({
        ...base,
        timestamp: tick(),
        actionType: "profile_edit_opened",
        page: "/profile",
        toolOrFeatureUsed: "profile_edit",
        actionOutcome: "viewed",
      });
      if (rand() < 0.25) {
        const changedFields = pick([
          ["phone"],
          ["address"],
          ["phone", "address"],
        ]);
        audit.push({
          ...base,
          timestamp: tick(),
          actionType: "profile_updated",
          page: "/profile",
          toolOrFeatureUsed: "profile_save",
          actionOutcome: "success",
          inputDataSummary: JSON.stringify({ changedFields }),
        });
      }
      break;

    case "card_view":
      audit.push({
        ...base,
        timestamp: tick(),
        actionType: "cards_view",
        page: "/cards",
        toolOrFeatureUsed: "cards_dashboard",
        actionOutcome: "viewed",
      });
      break;

    case "loan_view":
      audit.push({
        ...base,
        timestamp: tick(),
        actionType: "loans_view",
        page: "/loans",
        toolOrFeatureUsed: "loan_dashboard",
        actionOutcome: "viewed",
      });
      break;

    case "support_view":
      audit.push({
        ...base,
        timestamp: tick(),
        actionType: "support_view",
        page: "/support",
        toolOrFeatureUsed: "support_dashboard",
        actionOutcome: "viewed",
      });
      break;

    case "investments_view":
      if (c.tier !== "basic") {
        audit.push({
          ...base,
          // Premium/VIP investment access is intrinsically elevated by the app
          riskLevel: c.tier === "vip" ? "high" : "medium",
          timestamp: tick(),
          actionType: "investments_view",
          page: "/investments",
          toolOrFeatureUsed: "investments_dashboard",
          actionOutcome: "viewed",
        });
      }
      break;
  }

  // Optional logout (mobile users often just leave the app)
  if (rand() < 0.55) {
    audit.push({
      ...base,
      timestamp: tick(8, 60),
      actionType: "logout",
      page: "/dashboard",
      toolOrFeatureUsed: "logout",
      actionOutcome: "success",
    });
  }

  return { audit, txns };
}

/** Generate recurring & one-off card / bill transactions for one customer
 *  over the past `daysBack` days. */
function buildRecurringTransactions(c: CustomerCtx, daysBack: number) {
  const txns: any[] = [];
  const today = new Date();

  const tierIdx: Record<Tier, number> = { basic: 0, premium: 1, vip: 2 };
  const idx = tierIdx[c.tier];

  // --- Monthly salary (1st of month-ish, 1–2x per pay period) ---
  for (let off = 0; off <= daysBack; off += 14 + randInt(-1, 1)) {
    const day = new Date(today.getTime() - off * 24 * 60 * 60 * 1000);
    if (day.getDate() > 28) continue;
    const src = SALARY_SOURCES[idx];
    const amount = round2(src.min + rand() * (src.max - src.min));
    const ts = realisticTime(daysBack, day);
    ts.setHours(8 + randInt(0, 3), randInt(0, 59));
    txns.push({
      timestamp: ts,
      accountId: c.checkingId,
      description: `${src.name} — direct deposit`,
      merchantOrRecipient: src.name,
      amount,
      currency: "USD",
      direction: "credit",
      status: "posted",
      category: "income",
      reference: ref(),
    });
  }

  // --- Monthly rent / mortgage ---
  const rent = RENT_PAYEES[idx];
  for (let off = 1; off < daysBack; off += 30) {
    const day = new Date(today.getTime() - off * 24 * 60 * 60 * 1000);
    day.setDate(Math.min(day.getDate(), 3));
    const ts = realisticTime(daysBack, day);
    txns.push({
      timestamp: ts,
      accountId: c.checkingId,
      description: `${rent.name} — monthly`,
      merchantOrRecipient: rent.name,
      amount: round2(rent.min + rand() * (rent.max - rent.min)),
      currency: "USD",
      direction: "debit",
      status: "posted",
      category: rent.category,
      reference: ref(),
    });
  }

  // --- Monthly utilities & subscriptions (4–7 lines per cycle) ---
  const billCount = randInt(4, 7);
  for (let i = 0; i < billCount; i++) {
    const bill = pick(MERCHANTS_RECURRING_MONTHLY);
    const dayOff = randInt(0, Math.min(28, daysBack));
    const ts = realisticTime(daysBack, new Date(today.getTime() - dayOff * 24 * 60 * 60 * 1000));
    txns.push({
      timestamp: ts,
      accountId: c.checkingId,
      description: `${bill.name} — recurring`,
      merchantOrRecipient: bill.name,
      amount: round2(bill.min + rand() * (bill.max - bill.min)),
      currency: "USD",
      direction: "debit",
      status: "posted",
      category: bill.category,
      reference: ref(),
    });
  }

  // --- Weekly groceries ---
  const groceryRuns = Math.floor(daysBack / 7) + 1;
  for (let i = 0; i < groceryRuns; i++) {
    const dayOff = i * 7 + randInt(-2, 2);
    if (dayOff < 0 || dayOff > daysBack) continue;
    const g = pick(GROCERIES);
    const ts = realisticTime(daysBack, new Date(today.getTime() - dayOff * 24 * 60 * 60 * 1000));
    txns.push({
      timestamp: ts,
      accountId: c.checkingId,
      description: `${g.name} — purchase`,
      merchantOrRecipient: g.name,
      amount: round2(g.min + rand() * (g.max - g.min)),
      currency: "USD",
      direction: "debit",
      status: "posted",
      category: g.category,
      reference: ref(),
    });
  }

  // --- Daily-ish dining (~10–18 / month) ---
  const diningCount = randInt(10, 18) * Math.max(1, daysBack / 30);
  for (let i = 0; i < diningCount; i++) {
    const d = pick(DINING);
    const ts = realisticTime(daysBack);
    txns.push({
      timestamp: ts,
      accountId: c.checkingId,
      description: `${d.name} — purchase`,
      merchantOrRecipient: d.name,
      amount: round2(d.min + rand() * (d.max - d.min)),
      currency: "USD",
      direction: "debit",
      status: "posted",
      category: d.category,
      reference: ref(),
    });
  }

  // --- Transport (~4–8 / month) ---
  const transportCount = randInt(4, 8) * Math.max(1, daysBack / 30);
  for (let i = 0; i < transportCount; i++) {
    const t = pick(TRANSPORT);
    const ts = realisticTime(daysBack);
    txns.push({
      timestamp: ts,
      accountId: c.checkingId,
      description: `${t.name} — purchase`,
      merchantOrRecipient: t.name,
      amount: round2(t.min + rand() * (t.max - t.min)),
      currency: "USD",
      direction: "debit",
      status: "posted",
      category: t.category,
      reference: ref(),
    });
  }

  // --- Shopping (~5–10 / month) ---
  const shopCount = randInt(5, 10) * Math.max(1, daysBack / 30);
  for (let i = 0; i < shopCount; i++) {
    const s = pick(SHOPPING);
    const ts = realisticTime(daysBack);
    txns.push({
      timestamp: ts,
      accountId: c.checkingId,
      description: `${s.name} — purchase`,
      merchantOrRecipient: s.name,
      amount: round2(s.min + rand() * (s.max - s.min)),
      currency: "USD",
      direction: "debit",
      status: "posted",
      category: s.category,
      reference: ref(),
    });
  }

  // --- Wellness (~1–3 / month) ---
  for (let i = 0; i < randInt(1, 3); i++) {
    const w = pick(WELLNESS);
    txns.push({
      timestamp: realisticTime(daysBack),
      accountId: c.checkingId,
      description: `${w.name} — purchase`,
      merchantOrRecipient: w.name,
      amount: round2(w.min + rand() * (w.max - w.min)),
      currency: "USD",
      direction: "debit",
      status: "posted",
      category: w.category,
      reference: ref(),
    });
  }

  // --- Occasional travel (premium+vip more likely) ---
  if (rand() < (c.tier === "basic" ? 0.15 : c.tier === "premium" ? 0.45 : 0.7)) {
    const tr = pick(TRAVEL);
    txns.push({
      timestamp: realisticTime(daysBack),
      accountId: c.checkingId,
      description: `${tr.name} — purchase`,
      merchantOrRecipient: tr.name,
      amount: round2(tr.min + rand() * (tr.max - tr.min)),
      currency: "USD",
      direction: "debit",
      status: "posted",
      category: tr.category,
      reference: ref(),
    });
  }

  return txns;
}

async function main() {
  const customers = await loadCustomers();
  if (customers.length === 0) {
    throw new Error("No customer profiles found — run `npm run db:seed` first.");
  }

  const DAYS_BACK = 30;
  // Active digital banking users: ~5–8 sessions per week
  // → 30 days × ~6/wk = ~25 sessions per customer (varies by tier)
  const SESSIONS_PER_CUSTOMER: Record<Tier, [number, number]> = {
    basic: [16, 24],
    premium: [22, 30],
    vip: [20, 28],
  };

  const auditBatch: any[] = [];
  const txnBatch: { row: any; customerProfileId: string }[] = [];

  for (const c of customers) {
    // --- sessions (audit log activity) ---
    const [minS, maxS] = SESSIONS_PER_CUSTOMER[c.tier];
    const sessionCount = randInt(minS, maxS);
    for (let i = 0; i < sessionCount; i++) {
      const intentRaw = pickWeighted([...SESSION_INTENTS]);
      // gate investments_view to non-basic
      const intent =
        intentRaw === "investments_view" && c.tier === "basic"
          ? "balance_check"
          : intentRaw;
      const startedAt = realisticTime(DAYS_BACK);
      const { audit, txns } = buildSession(c, intent, startedAt);
      auditBatch.push(...audit);
      for (const t of txns) {
        txnBatch.push({
          row: { ...t, customerProfileId: c.customerProfileId },
          customerProfileId: c.customerProfileId,
        });
      }
    }

    // --- recurring + card transactions (independent of sessions) ---
    const recurring = buildRecurringTransactions(c, DAYS_BACK);
    for (const t of recurring) {
      txnBatch.push({
        row: { ...t, customerProfileId: c.customerProfileId },
        customerProfileId: c.customerProfileId,
      });
    }
  }

  // Sort by timestamp for natural-looking order in tables
  auditBatch.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  txnBatch.sort(
    (a, b) => a.row.timestamp.getTime() - b.row.timestamp.getTime(),
  );

  console.log(
    `→ Inserting ${auditBatch.length} audit log entries and ${txnBatch.length} transactions…`,
  );

  await prisma.$transaction([
    prisma.auditLog.createMany({ data: auditBatch }),
    prisma.transaction.createMany({ data: txnBatch.map((t) => t.row) }),
  ]);

  // Quick post-summary
  const [auditTotal, txTotal, perCust, txByCat] = await Promise.all([
    prisma.auditLog.count(),
    prisma.transaction.count(),
    prisma.auditLog.groupBy({
      by: ["actorName"],
      _count: { _all: true },
      where: { actorType: "customer" },
    }),
    prisma.transaction.groupBy({
      by: ["category"],
      _count: { _all: true },
      _sum: { amount: true },
    }),
  ]);

  console.log(`✓ AuditLog total: ${auditTotal}`);
  console.log(`✓ Transaction total: ${txTotal}\n`);

  console.log("Audit actions per customer:");
  for (const row of perCust) {
    console.log(`  ${(row.actorName ?? "Unknown").padEnd(22)} ${row._count._all}`);
  }
  console.log("\nTransactions by category:");
  for (const row of txByCat.sort((a, b) => b._count._all - a._count._all)) {
    const total = (row._sum.amount ?? 0).toFixed(0).padStart(9);
    console.log(
      `  ${row.category.padEnd(15)} ${String(row._count._all).padStart(3)}  $${total}`,
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
