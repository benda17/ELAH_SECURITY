import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import {
  detectAccountContext,
  detectAmountBucket,
  detectRecipientType,
  hashUserId,
} from "./helpers";

const MAX_USER_AGENT_CHARS = 400;

/**
 * Page-view actionTypes still receive an `eventId` for uniqueness, but they are
 * **not** ElahEvent scoring units. Matching suffixes: `*_view`, `*_viewed`,
 * `*_opened`, `*_searched`.
 */
const PAGE_VIEW_ACTION_RE = /_(view|viewed|opened|searched)$/;

const eventIdAls = new AsyncLocalStorage<string>();

export type ElahEventSource = "ui" | "agent" | "system";

export function mintEventId(): string {
  return randomUUID();
}

/** ISO-8601 UTC: `YYYY-MM-DDTHH:mm:ss.sssZ`. */
export function toIsoUtc(date: Date): string {
  return date.toISOString();
}

export function truncateUserAgent(
  ua: string | null | undefined,
): string | null {
  if (!ua) return null;
  return ua.length > MAX_USER_AGENT_CHARS
    ? ua.slice(0, MAX_USER_AGENT_CHARS)
    : ua;
}

export function sourceFromCreatedByAgent(
  flag: boolean | null | undefined,
): "agent" | "ui" {
  return flag ? "agent" : "ui";
}

export function isPageViewActionType(actionType: string): boolean {
  return PAGE_VIEW_ACTION_RE.test(actionType);
}

export function currentEventId(): string | undefined {
  return eventIdAls.getStore();
}

export function runWithEventId<T>(id: string, fn: () => T): T {
  return eventIdAls.run(id, fn);
}

export function userIdHashFromActor(
  actorId: string | null | undefined,
): string | null {
  if (!actorId) return null;
  return hashUserId(actorId);
}

export interface BuildElahLogContextInput {
  amount?: number | null;
  createdByAgent?: boolean;
  args?: Record<string, unknown> | null;
  page?: string | null;
  toolName?: string | null;
}

export interface ElahLogContext {
  amountBucket: string;
  accountContext: string;
  recipientType: string;
  occurredAt: string;
  source: "agent" | "ui";
}

/**
 * Mapper-ready banking context for a scoring-unit emit. Page-view audits
 * (`*_view` / `*_viewed` / `*_opened` / `*_searched`) should still mint an
 * `eventId` but are not ElahEvent scoring units — callers may omit this
 * nested object for those actionTypes.
 */
export function buildElahLogContext(
  input: BuildElahLogContextInput,
): ElahLogContext {
  const args: Record<string, unknown> = { ...(input.args ?? {}) };
  if (
    typeof input.amount === "number" &&
    Number.isFinite(input.amount) &&
    args.amount == null
  ) {
    args.amount = input.amount;
  }
  const hint = [input.page, input.toolName].filter(Boolean).join(" ");
  return {
    amountBucket: detectAmountBucket(hint, args),
    accountContext: detectAccountContext(hint, args),
    recipientType: detectRecipientType(hint, args),
    occurredAt: toIsoUtc(new Date()),
    source: sourceFromCreatedByAgent(!!input.createdByAgent),
  };
}
