/**
 * seed-customers.ts
 *
 * Adds additional demo customers (User + CustomerProfile + BankAccounts)
 * so the simulation has a meaningful population to drive analytics.
 *
 * Defaults bring total CUSTOMERS to at least 20 (3 existing + 17 new):
 *   - 10 basic     (regular_customer)
 *   -  4 premium   (premium_customer)
 *   -  3 vip       (vip_customer)
 *
 * Idempotent: skips any user whose email already exists.
 * Customer numbers are auto-assigned by finding the next ELAH-1NNNNN slot.
 * All passwords are bcrypt("DemoPass123!"), matching the seed.ts convention.
 *
 * Run with:   npx tsx scripts/seed-customers.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

type Tier = "basic" | "premium" | "vip";

type CustomerSpec = {
  firstName: string;
  lastName: string;
  tier: Tier;
  dob: string; // YYYY-MM-DD
  phone: string;
  address: string;
  employmentStatus:
    | "employed"
    | "self_employed"
    | "retired"
    | "student"
    | "unemployed";
};

const NEW_CUSTOMERS: CustomerSpec[] = [
  // ----- Basic (10) -----
  { firstName: "Aiden", lastName: "Carter", tier: "basic", dob: "1995-04-12", phone: "+1 (415) 555-0142", address: "320 Folsom St, San Francisco, CA 94105", employmentStatus: "employed" },
  { firstName: "Maya", lastName: "Patel", tier: "basic", dob: "1998-09-23", phone: "+1 (650) 555-0118", address: "1820 University Ave, Palo Alto, CA 94301", employmentStatus: "student" },
  { firstName: "Liam", lastName: "OConnor", tier: "basic", dob: "1992-01-30", phone: "+1 (415) 555-0224", address: "742 Valencia St, San Francisco, CA 94110", employmentStatus: "employed" },
  { firstName: "Ana", lastName: "Rodriguez", tier: "basic", dob: "1990-11-05", phone: "+1 (510) 555-0163", address: "2245 Telegraph Ave, Berkeley, CA 94704", employmentStatus: "self_employed" },
  { firstName: "Noah", lastName: "Kim", tier: "basic", dob: "1997-06-17", phone: "+1 (408) 555-0241", address: "1500 N First St, San Jose, CA 95112", employmentStatus: "employed" },
  { firstName: "Sophia", lastName: "Nakamura", tier: "basic", dob: "1993-08-02", phone: "+1 (415) 555-0309", address: "1130 Howard St, San Francisco, CA 94103", employmentStatus: "employed" },
  { firstName: "Ethan", lastName: "Williams", tier: "basic", dob: "1989-03-21", phone: "+1 (510) 555-0454", address: "98 Jack London Sq, Oakland, CA 94607", employmentStatus: "employed" },
  { firstName: "Zara", lastName: "Ahmed", tier: "basic", dob: "1996-12-09", phone: "+1 (650) 555-0567", address: "455 Lytton Ave, Palo Alto, CA 94301", employmentStatus: "employed" },
  { firstName: "Mateo", lastName: "Silva", tier: "basic", dob: "1994-07-14", phone: "+1 (415) 555-0682", address: "215 8th St, San Francisco, CA 94103", employmentStatus: "self_employed" },
  { firstName: "Chloe", lastName: "Davis", tier: "basic", dob: "2000-02-28", phone: "+1 (510) 555-0793", address: "2750 College Ave, Berkeley, CA 94705", employmentStatus: "student" },

  // ----- Premium (4) -----
  { firstName: "Aaron", lastName: "Goldberg", tier: "premium", dob: "1983-05-19", phone: "+1 (415) 555-0911", address: "1 Letterman Drive, San Francisco, CA 94129", employmentStatus: "employed" },
  { firstName: "Priya", lastName: "Sharma", tier: "premium", dob: "1985-10-08", phone: "+1 (650) 555-0822", address: "390 Cambridge Ave, Palo Alto, CA 94306", employmentStatus: "employed" },
  { firstName: "Luca", lastName: "Bianchi", tier: "premium", dob: "1980-12-11", phone: "+1 (415) 555-0733", address: "555 California St, San Francisco, CA 94104", employmentStatus: "self_employed" },
  { firstName: "Naomi", lastName: "Yamamoto", tier: "premium", dob: "1987-06-26", phone: "+1 (415) 555-0644", address: "1455 Market St, San Francisco, CA 94103", employmentStatus: "employed" },

  // ----- VIP (3) -----
  { firstName: "Alexander", lastName: "Volkov", tier: "vip", dob: "1972-09-04", phone: "+1 (415) 555-0501", address: "2000 Broadway, San Francisco, CA 94109", employmentStatus: "self_employed" },
  { firstName: "Catherine", lastName: "Worthington", tier: "vip", dob: "1968-04-15", phone: "+1 (650) 555-0432", address: "100 Atherton Ave, Atherton, CA 94027", employmentStatus: "retired" },
  { firstName: "Dmitri", lastName: "Petrov", tier: "vip", dob: "1975-11-22", phone: "+1 (415) 555-0398", address: "950 Lombard St, San Francisco, CA 94133", employmentStatus: "employed" },
];

const ROLE_OF_TIER: Record<Tier, string> = {
  basic: "regular_customer",
  premium: "premium_customer",
  vip: "vip_customer",
};

const RISK_OF_TIER: Record<Tier, string> = {
  basic: "standard",
  premium: "standard",
  vip: "elevated", // VIPs are intrinsically higher-stakes per the app
};

const DAILY_LIMITS: Record<Tier, { checking: number; savings: number; investment?: number }> = {
  basic:   { checking:   2_500, savings:   1_500 },
  premium: { checking:  10_000, savings:   5_000, investment:  20_000 },
  vip:     { checking:  50_000, savings:  25_000, investment: 100_000 },
};

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function maskedAccountNumber() {
  const last4 = String(randInt(1000, 9999));
  return `**** **** **** ${last4}`;
}

/** Realistic opening balances per tier */
function openingBalances(tier: Tier) {
  if (tier === "basic") {
    return {
      checking: round2(800 + Math.random() * 4200),    // $800–$5,000
      savings: round2(500 + Math.random() * 7500),     // $500–$8,000
    };
  }
  if (tier === "premium") {
    return {
      checking: round2(5_000 + Math.random() * 25_000),    // $5k–$30k
      savings: round2(15_000 + Math.random() * 85_000),    // $15k–$100k
      investment: round2(50_000 + Math.random() * 350_000),
    };
  }
  return {
    checking: round2(75_000 + Math.random() * 200_000),
    savings: round2(250_000 + Math.random() * 750_000),
    investment: round2(750_000 + Math.random() * 4_250_000),
  };
}

