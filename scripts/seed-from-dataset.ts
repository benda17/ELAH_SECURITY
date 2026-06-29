/**
 * seed-from-dataset.ts
 *
 * Wipes all user-action and customer/account data from the local SQLite DB
 * and re-seeds everything from the open-data fixture file
 *   `elah_banking_human_behavior_training_dataset_v2.json`
 *
 * The dataset is a synthetic-but-realistic ~589k-line JSON published with the
 * project that contains:
 *   - 20 customer avatars (Israeli demographics, ILS balances, persona traits)
 *   -  5 staff users (managers, security reviewers, demo AI agent)
 *   - 48 bank accounts (checking / savings / investment per customer)
 *   - 11,356 audit-log rows with realistic banking actions
 *   - 120 documents, 62 support tickets, 20 manager notes, 90 approval requests
 *
 * Running this script gives the banking app + analytics dashboard a fresh
 * dataset of "real" (open-source-derived) user behavior, replacing whatever
 * was previously generated.
 *
 *   Run with:   npx tsx scripts/seed-from-dataset.ts
 *               (or)  npm run seed:dataset
 */

import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

const DATASET_PATH = join(
  __dirname,
  "..",
  "elah_banking_human_behavior_training_dataset_v2.json",
);
const DEFAULT_PASSWORD = "DemoPass123!";
const CHUNK_SIZE = 1000;

// ---------------------------------------------------------------------------
// Dataset type shapes (only the fields we actually use)
// ---------------------------------------------------------------------------

type DatasetCustomer = {
  userId: string;
  customerProfileId: string;
  avatarName: string;
  age: number;
  gender: string;
  city: string;
  region: string;
  occupation: string;
  customerTier: string;
  monthlyIncomeIls: number;
  checkingBalanceIls: number;
  savingsBalanceIls: number;
  investmentBalanceIls: number;
  dailyTransferLimitIls: number;
  digitalComfort: string;
  riskTolerance: string;
  preferredChannel: string;
  usualLoginHours: string;
};

type DatasetStaff = {
  userId: string;
  avatarName: string;
  role: string; // bank_manager | security_reviewer | ai_agent
  department: string;
};

type DatasetAccount = {
  accountId: string;
  customerProfileId: string;
  userId: string;
  accountType: string;
  currency: string;
  accountNumberMasked: string;
  currentBalanceIls: number;
  availableBalanceIls: number;
  status: string;
  dailyTransferLimitIls: number;
};

type DatasetAuditLog = {
  logId: string;
  timestamp: string;
  actorType: string;
  actorId: string;
  actorName?: string;
  role?: string;
  customerProfileId?: string;
  customerAvatarName?: string;
  customerTier?: string;
  actionType: string;
  page?: string;
  toolOrFeatureUsed?: string;
  inputDataSummary?: Record<string, unknown>;
  targetResource?: string | null;
  amountIls?: number | null;
  riskLevel: string;
  requiresApproval: boolean;
  approvalStatus: string;
  sessionId?: string;
  ipAddressSimulated?: string;
  deviceChannel?: string;
  userIntent?: string;
  actionOutcome: string;
  reasonForFlagging?: string | null;
  createdByAgent: boolean;
};

type DatasetDocument = {
  documentId: string;
  customerProfileId: string;
  userId: string;
  documentType: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  sensitivityLevel: string;
  availableToTier: string;
  metadataSummary: string;
  downloadUrlMock: string;
};

type DatasetTicket = {
  ticketId: string;
  customerProfileId: string;
  category: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  riskFlags: string[];
  createdAt: string;
};

type DatasetManagerNote = {
  noteId: string;
  customerProfileId: string;
  managerId: string;
  noteBody: string;
  category: string;
  visibility: string;
  containsPromptInjectionTest: boolean;
  createdAt: string;
};

type DatasetApproval = {
  approvalRequestId: string;
  requestType: string;
  targetResourceId: string;
  customerProfileId: string;
  requestedByActorType: string;
  requestedByActorId: string;
  assignedManagerId?: string;
  amountIls?: number | null;
  riskLevel: string;
  status: string;
  decision?: string | null;
  decisionReason?: string | null;
  createdAt: string;
};

type Dataset = {
  customers: DatasetCustomer[];
  staffUsers: DatasetStaff[];
  accounts: DatasetAccount[];
  auditLogs: DatasetAuditLog[];
  documents: DatasetDocument[];
  supportTickets: DatasetTicket[];
  managerNotes: DatasetManagerNote[];
  approvalRequests: DatasetApproval[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const usedEmails = new Set<string>();

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, ".")
    .replace(/\.{2,}/g, ".");
}

