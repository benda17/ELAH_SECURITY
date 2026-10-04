/**
 * Idempotent create of Phase 13 investor CRM rows.
 * Skips Fusion VC and any existing organization/name match.
 * Does not invent emails. Does not mark contacted. No prisma db push.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv(file: string) {
  try {
    const raw = readFileSync(file, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

loadDotEnv(resolve(__dirname, "../.env"));
loadDotEnv(resolve(__dirname, "../.env.local"));

async function main() {
  const { prisma } = await import("../lib/prisma");
  const { PHASE13_INVESTORS, investorMatchKey } = await import(
    "../lib/roadmap/seed/investors"
  );

  const existing = await prisma.roadmapContact.findMany({
    select: {
      id: true,
      name: true,
      organization: true,
      contactType: true,
      email: true,
      outreachStatus: true,
    },
  });

  const existingKeys = new Set(
    existing.map((row) => investorMatchKey(row.organization, row.name)),
  );

  const created: string[] = [];
  const skipped: string[] = [];

  for (const investor of PHASE13_INVESTORS) {
    const key = investorMatchKey(investor.organization, investor.name);
    if (key === "fusion vc" || existingKeys.has(key)) {
      skipped.push(investor.name);
      continue;
    }
    await prisma.roadmapContact.create({
      data: { ...investor, associatedTasks: "[]" },
    });
    existingKeys.add(key);
    created.push(investor.name);
  }

  const fusion = await prisma.roadmapContact.findMany({
    where: {
      OR: [
        { name: { equals: "Fusion VC", mode: "insensitive" } },
        { organization: { equals: "Fusion VC", mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, outreachStatus: true },
  });

  const investors = await prisma.roadmapContact.findMany({
    where: { contactType: "investor" },
    select: { name: true, email: true, outreachStatus: true },
    orderBy: { name: "asc" },
  });

  console.log(
    JSON.stringify(
      {
        createdCount: created.length,
        created,
        skippedCount: skipped.length,
        skipped,
        fusionRows: fusion,
        fusionEmailStillNull: fusion.every((row) => row.email == null),
        investorCount: investors.length,
        investorStatuses: investors.map((row) => ({
          name: row.name,
          email: row.email,
          outreachStatus: row.outreachStatus,
        })),
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
