/**
 * Phase 4 log conversion: live simulator AuditLog → unlabeled JSONL.
 *
 * Reuses the Phase 2 mapper (`listIngestibleEvents`). Does not fork ElahEvent.
 * Does not invent gold intentLabel. Does not call POST /v1/score.
 *
 *   npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/normalize-elah-logs.ts
 *   npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/normalize-elah-logs.ts --limit=500
 *
 * Parent adds: npm run normalize:elah-logs
 *
 * Product freeze: ELAH never allows, blocks, or executes.
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  assertIsoTimestamp,
  buildReport,
  capUtterance,
  emptyNormalizeCounts,
  findDuplicateKeys,
  isLifecycleActionType,
  piiLint,
  toUnlabeledSimulatorRecord,
  type NormalizeCounts,
} from "../lib/elah/dataset/normalize";

const DEFAULT_LIMIT = 500;
const DEFAULT_OUT = path.resolve("data/phase4/from-simulator.jsonl");
const ROOT = path.resolve(__dirname, "..");

interface CliOptions {
  limit: number;
  help: boolean;
}

function loadDotEnv(filePath: string) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { limit: DEFAULT_LIMIT, help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      opts.limit = Number(arg.slice("--limit=".length));
      continue;
    }
    if (arg === "--limit") {
      opts.limit = Number(argv[++i]);
      continue;
    }
  }
  if (!Number.isFinite(opts.limit) || opts.limit < 1) {
    throw new Error(`Invalid --limit=${String(opts.limit)}; expected a positive integer`);
  }
  return opts;
}

function printHelp() {
  process.stdout.write(`ELAH Phase 4 log normalization (unlabeled simulator export)

Usage:
  npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/normalize-elah-logs.ts
  npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/normalize-elah-logs.ts --limit=500
  npm run normalize:elah-logs
  npm run normalize:elah-logs -- --limit=500

Options:
  --limit=N   Max unlabeled records after cleaning (default ${DEFAULT_LIMIT})
  --help      Show this help (works without DATABASE_URL)

Writes ${DEFAULT_OUT}
Uses the Phase 2 mapper (listIngestibleEvents). Does not invent intentLabel.
Does not call POST /v1/score. Fail-closed ingest / fail-open banking.
`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function capEventUtterance(event: Record<string, unknown>): Record<string, unknown> {
  const conversation = event.conversation;
  if (!isRecord(conversation)) return event;
  const capped = capUtterance(
    typeof conversation.utterance === "string" ? conversation.utterance : null,
  );
  if (capped === conversation.utterance) return event;
  return {
    ...event,
    conversation: { ...conversation, utterance: capped },
  };
}

function bump(map: Record<string, number> | undefined, key: string) {
  const target = map ?? {};
  target[key] = (target[key] ?? 0) + 1;
  return target;
}

async function disconnectPrisma() {
  try {
    const { prisma } = await import("@/lib/db");
    await prisma.$disconnect().catch(() => undefined);
  } catch {
    // ignore — prisma may never have loaded
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  loadDotEnv(path.join(ROOT, ".env"));

  if (!process.env.DATABASE_URL) {
    process.stderr.write(
      "DATABASE_URL is not set. Copy .env.example to .env (or export DATABASE_URL), then re-run.\n" +
        "This script reads live AuditLog via the Phase 2 mapper and cannot run without a database.\n" +
        "Unit tests (tests/elah/dataset-normalize.test.ts) do not need a database.\n" +
        "Pass --help to print usage without a database.\n",
    );
    process.exitCode = 1;
    return;
  }

  const fetchLimit = Math.min(Math.max(opts.limit * 20, opts.limit), 20_000);

  let listed: unknown;
  try {
    const { listIngestibleEvents } = await import("@/lib/elah/envelope");
    listed = await listIngestibleEvents({ take: fetchLimit });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(
      `Cannot load ingestible events (database or env missing/unreachable): ${message}\n` +
        "Check DATABASE_URL and that Postgres is running. Pass --help for usage.\n",
    );
    process.exitCode = 1;
    return;
  }

  const items = Array.isArray(listed) ? listed : [];
  const counts: NormalizeCounts = emptyNormalizeCounts();
  counts.scanned = items.length;

  type Candidate = {
    event: Record<string, unknown> & { eventId: string; occurredAt: string };
  };
  const candidates: Candidate[] = [];

  for (const item of items) {
    if (!isRecord(item)) continue;
    const quality = isRecord(item.quality) ? item.quality : null;
    const event = isRecord(item.event) ? item.event : null;
    if (!event || typeof event.eventId !== "string" || !event.eventId) {
      counts.dropped_incomplete += 1;
      continue;
    }

    const actionType = typeof event.actionType === "string" ? event.actionType : "";
    if (isLifecycleActionType(actionType)) {
      counts.dropped_lifecycle += 1;
      continue;
    }

    if (!quality || quality.ok !== true) {
      counts.dropped_quality += 1;
      continue;
    }

    const occurredAt = typeof event.occurredAt === "string" ? event.occurredAt : "";
    if (!assertIsoTimestamp(occurredAt)) {
      counts.dropped_timestamp += 1;
      continue;
    }

    const lint = piiLint(event);
    if (lint.length > 0) {
      counts.dropped_pii += 1;
      continue;
    }

    candidates.push({
      event: { ...capEventUtterance(event), eventId: event.eventId, occurredAt } as Candidate["event"],
    });
  }

  candidates.sort((a, b) => a.event.occurredAt.localeCompare(b.event.occurredAt));

  const seen = new Set<string>();
  const keptEvents: Candidate["event"][] = [];
  for (const row of candidates) {
    if (seen.has(row.event.eventId)) {
      counts.dropped_duplicate += 1;
      continue;
    }
    seen.add(row.event.eventId);
    keptEvents.push(row.event);
  }

  const leftoverDupes = findDuplicateKeys(keptEvents.map((event) => event.eventId));
  if (leftoverDupes.size > 0) {
    throw new Error(
      `normalize:elah-logs refused to write duplicate eventId(s): ${[...leftoverDupes].join(", ")}`,
    );
  }

  const limited = keptEvents.slice(0, opts.limit);
  const createdAt = new Date().toISOString();
  const records = limited.map((event) => toUnlabeledSimulatorRecord(event, createdAt));

  counts.kept = records.length;
  counts.byActionType = {};
  counts.bySource = {};
  for (const record of records) {
    const event = isRecord(record.event) ? record.event : {};
    const actionType = typeof event.actionType === "string" ? event.actionType : "unknown";
    const source = typeof event.source === "string" ? event.source : "unknown";
    counts.byActionType = bump(counts.byActionType, actionType);
    counts.bySource = bump(counts.bySource, source);
  }
  counts.out = DEFAULT_OUT;

  await mkdir(path.dirname(DEFAULT_OUT), { recursive: true });
  const body = records.length ? `${records.map((row) => JSON.stringify(row)).join("\n")}\n` : "";
  await writeFile(DEFAULT_OUT, body, "utf8");

  process.stdout.write(buildReport(counts));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