function emailFor(name: string): string {
  const base = slugifyName(name) || "user";
  let candidate = `${base}@elah.demo`;
  let i = 2;
  while (usedEmails.has(candidate)) {
    candidate = `${base}${i}@elah.demo`;
    i += 1;
  }
  usedEmails.add(candidate);
  return candidate;
}

function dobForAge(age: number, idx: number): Date {
  const now = new Date();
  const year = now.getFullYear() - age;
  const month = idx % 12;
  const day = ((idx * 7) % 27) + 1;
  return new Date(Date.UTC(year, month, day));
}

function phoneFor(idx: number): string {
  const middle = String(1000000 + (idx * 91237) % 8999999).slice(-7);
  return `+972 5${(idx % 6) + 1}-${middle.slice(0, 3)}-${middle.slice(3)}`;
}

function addressFor(city: string, idx: number): string {
  const streetNames = [
    "Herzl",
    "Rothschild",
    "Allenby",
    "Ben Yehuda",
    "Dizengoff",
    "Jabotinsky",
    "Weizmann",
    "Hertzliya",
    "Hapalmach",
    "Bialik",
    "Sokolov",
    "King George",
  ];
  const street = streetNames[idx % streetNames.length];
  const num = ((idx * 13) % 180) + 1;
  return `${num} ${street} St, ${city}, Israel`;
}

function customerRoleFor(tier: string): string {
  switch (tier) {
    case "vip":
      return "vip_customer";
    case "premium":
      return "premium_customer";
    default:
      return "regular_customer";
  }
}

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

function transactionStatusFor(actionType: string): string {
  if (actionType.endsWith("_rejected")) return "blocked";
  if (actionType === "transfer_approved" || actionType === "loan_approved") return "posted";
  return "posted";
}

