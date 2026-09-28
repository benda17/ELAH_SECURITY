import "server-only";
import { prisma } from "@/lib/db";
import { mapAuditLogToElahEvent } from "@/lib/elah/envelope";
import { parseMetadataJson, parseScoreSnapshot } from "@/lib/elah/score-read";
import {
  ELAH_ANALYST_ACTION_TYPES,
  type AnalystActorRef,
} from "./constants";
import { parsePayload } from "./store";

/**
 * Chronological history of everything recorded against one ElahEvent:
 * the ingest AuditLog row(s), other operational audit rows sharing the
 * eventId, AgentEventLog hops (incl. `elah_scored` / `elah_scoring_unavailable`),
 * analyst notes / status / marks / feedback, and analyst exports that
 * included the event. Summaries never include raw utterances or tool args.
 * Gate with `analyst:view_audit`.
 */

export type AuditHistoryKind =
  | "ingest"
  | "audit"
  | "agent"
  | "score"
  | "score_unavailable"
  | "note"
  | "review_status"
  | "outcome_mark"
  | "feedback"
  | "export";

export interface AuditHistoryEntry {
  /** Source row id. */
  id: string;
  /** ISO time. */
  at: string;
  kind: AuditHistoryKind;
  /** AuditLog.actionType or AgentEventLog.eventType. */
  type: string;
  table: "audit_log" | "agent_event_log";
  /** null for system/agent hops without a recorded actor. */
  actor: AnalystActorRef | null;
  summary: string;
}

const EXPORT_SCAN = 200;

function actorOf(row: {
  actorId: string | null;
  actorName: string | null;
  role: string | null;
}): AnalystActorRef | null {
  if (!row.actorId && !row.actorName && !row.role) return null;
  return { id: row.actorId, name: row.actorName, role: row.role };
}

function clip(text: string, max = 160): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function fmt(n: number | null): string {
  return n == null ? "—" : n.toFixed(3);
}

type AuditRow = Awaited<ReturnType<typeof prisma.auditLog.findMany>>[number];

function auditEntry(row: AuditRow): AuditHistoryEntry {
  const base = {
    id: row.id,
    at: row.timestamp.toISOString(),
    type: row.actionType,
    table: "audit_log" as const,
    actor: actorOf(row),
  };
  const payload = parsePayload(row.inputDataSummary);
  switch (row.actionType) {
    case ELAH_ANALYST_ACTION_TYPES.NOTE_ADDED:
      return {
        ...base,
        kind: "note",
        summary: `Note: ${clip(typeof payload.text === "string" ? payload.text : "")}`,
      };
    case ELAH_ANALYST_ACTION_TYPES.REVIEW_STATUS_SET:
      return { ...base, kind: "review_status", summary: `Review status → ${String(payload.status)}` };
    case ELAH_ANALYST_ACTION_TYPES.OUTCOME_MARKED:
      return {
        ...base,
        kind: "outcome_mark",
        summary: payload.mark ? `Outcome marked ${String(payload.mark)}` : "Outcome mark cleared",
      };
    case ELAH_ANALYST_ACTION_TYPES.FEEDBACK_SUBMITTED:
      return {
        ...base,
        kind: "feedback",
        summary: `Feedback ${String(payload.rating)}/5${
          typeof payload.suggestedIntentLabel === "string"
            ? ` · suggested ${payload.suggestedIntentLabel}`
            : ""
        }`,
      };
    default: {
      const event = mapAuditLogToElahEvent(row);
      if (event) {
        return {
          ...base,
          kind: "ingest",
          summary: `Ingested ${event.actionType} · ${event.outcome} · source ${event.source}${
            event.action.toolName ? ` · ${event.action.toolName}` : ""
          }`,
        };
      }
      return {
        ...base,
        kind: "audit",
        summary: `${row.actionType} · ${row.actionOutcome}${
          row.toolOrFeatureUsed ? ` · ${row.toolOrFeatureUsed}` : ""
        }`,
      };
    }
  }
}

type AgentRow = Awaited<ReturnType<typeof prisma.agentEventLog.findMany>>[number];

function agentEntry(row: AgentRow): AuditHistoryEntry {
  const base = {
    id: row.id,
    at: row.timestamp.toISOString(),
    type: row.eventType,
    table: "agent_event_log" as const,
    actor: null,
  };
  const snapshot = parseScoreSnapshot(row.eventType, parseMetadataJson(row.metadata));
  if (snapshot?.kind === "scored") {
    return {
      ...base,
      kind: "score",
      summary: `ELAH ${snapshot.status}: score ${fmt(snapshot.elahScore)} · confidence ${fmt(
        snapshot.confidence,
      )} · ${snapshot.intentLabel ?? "no label"} · ${
        snapshot.provenanceModelVersion ?? snapshot.provenanceScorer ?? "unknown scorer"
      }`,
    };
  }
  if (snapshot?.kind === "unavailable") {
    return { ...base, kind: "score_unavailable", summary: `ELAH scoring unavailable: ${snapshot.reason}` };
  }
  const parts = [row.eventType];
  if (row.toolName) parts.push(row.toolName);
  if (row.policyDecision) parts.push(`policy ${row.policyDecision}`);
  if (row.detectedIntent) parts.push(`intent ${row.detectedIntent}`);
  return { ...base, kind: "agent", summary: parts.join(" · ") };
}

/** Everything that happened to `eventId`, oldest first. */
export async function getEventAuditHistory(eventId: string): Promise<AuditHistoryEntry[]> {
  if (!eventId) return [];
  const [auditRows, agentRows, exportRows] = await Promise.all([
    prisma.auditLog.findMany({ where: { eventId }, orderBy: { timestamp: "asc" } }),
    prisma.agentEventLog.findMany({ where: { eventId }, orderBy: { timestamp: "asc" } }),
    prisma.auditLog.findMany({
      where: {
        actionType: ELAH_ANALYST_ACTION_TYPES.EXPORT_CREATED,
        inputDataSummary: { contains: `"${eventId}"` },
      },
      orderBy: { timestamp: "desc" },
      take: EXPORT_SCAN,
    }),
  ]);

  const entries: AuditHistoryEntry[] = [
    ...auditRows.map(auditEntry),
    ...agentRows.map(agentEntry),
  ];
  for (const row of exportRows) {
    const payload = parsePayload(row.inputDataSummary);
    const ids = Array.isArray(payload.eventIds) ? payload.eventIds : [];
    if (!ids.includes(eventId)) continue;
    entries.push({
      id: row.id,
      at: row.timestamp.toISOString(),
      kind: "export",
      type: row.actionType,
      table: "audit_log",
      actor: actorOf(row),
      summary: `Included in ${String(payload.format ?? "")} export of ${String(
        payload.rowCount ?? ids.length,
      )} rows`,
    });
  }

  entries.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  return entries;
}
