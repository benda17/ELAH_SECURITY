/**
 * seed-customers.ts
 *
 * Adds demo customers (User + CustomerProfile + BankAccounts) until the
 * configured per-tier targets are reached. Idempotent.
 *
 *   - Tier targets are tunable via TIER_TARGETS (currently 60/25/15).
 *   - 17 explicitly-named demo characters are preserved so re-seeders get
 *     a consistent set of recognizable customers; the rest are generated
 *     procedurally from realistic name/address pools.
 *   - All passwords are bcrypt("DemoPass123!").
 *
 * Run with:   npx tsx scripts/seed-customers.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

// ----------------------------------------------------------------------
// Target population (final counts per tier across the whole DB)
// ----------------------------------------------------------------------
const TIER_TARGETS: Record<Tier, number> = {
  basic: 60,
  premium: 25,
  vip: 15,
};

// ----------------------------------------------------------------------
// Explicit demo characters (preserve a stable cast for the demo)
// ----------------------------------------------------------------------
const NAMED_CUSTOMERS: CustomerSpec[] = [
  // --- Basic ---
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
  // --- Premium ---
  { firstName: "Aaron", lastName: "Goldberg", tier: "premium", dob: "1983-05-19", phone: "+1 (415) 555-0911", address: "1 Letterman Drive, San Francisco, CA 94129", employmentStatus: "employed" },
  { firstName: "Priya", lastName: "Sharma", tier: "premium", dob: "1985-10-08", phone: "+1 (650) 555-0822", address: "390 Cambridge Ave, Palo Alto, CA 94306", employmentStatus: "employed" },
  { firstName: "Luca", lastName: "Bianchi", tier: "premium", dob: "1980-12-11", phone: "+1 (415) 555-0733", address: "555 California St, San Francisco, CA 94104", employmentStatus: "self_employed" },
  { firstName: "Naomi", lastName: "Yamamoto", tier: "premium", dob: "1987-06-26", phone: "+1 (415) 555-0644", address: "1455 Market St, San Francisco, CA 94103", employmentStatus: "employed" },
  // --- VIP ---
  { firstName: "Alexander", lastName: "Volkov", tier: "vip", dob: "1972-09-04", phone: "+1 (415) 555-0501", address: "2000 Broadway, San Francisco, CA 94109", employmentStatus: "self_employed" },
  { firstName: "Catherine", lastName: "Worthington", tier: "vip", dob: "1968-04-15", phone: "+1 (650) 555-0432", address: "100 Atherton Ave, Atherton, CA 94027", employmentStatus: "retired" },
  { firstName: "Dmitri", lastName: "Petrov", tier: "vip", dob: "1975-11-22", phone: "+1 (415) 555-0398", address: "950 Lombard St, San Francisco, CA 94133", employmentStatus: "employed" },
];

// ----------------------------------------------------------------------
// Name pools (used by the procedural generator). Mix of cultures to
// roughly mirror a real urban Bay-Area customer base.
// ----------------------------------------------------------------------
const FIRST_NAMES = [
  "Aaliyah", "Aarav", "Abigail", "Adrian", "Akira", "Alan", "Aleksei", "Alessandra",
  "Amara", "Amelia", "Amir", "Andre", "Aria", "Arjun", "Asha", "Ava",
  "Beatrice", "Benjamin", "Bianca", "Brandon", "Camila", "Carlos", "Caroline",
  "Cheng", "Clara", "Daniela", "Declan", "Dimitri", "Dominic", "Eduardo",
  "Eleanor", "Eliza", "Elliot", "Emiko", "Emma", "Esmeralda", "Esteban",
  "Eva", "Faisal", "Farah", "Felix", "Fernanda", "Finn", "Gabriel", "Genesis",
  "George", "Gianna", "Hana", "Harper", "Hassan", "Hayden", "Henry",
  "Hiroshi", "Hugo", "Imani", "Imran", "Ines", "Isaac", "Isadora", "Ivan",
  "Jacob", "Jade", "Jamal", "Jasmine", "Jian", "Joaquin", "Julia",
  "Kaito", "Kareem", "Katherine", "Keanu", "Khalil", "Kiara", "Kofi",
  "Lakshmi", "Lara", "Layla", "Leo", "Levi", "Lily", "Logan", "Lorenzo",
  "Lucia", "Luis", "Malia", "Marco", "Margot", "Marisol", "Marcus", "Mia",
  "Mikael", "Milena", "Nadia", "Nathan", "Nina", "Nora", "Olivia", "Omar",
  "Oscar", "Paloma", "Pedro", "Quinn", "Rachel", "Rafael", "Rania", "Renee",
  "Ricardo", "Rohan", "Saanvi", "Samira", "Sebastian", "Selene", "Shen",
  "Simone", "Sina", "Soraya", "Tessa", "Thandeka", "Theo", "Tomas", "Valentina",
  "Vera", "Victor", "Violet", "Wei", "Wren", "Xander", "Xiomara", "Yasmin",
  "Yusuf", "Zachary", "Zoe",
];

const LAST_NAMES = [
  "Adams", "Aguilar", "Akhtar", "Alvarez", "Anderson", "Asante", "Banerjee",
  "Barnes", "Bauer", "Bennett", "Berger", "Bernal", "Brennan", "Brooks",
  "Caldwell", "Castro", "Chang", "Chavez", "Chen", "Cho", "Clarke", "Cohen",
  "Cole", "Cooper", "Cortez", "Cunningham", "Dalton", "Davila", "DeLuca",
  "Diaz", "Dimitriou", "Dominguez", "Edwards", "Eklund", "Fernandez",
  "Fitzgerald", "Fischer", "Flores", "Foster", "Garcia", "Gallagher",
  "Goldberg", "Gomez", "Grant", "Gupta", "Hassan", "Hayes", "Hernandez",
  "Higgins", "Hong", "Ibarra", "Imamura", "Ingram", "Iyer", "Jackson",
  "Jenkins", "Johansson", "Kapoor", "Kato", "Kelly", "Khan", "Kim", "Kowalski",
  "Lam", "Larsen", "Lawson", "Le", "Leung", "Liang", "Lima", "Lopez",
  "Maharaj", "Mahmood", "Mancini", "Martin", "Mason", "Mendes", "Miller",
  "Moreno", "Morales", "Moreau", "Mukherjee", "Nakamura", "Nasser",
  "Nelson", "Nguyen", "Novak", "O'Brien", "Okafor", "Ortiz", "Osei",
  "Pakhomov", "Park", "Patel", "Perez", "Quintero", "Ramirez", "Reyes",
  "Riley", "Rodriguez", "Romano", "Rossi", "Rousseau", "Russo", "Salinas",
  "Santos", "Saito", "Sato", "Schneider", "Sharma", "Shimizu", "Singh",
  "Stevens", "Subramanian", "Sutherland", "Suzuki", "Takahashi", "Tanaka",
  "Tariq", "Thompson", "Torres", "Tran", "Tremblay", "Vargas", "Vasquez",
  "Vega", "Wagner", "Walker", "Wang", "Washington", "Weber", "Wright",
  "Wu", "Xu", "Yamada", "Yamamoto", "Yang", "Yusuf", "Zhao", "Zheng",
];

const STREETS = [
  "Market St", "Mission St", "Valencia St", "Folsom St", "Howard St",
  "Bryant St", "Brannan St", "California St", "Pine St", "Bush St",
  "Sutter St", "Polk St", "Van Ness Ave", "Geary Blvd", "Clement St",
  "Irving St", "Judah St", "Taraval St", "Ocean Ave", "Mission Bay Blvd",
  "Lombard St", "Broadway", "Embarcadero", "Townsend St", "King St",
  "Telegraph Ave", "Shattuck Ave", "Solano Ave", "College Ave", "Bancroft Way",
  "University Ave", "El Camino Real", "Page Mill Rd", "Cambridge Ave",
  "California Ave", "Sand Hill Rd", "Castro St", "Middlefield Rd",
  "Stevens Creek Blvd", "Almaden Expy",
];

const CITIES: { city: string; state: string; zip: string }[] = [
  { city: "San Francisco", state: "CA", zip: "94103" },
  { city: "San Francisco", state: "CA", zip: "94110" },
  { city: "San Francisco", state: "CA", zip: "94117" },
  { city: "San Francisco", state: "CA", zip: "94122" },
  { city: "Oakland", state: "CA", zip: "94607" },
  { city: "Oakland", state: "CA", zip: "94612" },
  { city: "Berkeley", state: "CA", zip: "94704" },
  { city: "Berkeley", state: "CA", zip: "94705" },
  { city: "Palo Alto", state: "CA", zip: "94301" },
  { city: "Palo Alto", state: "CA", zip: "94306" },
  { city: "Mountain View", state: "CA", zip: "94040" },
  { city: "San Jose", state: "CA", zip: "95112" },
  { city: "San Jose", state: "CA", zip: "95128" },
  { city: "Sunnyvale", state: "CA", zip: "94086" },
  { city: "Daly City", state: "CA", zip: "94014" },
  { city: "Hayward", state: "CA", zip: "94544" },
];

const EMPLOYMENT_BY_TIER: Record<
  Tier,
  { v: CustomerSpec["employmentStatus"]; w: number }[]
> = {
  basic: [
    { v: "employed", w: 60 },
    { v: "student", w: 18 },
    { v: "self_employed", w: 12 },
    { v: "unemployed", w: 6 },
    { v: "retired", w: 4 },
  ],
  premium: [
    { v: "employed", w: 70 },
    { v: "self_employed", w: 25 },
    { v: "retired", w: 5 },
  ],
  vip: [
    { v: "self_employed", w: 50 },
    { v: "employed", w: 35 },
    { v: "retired", w: 15 },
  ],
};

const DOB_RANGE_BY_TIER: Record<Tier, [number, number]> = {
  basic: [22, 45],
  premium: [30, 60],
  vip: [40, 75],
};

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

const rand = Math.random;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function pickWeighted<T>(items: readonly { v: T; w: number }[]): T {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = rand() * total;
  for (const i of items) if ((r -= i.w) < 0) return i.v;
  return items[items.length - 1].v;
}
function randInt(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function maskedAccountNumber(): string {
  return `**** **** **** ${String(randInt(1000, 9999))}`;
}
function randomPhone(): string {
  const area = pick(["415", "510", "650", "408", "925", "707", "628"]);
  return `+1 (${area}) 555-${String(randInt(100, 999))}${randInt(0, 9)}`;
}
function randomAddress(): string {
  const house = randInt(40, 4900);
  const street = pick(STREETS);
  const c = pick(CITIES);
  return `${house} ${street}, ${c.city}, ${c.state} ${c.zip}`;
}
function randomDobForTier(tier: Tier): string {
  const [minAge, maxAge] = DOB_RANGE_BY_TIER[tier];
  const today = new Date();
  const ageYears = randInt(minAge, maxAge);
  const month = randInt(0, 11);
  const day = randInt(1, 28);
  const year = today.getFullYear() - ageYears;
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const ROLE_OF_TIER: Record<Tier, string> = {
  basic: "regular_customer",
  premium: "premium_customer",
  vip: "vip_customer",
};

const RISK_OF_TIER: Record<Tier, string> = {
  basic: "standard",
  premium: "standard",
  vip: "elevated",
};

const DAILY_LIMITS: Record<
  Tier,
  { checking: number; savings: number; investment?: number }
> = {
  basic: { checking: 2_500, savings: 1_500 },
  premium: { checking: 10_000, savings: 5_000, investment: 20_000 },
  vip: { checking: 50_000, savings: 25_000, investment: 100_000 },
};

function openingBalances(tier: Tier) {
  if (tier === "basic")
    return {
      checking: round2(800 + rand() * 4200),
      savings: round2(500 + rand() * 7500),
    };
  if (tier === "premium")
    return {
      checking: round2(5_000 + rand() * 25_000),
      savings: round2(15_000 + rand() * 85_000),
      investment: round2(50_000 + rand() * 350_000),
    };
  return {
    checking: round2(75_000 + rand() * 200_000),
    savings: round2(250_000 + rand() * 750_000),
    investment: round2(750_000 + rand() * 4_250_000),
  };
}

function sanitizeEmailPart(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function uniqueEmailFor(
  firstName: string,
  lastName: string,
  takenLocally: Set<string>,
): Promise<string> {
  const base = `${sanitizeEmailPart(firstName)}.${sanitizeEmailPart(lastName)}`;
  let candidate = `${base}@elah.demo`;
  let suffix = 1;
  while (
    takenLocally.has(candidate) ||
    (await prisma.user.findUnique({ where: { email: candidate } }))
  ) {
    suffix++;
    candidate = `${base}${suffix}@elah.demo`;
    if (suffix > 99) throw new Error(`Cannot find unique email for ${base}`);
  }
  takenLocally.add(candidate);
  return candidate;
}

async function nextCustomerNumber(): Promise<number> {
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

function generateSpec(tier: Tier): CustomerSpec {
  return {
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    tier,
    dob: randomDobForTier(tier),
    phone: randomPhone(),
    address: randomAddress(),
    employmentStatus: pickWeighted(EMPLOYMENT_BY_TIER[tier]),
  };
}

// ----------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------

async function main() {
  const passwordHash = await bcrypt.hash("DemoPass123!", 10);
  let cursor = await nextCustomerNumber();
  const managerId = await pickManagerId();
  const takenEmails = new Set<string>();

  // 1) Existing per-tier count
  const existing: Record<Tier, number> = { basic: 0, premium: 0, vip: 0 };
  const allProfiles = await prisma.customerProfile.groupBy({
    by: ["tier"],
    _count: { _all: true },
  });
  for (const r of allProfiles) existing[r.tier as Tier] = r._count._all;

  console.log("Current customer counts:");
  for (const t of ["basic", "premium", "vip"] as const) {
    console.log(`  ${t.padEnd(10)} ${existing[t].toString().padStart(3)}  → target ${TIER_TARGETS[t]}`);
  }

  // 2) Build the work queue: explicit names first (so re-seed always restores
  //    the demo cast), then procedural fill until tier targets are reached.
  const queue: CustomerSpec[] = [...NAMED_CUSTOMERS];

  const projected: Record<Tier, number> = { ...existing };
  for (const t of ["basic", "premium", "vip"] as const) {
    // The named list already contributes some — but we only count
    // contributions that are NEW vs the DB (idempotent below).
    // For target math, just compute deficit using the current DB state.
    const namedInThisTier = NAMED_CUSTOMERS.filter((c) => c.tier === t).length;
    const projectedAfterNamed = existing[t] + namedInThisTier;
    const deficit = TIER_TARGETS[t] - projectedAfterNamed;
    for (let i = 0; i < deficit; i++) queue.push(generateSpec(t));
    projected[t] = Math.max(existing[t], TIER_TARGETS[t]);
  }

  // 3) Create them, skipping anyone whose email already exists.
  let created = 0;
  let skipped = 0;

  for (const spec of queue) {
    const email = await uniqueEmailFor(spec.firstName, spec.lastName, takenEmails);

    const already = await prisma.user.findUnique({ where: { email } });
    if (already) {
      skipped++;
      continue;
    }

    const fullName = `${spec.firstName} ${spec.lastName}`;
    const customerNumber = `ELAH-${String(cursor++).padStart(6, "0")}`;
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

    created++;
  }

  // 4) Final summary
  const final = await prisma.customerProfile.groupBy({
    by: ["tier"],
    _count: { _all: true },
  });
  const userTotal = await prisma.user.count();
  const customerTotal = await prisma.customerProfile.count();
  const accountTotal = await prisma.bankAccount.count();

  console.log(`\n✓ Created ${created} customers (${skipped} already existed, skipped).\n`);
  console.log("Final tier distribution:");
  for (const t of ["basic", "premium", "vip"] as const) {
    const row = final.find((f) => f.tier === t);
    console.log(`  ${t.padEnd(10)} ${(row?._count._all ?? 0).toString().padStart(3)}`);
  }
  console.log(
    `\nTotals: ${userTotal} users (incl. staff) · ${customerTotal} customers · ${accountTotal} bank accounts`,
  );
  console.log(`\nAll new accounts log in with password: DemoPass123!`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