function descriptionForMoneyEvent(log: DatasetAuditLog): string {
  switch (log.actionType) {
    case "card_payment":
    case "mobile_wallet_payment":
      return `Card payment${log.inputDataSummary?.["merchantCategory"] ? ` - ${log.inputDataSummary["merchantCategory"]}` : ""}`;
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
      return log.actionType.replace(/_/g, " ");
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("[1/8] Loading dataset…");
  const dataset = JSON.parse(readFileSync(DATASET_PATH, "utf-8")) as Dataset;
  console.log(
    `      customers=${dataset.customers.length}  staff=${dataset.staffUsers.length}  accounts=${dataset.accounts.length}  auditLogs=${dataset.auditLogs.length}`,
  );

  console.log("[2/8] Wiping user-action data…");
  // Delete in FK-dependency order. We are wiping EVERYTHING customer-related,
  // including their accounts, transactions, and audit logs.
  await prisma.transaction.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.managerNote.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.cardRequest.deleteMany();
  await prisma.loanRequest.deleteMany();
  await prisma.document.deleteMany();
  await prisma.riskEvent.deleteMany();
  await prisma.agentActionLog.deleteMany();

  console.log("[3/8] Wiping accounts / customer profiles / users…");
  await prisma.bankAccount.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcryptjs.hash(DEFAULT_PASSWORD, 10);
  usedEmails.clear();

  console.log("[4/8] Creating staff users…");
  const staffIdMap = new Map<string, string>();
  const staffEmails: Array<{ name: string; email: string; role: string }> = [];
  for (const staff of dataset.staffUsers) {
    const email = emailFor(staff.avatarName);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: staff.avatarName,
        role: staff.role,
        status: "active",
      },
    });
    staffIdMap.set(staff.userId, user.id);
    staffEmails.push({ name: staff.avatarName, email, role: staff.role });
  }

  const managerIds = dataset.staffUsers
    .filter((s) => s.role === "bank_manager")
    .map((s) => staffIdMap.get(s.userId)!)
    .filter(Boolean);

  console.log("[5/8] Creating customers and profiles…");
  const userIdMap = new Map<string, string>();
  const profileIdMap = new Map<string, string>();
  const customerEmails: Array<{ name: string; email: string; tier: string }> = [];
  for (const [idx, c] of dataset.customers.entries()) {
    const email = emailFor(c.avatarName);
    const dob = dobForAge(c.age, idx);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: c.avatarName,
        role: customerRoleFor(c.customerTier),
        status: "active",
        customerProfile: {
          create: {
            customerNumber: c.customerProfileId.toUpperCase(),
            tier: c.customerTier,
            fullName: c.avatarName,
            dateOfBirth: dob,
            email,
            phone: phoneFor(idx),
            address: addressFor(c.city, idx),
            employmentStatus: c.occupation,
            riskRating: "standard",
            assignedManagerId: managerIds[idx % managerIds.length] ?? null,
          },
        },
      },
      include: { customerProfile: true },
    });
    userIdMap.set(c.userId, user.id);
    if (user.customerProfile) {
      profileIdMap.set(c.customerProfileId, user.customerProfile.id);
    }
    customerEmails.push({ name: c.avatarName, email, tier: c.customerTier });
  }

  console.log("[6/8] Creating bank accounts…");
  const accountIdMap = new Map<string, string>();
  const checkingByProfile = new Map<string, string>();
  for (const a of dataset.accounts) {
    const profileId = profileIdMap.get(a.customerProfileId);
    if (!profileId) continue;
    const acct = await prisma.bankAccount.create({
      data: {
        customerProfileId: profileId,
        accountNumberMasked: a.accountNumberMasked,
        accountType: a.accountType,
        currency: "ILS",
        currentBalance: a.currentBalanceIls,
        availableBalance: a.availableBalanceIls,
        status: a.status,
        dailyTransferLimit: a.dailyTransferLimitIls,
      },
    });
    accountIdMap.set(a.accountId, acct.id);
    if (a.accountType === "checking") {
      checkingByProfile.set(a.customerProfileId, acct.id);
    }
  }

  console.log("[7/8] Inserting audit logs and derived transactions…");
  const auditPayloads = dataset.auditLogs.map((log) => {
    const actorPrismaId =
      userIdMap.get(log.actorId) ?? staffIdMap.get(log.actorId) ?? null;
    const inputJson =
      log.inputDataSummary && Object.keys(log.inputDataSummary).length > 0
        ? JSON.stringify(log.inputDataSummary)
        : null;
    return {
      timestamp: new Date(log.timestamp),
      actorType: log.actorType,
      actorId: actorPrismaId,
      actorName: log.actorName ?? null,
      role: log.role ?? null,
      customerTier: log.customerTier ?? null,
      actionType: log.actionType,
      page: log.page ?? null,
      toolOrFeatureUsed: log.toolOrFeatureUsed ?? null,
      inputDataSummary: inputJson,
      targetResource: log.targetResource ?? null,
      amount: log.amountIls ?? null,
      riskLevel: log.riskLevel ?? "low",
      requiresApproval: Boolean(log.requiresApproval),
      approvalStatus: log.approvalStatus ?? "not_required",
      sessionId: log.sessionId ?? null,
      ipAddress: log.ipAddressSimulated ?? null,
      userIntent: log.userIntent ?? null,
      actionOutcome: log.actionOutcome ?? "viewed",
      reasonForFlagging: log.reasonForFlagging ?? null,
      createdByAgent: Boolean(log.createdByAgent),
    };
  });

  let auditInserted = 0;
  for (const batch of chunk(auditPayloads, CHUNK_SIZE)) {
    await prisma.auditLog.createMany({ data: batch });
    auditInserted += batch.length;
    process.stdout.write(
      `      audit logs: ${auditInserted}/${auditPayloads.length}\r`,
    );
  }
  process.stdout.write("\n");

  // Derive transactions from money-event audit logs
  const txPayloads: Array<{
    accountId: string;
    customerProfileId: string;
    timestamp: Date;
    description: string;
    merchantOrRecipient: string;
    amount: number;
    currency: string;
    direction: string;
    status: string;
    category: string;
    reference: string;
  }> = [];

  let skippedNoAccount = 0;
  for (const log of dataset.auditLogs) {
    if (!MONEY_EVENT_TYPES.has(log.actionType)) continue;
    if (log.amountIls == null) continue;
    if (!log.customerProfileId) continue;
    const profileId = profileIdMap.get(log.customerProfileId);
    if (!profileId) continue;
    const accountId = checkingByProfile.get(log.customerProfileId);
    if (!accountId) {
      skippedNoAccount += 1;
      continue;
    }
    const isCredit = CREDIT_EVENT_TYPES.has(log.actionType);
    txPayloads.push({
      accountId,
      customerProfileId: profileId,
      timestamp: new Date(log.timestamp),
      description: descriptionForMoneyEvent(log),
      merchantOrRecipient: merchantFor(log),
      amount: Math.abs(log.amountIls),
      currency: "ILS",
      direction: isCredit ? "credit" : "debit",
      status: transactionStatusFor(log.actionType),
      category: categoryForLog(log),
      reference: log.targetResource ?? log.logId,
    });
  }

  let txInserted = 0;
  for (const batch of chunk(txPayloads, CHUNK_SIZE)) {
    await prisma.transaction.createMany({ data: batch });
    txInserted += batch.length;
    process.stdout.write(`      transactions: ${txInserted}/${txPayloads.length}\r`);
  }
  process.stdout.write("\n");
  if (skippedNoAccount > 0) {
    console.log(`      (skipped ${skippedNoAccount} money events with no mapped account)`);
  }

  console.log("[8/8] Inserting documents, tickets, manager notes, approvals…");

  const docPayloads = dataset.documents
    .map((d) => {
      const profileId = profileIdMap.get(d.customerProfileId);
      if (!profileId) return null;
      return {
        customerProfileId: profileId,
        accountId: null as string | null,
        documentType: d.documentType,
        title: d.title,
        periodStart: d.periodStart ? new Date(d.periodStart) : null,
        periodEnd: d.periodEnd ? new Date(d.periodEnd) : null,
        metadataSummary: d.metadataSummary,
        sensitivityLevel: d.sensitivityLevel,
        availableToTier: d.availableToTier,
        containsInjectionTest: false,
        downloadUrlMock: d.downloadUrlMock,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);
  if (docPayloads.length > 0) {
    await prisma.document.createMany({ data: docPayloads });
  }

  const ticketPayloads = dataset.supportTickets
    .map((t) => {
      const profileId = profileIdMap.get(t.customerProfileId);
      if (!profileId) return null;
      // Map dataset statuses to Prisma's allowed values
      const status =
        t.status === "pending_customer" ? "open"
        : t.status === "resolved" ? "resolved"
        : t.status === "in_progress" ? "in_progress"
        : t.status === "closed" ? "closed"
        : "open";
      const priority =
        t.priority === "urgent" ? "urgent"
        : t.priority === "high" ? "priority"
        : "normal";
      return {
        customerProfileId: profileId,
        category: t.category,
        subject: t.subject,
        message: t.message,
        priority,
        status,
        riskFlags:
          Array.isArray(t.riskFlags) && t.riskFlags.length > 0
            ? JSON.stringify(t.riskFlags)
            : null,
        containsInjectionTest: false,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.createdAt),
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);
  if (ticketPayloads.length > 0) {
    await prisma.supportTicket.createMany({ data: ticketPayloads });
  }

  const notePayloads = dataset.managerNotes
    .map((n) => {
      const profileId = profileIdMap.get(n.customerProfileId);
      const managerId = staffIdMap.get(n.managerId);
      if (!profileId || !managerId) return null;
      return {
        customerProfileId: profileId,
        managerId,
        noteBody: n.noteBody,
        category: n.category ?? "general",
        visibility: n.visibility ?? "internal",
        containsPromptInjectionTest: false,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.createdAt),
      };
    })
    .filter((n): n is NonNullable<typeof n> => n !== null);
  if (notePayloads.length > 0) {
    await prisma.managerNote.createMany({ data: notePayloads });
  }

  const approvalPayloads = dataset.approvalRequests
    .map((a) => {
      const profileId = profileIdMap.get(a.customerProfileId);
      if (!profileId) return null;
      const requestedById =
        userIdMap.get(a.requestedByActorId) ??
        staffIdMap.get(a.requestedByActorId) ??
        a.requestedByActorId;
      const assignedManagerId = a.assignedManagerId
        ? staffIdMap.get(a.assignedManagerId) ?? null
        : null;
      const decidedAt = a.decision ? new Date(a.createdAt) : null;
      return {
        requestType: a.requestType,
        targetResourceId: a.targetResourceId,
        customerProfileId: profileId,
        requestedByActorType: a.requestedByActorType,
        requestedByActorId: requestedById,
        assignedManagerId,
        amount: a.amountIls ?? null,
        riskLevel: a.riskLevel ?? "medium",
        status: a.status,
        decision: a.decision ?? null,
        decisionReason: a.decisionReason ?? null,
        decidedBy: a.decision ? assignedManagerId : null,
        decidedAt,
        createdAt: new Date(a.createdAt),
      };
    })
    .filter((a): a is NonNullable<typeof a> => a !== null);
  if (approvalPayloads.length > 0) {
    await prisma.approvalRequest.createMany({ data: approvalPayloads });
  }

  console.log(
    `      documents=${docPayloads.length}  tickets=${ticketPayloads.length}  notes=${notePayloads.length}  approvals=${approvalPayloads.length}`,
  );

  console.log("\n=== Done ===");
  console.log(`Default password for ALL accounts: ${DEFAULT_PASSWORD}\n`);

  console.log("Staff users:");
  for (const s of staffEmails) {
    console.log(`  - ${s.email}  (${s.name} — ${s.role})`);
  }

  console.log("\nCustomers (sample):");
  for (const c of customerEmails.slice(0, 6)) {
    console.log(`  - ${c.email}  (${c.name} — ${c.tier})`);
  }
  if (customerEmails.length > 6) {
    console.log(`  …and ${customerEmails.length - 6} more`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
