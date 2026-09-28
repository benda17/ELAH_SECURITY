import "server-only";
import { ELAH_ANALYST_ACTION_TYPES, type AnalystActor } from "./constants";
import type { AnalystExportFormat } from "./export";
import { serializeAnalystFilters, type AnalystEventFilters } from "./filters";
import { writeAnalystRow } from "./store";

/** Max eventIds recorded on an export row (enough for the 1000-row export cap). */
export const EXPORT_AUDIT_EVENT_IDS_MAX = 1000;

/** Append an `elah_analyst_export_created` row (filters, format, row count, included eventIds). */
export async function recordAnalystExport(
  actor: AnalystActor,
  input: { filters: AnalystEventFilters; format: AnalystExportFormat; eventIds: string[] },
): Promise<void> {
  await writeAnalystRow({
    actionType: ELAH_ANALYST_ACTION_TYPES.EXPORT_CREATED,
    actor,
    eventId: null,
    page: "/api/admin/elah/analyst/export",
    targetResource: `elah_analyst_export:${input.format}`,
    payload: {
      format: input.format,
      query: serializeAnalystFilters(input.filters),
      rowCount: input.eventIds.length,
      eventIds: input.eventIds.slice(0, EXPORT_AUDIT_EVENT_IDS_MAX),
    },
  });
}
