/**
 * Archive pre-pivot LinkedIn drafts as era=v1 and insert the eight ELAH V2 drafts once.
 * Also inserts V2 content-source seeds without duplicating titles.
 * Does not print DATABASE_URL, .env, or API keys. Does not call an LLM.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PrismaClient } from "@prisma/client";
import { ensureV2SourceEvents } from "../lib/founder/content-engine/source-seeds";
import { V2_DRAFTS } from "../lib/founder/content-engine/v2-content";

const MIGRATION_SQL = resolve(
  __dirname,
  "../prisma/migrations/20261015120000_add_linkedin_post_draft_era/migration.sql",
);

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

function safeError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return message
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]")
    .replace(/DATABASE_URL\s*[=:]\s*\S+/gi, "DATABASE_URL=[redacted]");
}

function isMissingEraColumn(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("P2022") ||
    (/era/i.test(message) && /does not exist|unknown column|42703/i.test(message))
  );
}

async function eraColumnExists(prisma: PrismaClient): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'LinkedInPostDraft'
        AND column_name = 'era'
    ) AS "exists"
  `;
  return rows[0]?.exists === true;
}

async function applyEraMigration(prisma: PrismaClient) {
  const raw = readFileSync(MIGRATION_SQL, "utf8");
  const statements = raw
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function archiveAndSeed(prisma: PrismaClient) {
  const archived = await prisma.linkedInPostDraft.updateMany({
    where: { NOT: { era: "v2" } },
    data: { era: "v1" },
  });

  const v2Before = await prisma.linkedInPostDraft.count({ where: { era: "v2" } });
  let inserted = 0;
  if (v2Before === 0) {
    const now = Date.now();
    await prisma.linkedInPostDraft.createMany({
      data: V2_DRAFTS.map((draft, index) => ({
        title: draft.title,
        body: draft.body,
        hashtags: JSON.stringify(draft.hashtags),
        status: draft.status,
        era: draft.era,
        createdAt: new Date(now - index * 1000),
      })),
    });
    inserted = V2_DRAFTS.length;
  }

  const sourceEventsInserted = await ensureV2SourceEvents(prisma);
  const columnPresent = await eraColumnExists(prisma);
  const [v1Count, v2Count, v2Drafts] = await Promise.all([
    prisma.linkedInPostDraft.count({ where: { era: "v1" } }),
    prisma.linkedInPostDraft.count({ where: { era: "v2" } }),
    prisma.linkedInPostDraft.findMany({
      where: { era: "v2" },
      orderBy: { createdAt: "desc" },
      select: { title: true, status: true, era: true },
    }),
  ]);

  return {
    columnPresent,
    archivedRows: archived.count,
    v2Inserted: inserted,
    sourceEventsInserted,
    v1Count,
    v2Count,
    titles: v2Drafts.map((draft) => draft.title),
  };
}

async function main() {
  loadDotEnv(resolve(__dirname, "../.env"));
  loadDotEnv(resolve(__dirname, "../.env.local"));
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("Database not reachable: DATABASE_URL is missing");
  }

  const { prisma } = await import("../lib/prisma");
  try {
    if (!(await eraColumnExists(prisma))) {
      await applyEraMigration(prisma);
    }
    const summary = await archiveAndSeed(prisma);
    console.log(JSON.stringify(summary, null, 2));
  } catch (err) {
    if (!isMissingEraColumn(err)) throw err;
    await applyEraMigration(prisma);
    const summary = await archiveAndSeed(prisma);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(safeError(err));
  process.exit(1);
});
