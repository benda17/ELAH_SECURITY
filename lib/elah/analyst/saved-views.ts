import "server-only";
import { prisma } from "@/lib/db";
import {
  ELAH_ANALYST_ACTION_TYPES,
  type AnalystActor,
  type AnalystResult,
} from "./constants";
import {
  parseAnalystFilters,
  serializeAnalystFilters,
  type AnalystEventFilters,
} from "./filters";
import { ANALYST_ROW_SELECT, parsePayload, writeAnalystRow, type AnalystAuditRow } from "./store";
import { parseViewName, viewIdFromName, viewIdSchema } from "./validation";

/**
 * Per-reviewer saved filter views. Append-only AuditLog rows (eventId null,
 * actorId = reviewer). Key = (reviewerId, viewId); latest row wins; a
 * `elah_analyst_view_deleted` tombstone hides the view until saved again.
 * Filters are stored as the canonical query string and re-parsed on read.
 */

export interface SavedView {
  viewId: string;
  name: string;
  filters: AnalystEventFilters;
  /** Canonical query string (no leading `?`) — append to `/admin/elah-events?`. */
  query: string;
  reviewerId: string;
  createdAt: string;
  updatedAt: string;
}

const MAX_VIEWS_PER_REVIEWER = 50;

/** Pure fold of a reviewer's view rows (any order) into live views, newest update first. */
export function foldSavedViews(reviewerId: string, rows: AnalystAuditRow[]): SavedView[] {
  const sorted = [...rows].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime() || a.id.localeCompare(b.id),
  );
  const live = new Map<string, SavedView>();
  const firstSeen = new Map<string, string>();
  for (const row of sorted) {
    if (row.actorId !== reviewerId) continue;
    const payload = parsePayload(row.inputDataSummary);
    const viewId = typeof payload.viewId === "string" ? payload.viewId : null;
    if (!viewId) continue;
    const at = row.timestamp.toISOString();
    if (row.actionType === ELAH_ANALYST_ACTION_TYPES.VIEW_DELETED) {
      live.delete(viewId);
      firstSeen.delete(viewId);
      continue;
    }
    if (row.actionType !== ELAH_ANALYST_ACTION_TYPES.VIEW_SAVED) continue;
    const name = typeof payload.name === "string" ? payload.name : viewId;
    const filters = parseAnalystFilters(typeof payload.query === "string" ? payload.query : "");
    if (!firstSeen.has(viewId)) firstSeen.set(viewId, at);
    live.set(viewId, {
      viewId,
      name,
      filters,
      query: serializeAnalystFilters(filters),
      reviewerId,
      createdAt: firstSeen.get(viewId)!,
      updatedAt: at,
    });
  }
  return [...live.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Live saved views for a reviewer (User.id), newest update first. */
export async function listViews(reviewerId: string): Promise<SavedView[]> {
  if (!reviewerId) return [];
  const rows = await prisma.auditLog.findMany({
    where: {
      actorId: reviewerId,
      actionType: {
        in: [ELAH_ANALYST_ACTION_TYPES.VIEW_SAVED, ELAH_ANALYST_ACTION_TYPES.VIEW_DELETED],
      },
    },
    orderBy: { timestamp: "asc" },
    select: ANALYST_ROW_SELECT,
  });
  return foldSavedViews(reviewerId, rows);
}

/**
 * Save (or overwrite) a view. `viewId` defaults to a slug of `name`, so saving
 * the same name again overwrites it (latest wins).
 */
export async function saveView(
  actor: AnalystActor,
  input: { name: string; filters: AnalystEventFilters; viewId?: string },
): Promise<AnalystResult<SavedView>> {
  const name = parseViewName(input.name);
  if (!name.ok) return name;
  let viewId = viewIdFromName(name.value);
  if (input.viewId != null) {
    const parsedId = viewIdSchema.safeParse(input.viewId);
    if (!parsedId.success) return { ok: false, error: "viewId is malformed." };
    viewId = parsedId.data;
  }
  // Round-trip through the parser so only valid, canonical filters are stored.
  const filters = parseAnalystFilters(serializeAnalystFilters(input.filters ?? {}));
  const query = serializeAnalystFilters(filters);

  const existing = await listViews(actor.id);
  const previous = existing.find((view) => view.viewId === viewId);
  if (!previous && existing.length >= MAX_VIEWS_PER_REVIEWER) {
    return { ok: false, error: `At most ${MAX_VIEWS_PER_REVIEWER} saved views per reviewer.` };
  }

  const row = await writeAnalystRow({
    actionType: ELAH_ANALYST_ACTION_TYPES.VIEW_SAVED,
    actor,
    eventId: null,
    page: "/admin/elah-events",
    targetResource: `saved_view:${viewId}`,
    payload: { viewId, name: name.value, query },
  });
  const at = row.timestamp.toISOString();
  return {
    ok: true,
    value: {
      viewId,
      name: name.value,
      filters,
      query,
      reviewerId: actor.id,
      createdAt: previous?.createdAt ?? at,
      updatedAt: at,
    },
  };
}

/** Delete one of the actor's own views by appending a tombstone row. */
export async function deleteView(
  actor: AnalystActor,
  viewId: string,
): Promise<AnalystResult<{ viewId: string }>> {
  const parsedId = viewIdSchema.safeParse(viewId);
  if (!parsedId.success) return { ok: false, error: "viewId is malformed." };
  const existing = await listViews(actor.id);
  if (!existing.some((view) => view.viewId === parsedId.data)) {
    return { ok: false, error: "Saved view not found." };
  }
  await writeAnalystRow({
    actionType: ELAH_ANALYST_ACTION_TYPES.VIEW_DELETED,
    actor,
    eventId: null,
    page: "/admin/elah-events",
    targetResource: `saved_view:${parsedId.data}`,
    payload: { viewId: parsedId.data },
  });
  return { ok: true, value: { viewId: parsedId.data } };
}
