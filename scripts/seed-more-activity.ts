/**
 * seed-more-activity.ts
 *
 * Appends additional banking activity to the database without wiping
 * anything. There are two modes:
 *
 *   1. EXACT-COUNT mode  (recommended)
 *      Pass a positive integer and the script will produce exactly that
 *      many audit-log rows, sampled from the published JSON dataset.
 *      The sample naturally inherits the dataset's statistics:
 *        - which customer performed it (per-customer share)
 *        - what action was taken (per-action-type share)
 *        - which hour of the day (hour-of-day distribution)
 *        - which device/page/intent (joint distribution per row)
 *      Money-event actions also produce matching Transaction rows.
 *
 *        npm run seed:more -- 5000          # exactly 5,000 actions
 *        TOTAL_ACTIONS=5000 npm run seed:more
 *        npx tsx scripts/seed-more-activity.ts 5000
 *
 *   2. SESSION-BURST mode (legacy)
 *      If no count is given, each customer performs
 *        SESSIONS_PER_CUSTOMER * (ACTIONS_PER_SESSION ± noise)
 *      actions wrapped in login/logout. Useful when you want a fixed
 *      number of sessions per user instead of a fixed total.
 *
 *        npm run seed:more
 *        SESSIONS_PER_CUSTOMER=20 npm run seed:more
 *
 * Other tunables (env, both modes):
 *   EXTEND_DAYS                window of recent days to spread activity over.
 *                              Default 14. Use 1 for "burst of today's traffic".
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

const DATASET_PATH = join(
  __dirname,
  "..",
  "elah_banking_human_behavior_training_dataset_v2.json",
);
const CHUNK_SIZE = 1000;

const cliArg = process.argv[2];
const TOTAL_ACTIONS_RAW = process.env.TOTAL_ACTIONS ?? cliArg;
const TOTAL_ACTIONS = TOTAL_ACTIONS_RAW ? Number(TOTAL_ACTIONS_RAW) : null;

const EXTEND_DAYS = Number(process.env.EXTEND_DAYS ?? 14);
const SESSIONS_PER_CUSTOMER = Number(process.env.SESSIONS_PER_CUSTOMER ?? 12);
const ACTIONS_PER_SESSION_MIN = Number(process.env.ACTIONS_PER_SESSION_MIN ?? 3);
const ACTIONS_PER_SESSION_MAX = Number(process.env.ACTIONS_PER_SESSION_MAX ?? 8);

// ---------------------------------------------------------------------------
// Types (subset of the dataset we actually use here)
// ---------------------------------------------------------------------------

type DatasetAuditLog = {
  logId: string;
  timestamp: string;
  actorType: string;
  actorId: string;
  customerProfileId?: string;
  actionType: string;
  page?: string;
  toolOrFeatureUsed?: string;
  inputDataSummary?: Record<string, unknown>;
  targetResource?: string | null;
  amountIls?: number | null;
  riskLevel: string;
  requiresApproval: boolean;
  approvalStatus: string;
  deviceChannel?: string;
  userIntent?: string;
  actionOutcome: string;
  role?: string;
};

type Dataset = {
  auditLogs: DatasetAuditLog[];
};

type DbCustomer = Awaited<
  ReturnType<typeof prisma.customerProfile.findMany<{
    include: { user: true; accounts: true };
  }>>
>[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONEY_EVENT_TYPES = new Set([
  "card_payment",
  "mobile_wallet_payment",
  "bill_payment",
  "internal_transfer",
  "external_transfer",
  "transfer_approved",
  "transfer_rejected",
  "loan_approved",
  "loan_rejected",
]);

const CREDIT_EVENT_TYPES = new Set([
  "loan_approved",
  "salary_credit",
  "refund_received",
]);

function randInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function randomIp(): string {
  return `198.51.100.${randInt(10, 240)}`;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function buildWeightedHourPicker(pool: DatasetAuditLog[]): () => number {
  const w = new Array(24).fill(0);
  for (const log of pool) {
    const h = new Date(log.timestamp).getUTCHours();
    w[h] += 1;
  }
  const total = w.reduce((s, x) => s + x, 0) || 1;
  return () => {
    let r = Math.random() * total;
    for (let h = 0; h < 24; h += 1) {
      r -= w[h];
      if (r <= 0) return h;
    }
    return 12;
  };
}

function timestampInWindow(hourPicker: () => number): Date {
  const now = new Date();
  const dayOffset = randInt(0, EXTEND_DAYS - 1);
  const t = new Date(now);
  t.setDate(t.getDate() - dayOffset);
  t.setHours(hourPicker(), randInt(0, 59), randInt(0, 59), 0);
  if (t.getTime() > now.getTime()) {
    t.setTime(now.getTime() - randInt(0, 3600) * 1000);
  }
  return t;
}

function descriptionForMoneyEvent(actionType: string, cat?: string): string {
  switch (actionType) {
    case "card_payment":
    case "mobile_wallet_payment":
      return `Card payment${cat ? ` - ${cat}` : ""}`;
    case "bill_payment":
      return "Bill payment";
    case "internal_transfer":
      return "Internal transfer between accounts";
    case "external_transfer":
      return "External transfer";
    case "transfer_approved":
      return "Approved transfer";
    case "transfer_rejected":
      return "Rejected transfer";
    case "loan_approved":
      return "Loan disbursement";
    case "loan_rejected":
      return "Rejected loan request";
    default:
      return actionType.replace(/_/g, " ");
  }
}

function categoryForLog(log: DatasetAuditLog): string {
  const fromInput = log.inputDataSummary?.["merchantCategory"];
  if (typeof fromInput === "string" && fromInput.length > 0) return fromInput;
  switch (log.actionType) {
    case "card_payment":
    case "mobile_wallet_payment":
      return "shopping";
    case "bill_payment":
      return "bills";
    case "internal_transfer":
      return "transfer_internal";
    case "external_transfer":
    case "transfer_approved":
    case "transfer_rejected":
      return "transfer_external";
    case "loan_approved":
    case "loan_rejected":
      return "loan";
    default:
      return "other";
  }
}

function merchantFor(log: DatasetAuditLog): string {
  const fromInput = log.inputDataSummary?.["merchantOrRecipient"];
  if (typeof fromInput === "string" && fromInput.length > 0) return fromInput;
  const cat = log.inputDataSummary?.["merchantCategory"];
  if (typeof cat === "string") {
    const map: Record<string, string> = {
      groceries: "SuperMarket",
      utilities: "Utility Co.",
      fuel: "Gas Station",
      restaurants: "Local Restaurant",
      transport: "Public Transit",
      online_shopping: "Online Retailer",
      entertainment: "Entertainment Provider",
      health: "Pharmacy",
    };
    return map[cat] ?? cat;
  }
  switch (log.actionType) {
    case "external_transfer":
    case "transfer_approved":
    case "transfer_rejected":
      return "External recipient";
    case "internal_transfer":
      return "Own savings account";
    case "bill_payment":
      return "Biller";
    case "loan_approved":
    case "loan_rejected":
      return "Loan account";
    default:
      return "Unknown";
  }
}

  type AuditPayload = Prisma.AuditLogCreateManyInput;
  type TxPayload = Prisma.TransactionCreateManyInput;

function emitAuditFromSample(
  sample: DatasetAuditLog,
  customer: DbCustomer,
  sessionId: string,
  ip: string,
  ts: Date,
): AuditPayload {
  const inputJson =
    sample.inputDataSummary && Object.keys(sample.inputDataSummary).length > 0
      ? JSON.stringify(sample.inputDataSummary)
      : null;
  return {
    timestamp: ts,
    actorType: "customer",
    actorId: customer.userId,
    actorName: customer.fullName,
    role: `${customer.tier}_customer`,
    customerTier: customer.tier,
    actionType: sample.actionType,
    page: sample.page ?? null,
    toolOrFeatureUsed: sample.toolOrFeatureUsed ?? null,
    inputDataSummary: inputJson,
    targetResource: sample.targetResource ?? null,
    amount: sample.amountIls ?? null,
    riskLevel: sample.riskLevel ?? "low",
    requiresApproval: Boolean(sample.requiresApproval),
    approvalStatus: sample.approvalStatus ?? "not_required",
    sessionId,
    ipAddress: ip,
    userIntent: sample.userIntent ?? null,
    actionOutcome: sample.actionOutcome ?? "viewed",
    reasonForFlagging: null,
    createdByAgent: false,
  };
}

function maybeEmitTransaction(
  sample: DatasetAuditLog,
  customer: DbCustomer,
  ts: Date,
  refKey: string,
): TxPayload | null {
  if (!MONEY_EVENT_TYPES.has(sample.actionType)) return null;
  if (sample.amountIls == null) return null;
  const checking = customer.accounts.find((a) => a.accountType === "checking");
  if (!checking) return null;
  const isCredit = CREDIT_EVENT_TYPES.has(sample.actionType);
  const cat = sample.inputDataSummary?.["merchantCategory"] as string | undefined;
  return {
    accountId: checking.id,
    customerProfileId: customer.id,
    timestamp: ts,
    description: descriptionForMoneyEvent(sample.actionType, cat),
    merchantOrRecipient: merchantFor(sample),
    amount: Math.abs(sample.amountIls),
    currency: "ILS",
    direction: isCredit ? "credit" : "debit",
    status: sample.actionType.endsWith("_rejected") ? "blocked" : "posted",
    category: categoryForLog(sample),
    reference: refKey,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("[1/4] Loading dataset…");
  const dataset = JSON.parse(readFileSync(DATASET_PATH, "utf-8")) as Dataset;

  const customerLogPool = dataset.auditLogs.filter(
    (l) => l.actorType === "customer" && !!l.customerProfileId,
  );
  const logsByDatasetProfile = new Map<string, DatasetAuditLog[]>();
  for (const log of customerLogPool) {
    const arr = logsByDatasetProfile.get(log.customerProfileId!) ?? [];
    arr.push(log);
    logsByDatasetProfile.set(log.customerProfileId!, arr);
  }
  const hourPicker = buildWeightedHourPicker(customerLogPool);

  console.log(`      ${customerLogPool.length.toLocaleString()} customer-actor logs in template pool`);

  console.log("[2/4] Loading existing customers from DB…");
  const customers: DbCustomer[] = await prisma.customerProfile.findMany({
    include: { user: true, accounts: true },
  });
  if (customers.length === 0) {
    console.log("No customers in DB — run `npm run seed:dataset` first.");
    return;
  }
  const customerByDatasetKey = new Map<string, DbCustomer>();
  for (const c of customers) {
    customerByDatasetKey.set(c.customerNumber.toLowerCase(), c);
  }
  console.log(`      ${customers.length} customers loaded`);

  const auditBatch: AuditPayload[] = [];
  const txBatch: TxPayload[] = [];
  let sessionCounter = 0;
  const nextSessionId = () =>
    `sess_more_${(++sessionCounter).toString().padStart(7, "0")}`;

  if (TOTAL_ACTIONS && Number.isFinite(TOTAL_ACTIONS) && TOTAL_ACTIONS > 0) {
    // -------- Mode A: exact-count sampling from JSON statistics --------
    console.log(
      `[3/4] EXACT-COUNT mode: generating ${TOTAL_ACTIONS.toLocaleString()} actions ` +
        `over the last ${EXTEND_DAYS}d (distribution follows JSON statistics)…`,
    );

    // Sample N actions uniformly with replacement from the pool. Because each
    // pool entry already encodes (customer × actionType × hour × payload),
    // this single weighted draw inherits all per-feature frequencies from
    // the JSON without us having to compute them by hand.
    const samples: DatasetAuditLog[] = new Array(TOTAL_ACTIONS);
    for (let i = 0; i < TOTAL_ACTIONS; i += 1) {
      samples[i] = customerLogPool[Math.floor(Math.random() * customerLogPool.length)];
    }

    // Group by dataset customer so we can wrap consecutive samples in a
    // shared session id (more realistic than a fresh session per row).
    const byCustomer = new Map<string, DatasetAuditLog[]>();
    for (const s of samples) {
      const arr = byCustomer.get(s.customerProfileId!) ?? [];
      arr.push(s);
      byCustomer.set(s.customerProfileId!, arr);
    }

    let skipped = 0;
    for (const [datasetKey, slice] of byCustomer) {
      const customer = customerByDatasetKey.get(datasetKey);
      if (!customer) {
        skipped += slice.length;
        continue;
      }
      // Walk slice in 3–8 chunks, each chunk gets a single session
      let i = 0;
      while (i < slice.length) {
        const sessionLen = Math.min(randInt(3, 8), slice.length - i);
        const sessionId = nextSessionId();
        const ip = randomIp();
        const start = timestampInWindow(hourPicker).getTime();
        let cursor = start;
        for (let j = 0; j < sessionLen; j += 1) {
          const sample = slice[i + j];
          const ts = new Date(cursor);
          auditBatch.push(emitAuditFromSample(sample, customer, sessionId, ip, ts));
          const tx = maybeEmitTransaction(
            sample,
            customer,
            ts,
            `more_${sessionId}_${j}`,
          );
          if (tx) txBatch.push(tx);
          cursor += randInt(8, 180) * 1000;
        }
        i += sessionLen;
      }
    }
    if (skipped > 0) {
      console.log(
        `      (skipped ${skipped} samples whose dataset customer is not in this DB)`,
      );
    }
  } else {
    // -------- Mode B: legacy session-burst per customer --------
    console.log(
      `[3/4] SESSION-BURST mode: ${SESSIONS_PER_CUSTOMER} sessions/customer ` +
        `× ${ACTIONS_PER_SESSION_MIN}–${ACTIONS_PER_SESSION_MAX} actions, window=${EXTEND_DAYS}d…`,
    );

    for (const customer of customers) {
      const datasetKey = customer.customerNumber.toLowerCase();
      const personalPool = logsByDatasetProfile.get(datasetKey);
      const pool =
        personalPool && personalPool.length >= ACTIONS_PER_SESSION_MAX
          ? personalPool
          : customerLogPool;
      if (pool.length === 0) continue;

      for (let s = 0; s < SESSIONS_PER_CUSTOMER; s += 1) {
        const sessionId = nextSessionId();
        const ip = randomIp();
        const start = timestampInWindow(hourPicker).getTime();
        const nActions = randInt(ACTIONS_PER_SESSION_MIN, ACTIONS_PER_SESSION_MAX);

        // login opener
        const opener = pool[0];
        const intent = opener?.userIntent ?? "review transactions";
        const tOpen = new Date(start);
        auditBatch.push({
          timestamp: tOpen,
          actorType: "customer",
          actorId: customer.userId,
          actorName: customer.fullName,
          role: `${customer.tier}_customer`,
          customerTier: customer.tier,
          actionType: "login",
          page: "/login",
          toolOrFeatureUsed: "credential_login",
          inputDataSummary: null,
          targetResource: customer.id,
          amount: null,
          riskLevel: "low",
          requiresApproval: false,
          approvalStatus: "not_required",
          sessionId,
          ipAddress: ip,
          userIntent: intent,
          actionOutcome: "success",
          reasonForFlagging: null,
          createdByAgent: false,
        });

        let cursor = start + randInt(8, 180) * 1000;
        for (let i = 0; i < nActions; i += 1) {
          const sample = pool[Math.floor(Math.random() * pool.length)];
          const ts = new Date(cursor);
          auditBatch.push(emitAuditFromSample(sample, customer, sessionId, ip, ts));
          const tx = maybeEmitTransaction(
            sample,
            customer,
            ts,
            `more_${sessionId}_${i}`,
          );
          if (tx) txBatch.push(tx);
          cursor += randInt(8, 180) * 1000;
        }

        // logout closer
        auditBatch.push({
          timestamp: new Date(cursor),
          actorType: "customer",
          actorId: customer.userId,
          actorName: customer.fullName,
          role: `${customer.tier}_customer`,
          customerTier: customer.tier,
          actionType: "logout",
          page: "/logout",
          toolOrFeatureUsed: "session_end",
          inputDataSummary: null,
          targetResource: customer.id,
          amount: null,
          riskLevel: "low",
          requiresApproval: false,
          approvalStatus: "not_required",
          sessionId,
          ipAddress: ip,
          userIntent: intent,
          actionOutcome: "success",
          reasonForFlagging: null,
          createdByAgent: false,
        });
      }
    }
  }

  console.log(
    `      generated ${auditBatch.length.toLocaleString()} audit logs and ${txBatch.length.toLocaleString()} transactions`,
  );

  console.log("[4/4] Inserting…");
  let inserted = 0;
  for (const batch of chunk(auditBatch, CHUNK_SIZE)) {
    await prisma.auditLog.createMany({ data: batch });
    inserted += batch.length;
    process.stdout.write(`      audit logs: ${inserted}/${auditBatch.length}\r`);
  }
  process.stdout.write("\n");

  inserted = 0;
  for (const batch of chunk(txBatch, CHUNK_SIZE)) {
    await prisma.transaction.createMany({ data: batch });
    inserted += batch.length;
    process.stdout.write(`      transactions: ${inserted}/${txBatch.length}\r`);
  }
  process.stdout.write("\n");

  const auditTotal = await prisma.auditLog.count();
  const txTotal = await prisma.transaction.count();
  console.log(
    `\n=== Done ===\nAuditLog total now: ${auditTotal.toLocaleString()}\nTransaction total now: ${txTotal.toLocaleString()}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
