import "server-only";
import { prisma } from "@/lib/db";
import { actorTypeFromRole } from "@/lib/auth/roles";
import {
  ELAH_ANALYST_ACTION_PREFIX,
  ELAH_ANALYST_FEATURE,
  type AnalystActor,
  type AnalystActorRef,
  type ElahAnalystActionType,
} from "./constants";

/**
 * Append-only AuditLog persistence for analyst rows.
 *
 * Uses prisma directly rather than `writeAuditLog` because that helper mints an
 * eventId when none is given, auto-fills the session/customer hash, and merges
 * an `elah` banking-context object into `inputDataSummary` — all wrong for
 * analyst metadata rows. Rows are never updated or deleted.
 */

export const ANALYST_PAYLOAD_VERSION = 1;

export const ANALYST_ROW_SELECT = {
  id: true,
  timestamp: true,
  actionType: true,
  eventId: true,
  actorId: true,
  actorName: true,
  role: true,
  inputDataSummary: true,
} as const;

export interface AnalystAuditRow {
  id: string;
  timestamp: Date;
  actionType: string;
  eventId: string | null;
  actorId: string | null;
  actorName: string | null;
  role: string | null;
  inputDataSummary: string | null;
}

export async function writeAnalystRow(input: {
  actionType: ElahAnalystActionType;
  actor: AnalystActor;
  /** Target ElahEvent id; null for reviewer- or org-level rows (views, thresholds, exports). */
  eventId: string | null;
  payload: Record<string, unknown>;
  page?: string | null;
  targetResource?: string | null;
}): Promise<AnalystAuditRow> {
  return prisma.auditLog.create({
    data: {
      actorType: actorTypeFromRole(input.actor.role),
      actorId: input.actor.id,
      actorName: input.actor.name,
      role: input.actor.role,
      customerTier: "not_applicable",
      actionType: input.actionType,
      page: input.page ?? null,
      toolOrFeatureUsed: ELAH_ANALYST_FEATURE,
      inputDataSummary: JSON.stringify({ v: ANALYST_PAYLOAD_VERSION, ...input.payload }),
      targetResource: input.targetResource ?? null,
      riskLevel: "low",
      actionOutcome: "submitted",
      createdByAgent: false,
      eventId: input.eventId,
      userIdHash: null,
      source: "system",
    },
    select: ANALYST_ROW_SELECT,
  });
}

/** Cheap existence check: any non-analyst AuditLog row carries this eventId. */
export async function eventExists(eventId: string): Promise<boolean> {
  const row = await prisma.auditLog.findFirst({
    where: { eventId, NOT: { actionType: { startsWith: ELAH_ANALYST_ACTION_PREFIX } } },
    select: { id: true },
  });
  return !!row;
}

export function parsePayload(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function actorRefOf(row: {
  actorId: string | null;
  actorName: string | null;
  role: string | null;
}): AnalystActorRef {
  return { id: row.actorId, name: row.actorName, role: row.role };
}
