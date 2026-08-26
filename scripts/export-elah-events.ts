/**
 * Phase 2 training/event JSONL export (ElahEvent envelopes).
 *
 * This is envelope export, not training-event backfill.
 * Do not replace scripts/backfill-elah-training.ts.
 *
 *   npm run export:elah-events
 *   npm run export:elah-events -- --limit=500
 *   npm run export:elah-events -- --limit=500 --out=./exports/elah-events.jsonl
 *
 *   npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/export-elah-events.ts
 *
 * Prefers `@/lib/elah/envelope` (`listIngestibleEvents` / `checkElahEvent`).
 * Falls back to a thin AuditLog mapper when that module is not yet present.
 *
 * Product freeze: does not call POST /v1/score. Parquet is out of MVP.
 */
import { createWriteStream, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { hashUserId } from "@/lib/elah/helpers";

const DEFAULT_LIMIT = 500;
const APP_ID = "elah-banking-demo";
const PAGE_VIEW_ACTION_RE = /_(view|viewed|opened|searched)$/;
const ALLOWED_SOURCES = new Set(["ui", "agent", "system"]);

const PII_KEYS = new Set([
  "email",
  "name",
  "actorName",
  "userId",
  "actorId",
  "customerProfileId",
  "profileId",
  "rawUserId",
]);

export interface FallbackElahEvent {
  schemaVersion: "1.0";
  eventId: string;
  occurredAt: string;
  appId: string;
  source: string;
  actionType: string;
  outcome: string;
  actor: { userIdHash: string };
  action: { args: Record<string, unknown> };
  conversation?: { conversationId?: string; messageId?: string; utterance?: string };
}

export interface QualityResult {
  ok: boolean;
  eventId?: string;
  ruleIds: string[];
}

interface EnvelopeApi {
  listIngestibleEvents: (opts?: {
    limit?: number;
    take?: number;
    quality?: string;
  }) => Promise<unknown>;
  checkElahEvent: (event: unknown) => unknown;
}

interface CliOptions {
  limit: number;
  out: string | null;
  help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { limit: DEFAULT_LIMIT, out: null, help: false };
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
    if (arg.startsWith("--out=")) {
      opts.out = arg.slice("--out=".length);
      continue;
    }
    if (arg === "--out") {
      opts.out = argv[++i] ?? null;
      continue;
    }
  }
  if (!Number.isFinite(opts.limit) || opts.limit < 1) {
    throw new Error(`Invalid --limit=${String(opts.limit)}; expected a positive integer`);
  }
  return opts;
}

function printHelp() {
  const text = `ELAH event JSONL export (schemaVersion 1.0)

Usage:
  npm run export:elah-events
  npm run export:elah-events -- --limit=500
  npm run export:elah-events -- --limit=500 --out=./exports/elah-events.jsonl

  npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/export-elah-events.ts [options]

Options:
  --limit=N   Max events after quality/dedup (default ${DEFAULT_LIMIT})
  --out=path  Write JSONL to a file instead of stdout
  --help      Show this help

Rules: quality.ok only, no page views, earliest occurredAt per eventId,
no email/name/raw userId. Utterance is included only if already on the envelope.
Parquet is out of MVP. This is not the Phase 4 label taxonomy freeze.
`;
  process.stderr.write(text);
}