async function nextCustomerNumberStart() {
  const profiles = await prisma.customerProfile.findMany({
    select: { customerNumber: true },
  });
  let max = 100_000;
  for (const p of profiles) {
    const m = p.customerNumber.match(/ELAH-(\d+)/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

async function pickManagerId(): Promise<string | undefined> {
  const m = await prisma.user.findFirst({ where: { role: "bank_manager" } });
  return m?.id;
}

async function main() {
  const passwordHash = await bcrypt.hash("DemoPass123!", 10);
  let nextCustomerNum = await nextCustomerNumberStart();
  const managerId = await pickManagerId();

  let createdUsers = 0;
  let skipped = 0;

  for (const spec of NEW_CUSTOMERS) {
    const email = `${spec.firstName}.${spec.lastName}@elah.demo`.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      skipped++;
      continue;
    }

    const fullName = `${spec.firstName} ${spec.lastName}`;
    const customerNumber = `ELAH-${String(nextCustomerNum++).padStart(6, "0")}`;
    const balances = openingBalances(spec.tier);
    const limits = DAILY_LIMITS[spec.tier];

    const accounts: any[] = [
      {
        accountNumberMasked: maskedAccountNumber(),
        accountType: "checking",
        currentBalance: balances.checking,
        availableBalance: balances.checking,
        dailyTransferLimit: limits.checking,
      },
      {
        accountNumberMasked: maskedAccountNumber(),
        accountType: "savings",
        currentBalance: balances.savings,
        availableBalance: balances.savings,
        dailyTransferLimit: limits.savings,
      },
    ];
    if (spec.tier !== "basic" && balances.investment) {
      accounts.push({
        accountNumberMasked: maskedAccountNumber(),
        accountType: "investment",
        currentBalance: balances.investment,
        availableBalance: balances.investment,
        dailyTransferLimit: limits.investment!,
      });
    }

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: fullName,
        role: ROLE_OF_TIER[spec.tier],
        customerProfile: {
          create: {
            customerNumber,
            tier: spec.tier,
            fullName,
            dateOfBirth: new Date(spec.dob),
            email,
            phone: spec.phone,
            address: spec.address,
            employmentStatus: spec.employmentStatus,
            riskRating: RISK_OF_TIER[spec.tier],
            assignedManagerId: managerId ?? null,
            accounts: { create: accounts },
          },
        },
      },
    });

    createdUsers++;
  }

  const summary = await prisma.customerProfile.groupBy({
    by: ["tier"],
    _count: { _all: true },
  });
  const userTotal = await prisma.user.count();
  const customerTotal = await prisma.customerProfile.count();
  const accountTotal = await prisma.bankAccount.count();

  console.log(`✓ Created ${createdUsers} new customers (${skipped} already existed, skipped).\n`);
  console.log("Tier distribution:");
  for (const row of summary.sort((a, b) => a.tier.localeCompare(b.tier))) {
    console.log(`  ${row.tier.padEnd(10)} ${row._count._all}`);
  }
  console.log(`\nTotals: ${userTotal} users (incl. staff) · ${customerTotal} customers · ${accountTotal} bank accounts`);
  console.log(`\nAll new accounts log in with password: DemoPass123!`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
