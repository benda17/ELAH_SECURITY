/**
 * seed-more-activity.ts
 *
 * Generates additional banking activity for the customers already in the
 * database without wiping anything. Use this to "make the users keep
 * doing things" once `seed-from-dataset.ts` has set up the baseline.
 *
 * It learns each customer's action mix from the published behavior dataset
 * (matching by customerNumber → cust_XXXX), then samples new actions from
 * that customer's own template (or the global customer pool as fallback)
 * and re-times them as fresh sessions in a recent window. Money-event
 * actions get matching Transaction rows pointed at the customer's checking
 * account.
 *
 * Tunables (all optional environment variables):
 *
 *   EXTEND_DAYS                – window of recent days to spread activity over.
 *                                Default 14. Use 1 for "burst of today's traffic".
 *   SESSIONS_PER_CUSTOMER      – number of session bursts per customer.
 *                                Default 12.
 *   ACTIONS_PER_SESSION_MIN    – lower bound on actions in each burst. Default 3.
 *   ACTIONS_PER_SESSION_MAX    – upper bound on actions in each burst. Default 8.
 *
 * Run with:   npm run seed:more
 *      (or)  EXTEND_DAYS=7 SESSIONS_PER_CUSTOMER=20 npm run seed:more
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

const DATASET_PATH = join(
  __dirname,
  "..",
  "elah_banking_human_behavior_training_dataset_v2.json",
);
const CHUNK_SIZE = 1000;

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

function pickWeightedHour(): number {
  // Same shape as the public dataset: peak around lunch + early afternoon,
  // light overnight tail, near-zero pre-dawn.
  const buckets: Array<{ hour: number; w: number }> = [
    { hour: 0, w: 3 }, { hour: 1, w: 4 }, { hour: 2, w: 2 }, { hour: 3, w: 2 },
    { hour: 4, w: 1 }, { hour: 5, w: 0.3 }, { hour: 6, w: 0.1 }, { hour: 7, w: 0.1 },
    { hour: 8, w: 0.5 }, { hour: 9, w: 1.5 }, { hour: 10, w: 9 }, { hour: 11, w: 11 },
    { hour: 12, w: 12 }, { hour: 13, w: 10 }, { hour: 14, w: 9 }, { hour: 15, w: 8 },
    { hour: 16, w: 7 }, { hour: 17, w: 7 }, { hour: 18, w: 3 }, { hour: 19, w: 2 },
    { hour: 20, w: 4 }, { hour: 21, w: 3 }, { hour: 22, w: 3 }, { hour: 23, w: 4 },
  ];
  const total = buckets.reduce((s, b) => s + b.w, 0);
  let r = Math.random() * total;
  for (const b of buckets) {
    r -= b.w;
    if (r <= 0) return b.hour;
  }
  return 12;
}

function sessionStartWithinWindow(): Date {
  const now = new Date();
  const dayOffset = randInt(0, EXTEND_DAYS - 1);
  const start = new Date(now);
  start.setDate(start.getDate() - dayOffset);
  start.setHours(pickWeightedHour(), randInt(0, 59), randInt(0, 59), 0);
  // Never schedule into the future on today
  if (start.getTime() > now.getTime()) {
    start.setTime(now.getTime() - randInt(0, 3600) * 1000);
  }
  return start;
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

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function randomIp(): string {
  return `198.51.100.${randInt(10, 240)}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(
    `[1/4] Loading dataset (template pool, ~11.4k actions)…`,
  );
  const dataset = JSON.parse(readFileSync(DATASET_PATH, "utf-8")) as Dataset;

  // Build per-customer template pools, plus a global customer pool.
  const logsByDatasetProfile = new Map<string, DatasetAuditLog[]>();
  const globalCustomerPool: DatasetAuditLog[] = [];
  for (const log of dataset.auditLogs) {
    if (log.actorType !== "customer" || !log.customerProfileId) continue;
    globalCustomerPool.push(log);
    const arr = logsByDatasetProfile.get(log.customerProfileId) ?? [];
    arr.push(log);
    logsByDatasetProfile.set(log.customerProfileId, arr);
  }

  console.log(
    `      window=${EXTEND_DAYS}d  sessions/customer=${SESSIONS_PER_CUSTOMER}  actions/session=${ACTIONS_PER_SESSION_MIN}–${ACTIONS_PER_SESSION_MAX}`,
  );

  console.log(`[2/4] Loading existing customers…`);
  const customers = await prisma.customerProfile.findMany({
    include: {
      user: true,
      accounts: { where: { accountType: "checking" } },
    },
  });
  if (customers.length === 0) {
    console.log("No customers in DB — run `npm run seed:dataset` first.");
    return;
  }
  console.log(`      ${customers.length} customers found`);

  console.log(`[3/4] Generating new sessions and actions…`);
  type AuditPayload = Parameters<
    typeof prisma.auditLog.createMany
  >[0]["data"][number];
  type TxPayload = Parameters<
    typeof prisma.transaction.createMany
  >[0]["data"][number];

  const auditBatch: AuditPayload[] = [];
  const txBatch: TxPayload[] = [];

  let sessionCounter = 0;
  for (const customer of customers) {
    const datasetKey = customer.customerNumber.toLowerCase();
    const personalPool = logsByDatasetProfile.get(datasetKey);
    const pool =
      personalPool && personalPool.length >= ACTIONS_PER_SESSION_MAX
        ? personalPool
        : globalCustomerPool;
    if (pool.length === 0) continue;

    const checking = customer.accounts[0];

    for (let s = 0; s < SESSIONS_PER_CUSTOMER; s += 1) {
      sessionCounter += 1;
      const sessionId = `sess_ext_${sessionCounter.toString().padStart(7, "0")}`;
      const ip = randomIp();
      const startedAt = sessionStartWithinWindow();
      const nActions = randInt(ACTIONS_PER_SESSION_MIN, ACTIONS_PER_SESSION_MAX);

      // Build the session: open with a login, mix the body from the template,
      // close with a logout. This matches the shape of the dataset.
      const body: DatasetAuditLog[] = [];
      for (let i = 0; i < nActions; i += 1) {
        body.push(pool[Math.floor(Math.random() * pool.length)]);
      }
      const intent = body[0]?.userIntent ?? "review transactions";

      let cursor = startedAt.getTime();
      const stepMs = () => randInt(8, 180) * 1000; // 8 s – 3 min between clicks

      // Login as the opener
      auditBatch.push({
        timestamp: new Date(cursor),
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
      cursor += stepMs();

      for (const sample of body) {
        const ts = new Date(cursor);
        const inputJson =
          sample.inputDataSummary && Object.keys(sample.inputDataSummary).length > 0
            ? JSON.stringify(sample.inputDataSummary)
            : null;
        auditBatch.push({
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
          userIntent: intent,
          actionOutcome: sample.actionOutcome ?? "viewed",
          reasonForFlagging: null,
          createdByAgent: false,
        });

        if (
          checking &&
          MONEY_EVENT_TYPES.has(sample.actionType) &&
          sample.amountIls != null
        ) {
          const isCredit = CREDIT_EVENT_TYPES.has(sample.actionType);
          const cat =
            (sample.inputDataSummary?.["merchantCategory"] as string | undefined) ??
            undefined;
          txBatch.push({
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
            reference: `ext_${sessionId}_${auditBatch.length}`,
          });
        }

        cursor += stepMs();
      }

      // Logout as the closer
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

  console.log(
    `      generated ${auditBatch.length.toLocaleString()} audit logs and ${txBatch.length.toLocaleString()} transactions`,
  );

  console.log(`[4/4] Inserting…`);
  let inserted = 0;
  for (const batch of chunk(auditBatch, CHUNK_SIZE)) {
    await prisma.auditLog.createMany({ data: batch });
    inserted += batch.length;
    process.stdout.write(
      `      audit logs: ${inserted}/${auditBatch.length}\r`,
    );
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