async function loadEnvelopeApi(): Promise<EnvelopeApi | null> {
  const candidates = [
    path.resolve(__dirname, "../lib/elah/envelope.ts"),
    path.resolve(__dirname, "../lib/elah/envelope.js"),
  ];
  if (!candidates.some((p) => existsSync(p))) return null;
  try {
    const mod = (await import("@/lib/elah/envelope")) as Record<string, unknown>;
    if (
      typeof mod.listIngestibleEvents !== "function" ||
      typeof mod.checkElahEvent !== "function"
    ) {
      return null;
    }
    return {
      listIngestibleEvents: mod.listIngestibleEvents as EnvelopeApi["listIngestibleEvents"],
      checkElahEvent: mod.checkElahEvent as EnvelopeApi["checkElahEvent"],
    };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapListedItem(item: unknown): unknown {
  if (isRecord(item) && "envelope" in item) return item.envelope;
  if (isRecord(item) && "event" in item) return item.event;
  return item;
}

function qualityFromCheck(result: unknown): QualityResult {
  if (!isRecord(result)) return { ok: false, ruleIds: ["invalid_quality_result"] };
  if (typeof result.ok === "boolean") {
    return {
      ok: result.ok,
      eventId: typeof result.eventId === "string" ? result.eventId : undefined,
      ruleIds: Array.isArray(result.ruleIds)
        ? result.ruleIds.filter((r): r is string => typeof r === "string")
        : [],
    };
  }
  if (isRecord(result.quality) && typeof result.quality.ok === "boolean") {
    const q = result.quality;
    return {
      ok: q.ok === true,
      eventId: typeof q.eventId === "string" ? q.eventId : undefined,
      ruleIds: Array.isArray(q.ruleIds)
        ? q.ruleIds.filter((r): r is string => typeof r === "string")
        : [],
    };
  }
  return { ok: false, ruleIds: ["invalid_quality_result"] };
}

function isPageViewActionType(actionType: unknown): boolean {
  return typeof actionType === "string" && PAGE_VIEW_ACTION_RE.test(actionType);
}

function collectPiiKeys(value: unknown, found: string[], depth = 0): void {
  if (depth > 6 || !isRecord(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (PII_KEYS.has(key)) found.push(key);
    collectPiiKeys(child, found, depth + 1);
  }
}

/** Fallback quality gate used when lib/elah/envelope.ts is not available. */
export function checkElahEventFallback(event: unknown): QualityResult {
  const ruleIds: string[] = [];
  if (!isRecord(event)) {
    return { ok: false, ruleIds: ["not_an_object"] };
  }
  const eventId = typeof event.eventId === "string" ? event.eventId : undefined;
  if (event.schemaVersion !== "1.0") ruleIds.push("schema_version");
  if (!eventId) ruleIds.push("missing_event_id");
  if (typeof event.occurredAt !== "string" || !event.occurredAt) {
    ruleIds.push("missing_occurred_at");
  }
  if (typeof event.appId !== "string" || !event.appId) ruleIds.push("missing_app_id");
  if (typeof event.source !== "string" || !ALLOWED_SOURCES.has(event.source)) {
    ruleIds.push("invalid_source");
  }
  if (typeof event.actionType !== "string" || !event.actionType) {
    ruleIds.push("missing_action_type");
  } else if (isPageViewActionType(event.actionType)) {
    ruleIds.push("page_view");
  }
  if (typeof event.outcome !== "string" || !event.outcome) {
    ruleIds.push("missing_outcome");
  }
  const actor = isRecord(event.actor) ? event.actor : null;
  const userIdHash =
    actor && typeof actor.userIdHash === "string" ? actor.userIdHash : "";
  if (!userIdHash) ruleIds.push("missing_user_id_hash");
  if (userIdHash.includes("@") || /user-/i.test(userIdHash)) {
    ruleIds.push("raw_identity_in_hash");
  }
  const action = isRecord(event.action) ? event.action : null;
  if (!action || !isRecord(action.args)) ruleIds.push("missing_action_args");
  const pii: string[] = [];
  collectPiiKeys(event, pii);
  if (pii.length) ruleIds.push("pii_present");
  return { ok: ruleIds.length === 0, eventId, ruleIds };
}

function stripIdentityFields<T>(value: T, depth = 0): T {
  if (depth > 6 || !isRecord(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (PII_KEYS.has(key)) continue;
    out[key] = stripIdentityFields(child, depth + 1);
  }
  return out as T;
}

function occurredAtMs(event: { occurredAt?: unknown }): number {
  const raw = event.occurredAt;
  if (typeof raw !== "string") return Number.POSITIVE_INFINITY;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

function keepEarliestByEventId<T extends { eventId?: unknown; occurredAt?: unknown }>(
  events: T[],
): T[] {
  const byId = new Map<string, T>();
  for (const event of events) {
    const id = typeof event.eventId === "string" ? event.eventId : "";
    if (!id) continue;
    const prev = byId.get(id);
    if (!prev || occurredAtMs(event) < occurredAtMs(prev)) {
      byId.set(id, event);
    }
  }
  return [...byId.values()].sort((a, b) => occurredAtMs(a) - occurredAtMs(b));
}

function fallbackFromAuditRow(row: {
  id: string;
  eventId: string | null;
  timestamp: Date;
  source: string | null;
  createdByAgent: boolean;
  actionType: string;
  actionOutcome: string;
  userIdHash: string | null;
  actorId: string | null;
}): FallbackElahEvent | null {
  if (isPageViewActionType(row.actionType)) return null;
  const userIdHash = row.userIdHash || (row.actorId ? hashUserId(row.actorId) : "");
  if (!userIdHash) return null;
  const source = row.source || (row.createdByAgent ? "agent" : "ui");
  return {
    schemaVersion: "1.0",
    eventId: row.eventId || row.id,
    occurredAt: row.timestamp.toISOString(),
    appId: APP_ID,
    source,
    actionType: row.actionType,
    outcome: row.actionOutcome || "executed",
    actor: { userIdHash },
    action: { args: {} },
  };
}

async function listFallbackEvents(limit: number): Promise<FallbackElahEvent[]> {
  const take = Math.min(Math.max(limit, 1), 20_000);
  const rows = await prisma.auditLog.findMany({
    orderBy: { timestamp: "asc" },
    take,
    select: {
      id: true,
      eventId: true,
      timestamp: true,
      source: true,
      createdByAgent: true,
      actionType: true,
      actionOutcome: true,
      userIdHash: true,
      actorId: true,
    },
  });
  const mapped: FallbackElahEvent[] = [];
  for (const row of rows) {
    const event = fallbackFromAuditRow(row);
    if (!event) continue;
    mapped.push(event);
  }
  return mapped;
}

function isQualityOk(event: unknown, check: (event: unknown) => unknown): boolean {
  return qualityFromCheck(check(event)).ok;
}

async function collectEvents(
  api: EnvelopeApi | null,
  limit: number,
): Promise<{ events: Record<string, unknown>[]; source: "envelope" | "fallback" }> {
  const fetchLimit = Math.min(Math.max(limit * 20, limit), 20_000);
  if (api) {
    const listed = await api.listIngestibleEvents({
      limit: fetchLimit,
      take: fetchLimit,
      quality: "ok",
    });
    const items = Array.isArray(listed) ? listed : [];
    const envelopes = items
      .map(unwrapListedItem)
      .filter(isRecord)
      .map((event) => stripIdentityFields(event))
      .filter((event) => !isPageViewActionType(event.actionType))
      .filter((event) => isQualityOk(event, api.checkElahEvent));
    return {
      events: keepEarliestByEventId(envelopes).slice(0, limit),
      source: "envelope",
    };
  }

  const mapped = await listFallbackEvents(fetchLimit);
  const ok = mapped
    .map((event) => stripIdentityFields(event))
    .filter((event) => isQualityOk(event, checkElahEventFallback));
  return {
    events: keepEarliestByEventId(ok).slice(0, limit) as unknown as Record<string, unknown>[],
    source: "fallback",
  };
}

async function writeJsonl(events: Record<string, unknown>[], out: string | null) {
  const lines = events.map((event) => JSON.stringify(event)).join("\n");
  const body = events.length ? `${lines}\n` : "";
  if (!out) {
    process.stdout.write(body);
    return;
  }
  const resolved = path.resolve(out);
  await mkdir(path.dirname(resolved), { recursive: true });
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(resolved, { encoding: "utf8" });
    stream.on("error", reject);
    stream.on("finish", resolve);
    stream.end(body);
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    return;
  }

  const api = await loadEnvelopeApi();
  const { events, source } = await collectEvents(api, opts.limit);
  await writeJsonl(events, opts.out);

  const dest = opts.out ? path.resolve(opts.out) : "stdout";
  process.stderr.write(
    `export:elah-events source=${source} limit=${opts.limit} wrote=${events.length} out=${dest}\n`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
