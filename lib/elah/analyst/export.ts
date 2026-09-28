/**
 * Analyst export formatting. Client-safe (pure). Excludes utterances, args,
 * IPs, and user agents; `userIdHash` is already a one-way hash.
 */

import type { AnalystEventRow } from "./types";

export const ANALYST_EXPORT_COLUMNS = [
  "occurredAt",
  "eventId",
  "actionType",
  "source",
  "toolName",
  "outcome",
  "userIdHash",
  "sessionId",
  "elahScore",
  "confidence",
  "intentLabel",
  "modelVersion",
  "band",
  "reviewStatus",
  "outcomeMark",
] as const;

export type AnalystExportColumn = (typeof ANALYST_EXPORT_COLUMNS)[number];
export type AnalystExportRecord = Record<AnalystExportColumn, string | number | null>;

export const ANALYST_EXPORT_FORMATS = ["csv", "json"] as const;
export type AnalystExportFormat = (typeof ANALYST_EXPORT_FORMATS)[number];

/** Flatten an analyst row to the export columns. */
export function toExportRecord(row: AnalystEventRow): AnalystExportRecord {
  return {
    occurredAt: row.event.occurredAt,
    eventId: row.event.eventId,
    actionType: row.event.actionType,
    source: row.event.source,
    toolName: row.event.action.toolName ?? null,
    outcome: row.event.outcome,
    userIdHash: row.event.actor.userIdHash ?? null,
    sessionId: row.event.actor.sessionId ?? null,
    elahScore: row.elahScore,
    confidence: row.confidence,
    intentLabel: row.intentLabel,
    modelVersion: row.modelVersion,
    band: row.band,
    reviewStatus: row.review.reviewStatus,
    outcomeMark: row.review.outcomeMark,
  };
}

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

/**
 * Escape one CSV cell: neutralize spreadsheet formulas (leading = + - @ tab CR
 * get a `'` prefix) on string cells, then RFC 4180 quote when needed.
 */
export function csvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  let text = String(value);
  if (FORMULA_TRIGGER.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text) || text !== text.trim()) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** CSV with header row, CRLF line endings. */
export function toCsv(rows: AnalystEventRow[]): string {
  const lines = [ANALYST_EXPORT_COLUMNS.join(",")];
  for (const row of rows) {
    const record = toExportRecord(row);
    lines.push(ANALYST_EXPORT_COLUMNS.map((column) => csvCell(record[column])).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

/** Pretty JSON array of flattened export records. */
export function toJson(rows: AnalystEventRow[]): string {
  return JSON.stringify(rows.map(toExportRecord), null, 2);
}
