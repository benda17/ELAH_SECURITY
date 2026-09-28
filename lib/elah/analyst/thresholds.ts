import "server-only";
import { prisma } from "@/lib/db";
import {
  ELAH_ANALYST_ACTION_TYPES,
  type AnalystActor,
  type AnalystActorRef,
  type AnalystResult,
} from "./constants";
import {
  DEFAULT_DISPLAY_THRESHOLDS,
  validateThresholds,
  type ElahDisplayThresholds,
} from "./bands";
import { actorRefOf, parsePayload, writeAnalystRow } from "./store";

export {
  DEFAULT_DISPLAY_THRESHOLDS,
  SCORE_BANDS,
  bandForScore,
  validateThresholds,
  type ElahDisplayThresholds,
  type ScoreBand,
} from "./bands";

/**
 * Customer-configurable DISPLAY thresholds (org-wide, latest wins).
 *
 * These only change how the analyst UI buckets / sorts / highlights events.
 * They NEVER change `elahScore`, are never sent to the scorer, and never
 * allow, block, or execute anything — bank policy alone decides.
 */

export interface ThresholdsState {
  thresholds: ElahDisplayThresholds;
  /** true when no valid thresholds row exists yet. */
  isDefault: boolean;
  updatedAt: string | null;
  updatedBy: AnalystActorRef | null;
}

/** Latest thresholds with metadata; falls back to defaults. */
export async function getThresholdsState(): Promise<ThresholdsState> {
  const rows = await prisma.auditLog.findMany({
    where: { actionType: ELAH_ANALYST_ACTION_TYPES.THRESHOLDS_SET },
    orderBy: { timestamp: "desc" },
    take: 10,
    select: {
      timestamp: true,
      actorId: true,
      actorName: true,
      role: true,
      inputDataSummary: true,
    },
  });
  for (const row of rows) {
    const parsed = validateThresholds(parsePayload(row.inputDataSummary));
    if (!parsed.ok) continue;
    return {
      thresholds: parsed.value,
      isDefault: false,
      updatedAt: row.timestamp.toISOString(),
      updatedBy: actorRefOf(row),
    };
  }
  return {
    thresholds: { ...DEFAULT_DISPLAY_THRESHOLDS },
    isDefault: true,
    updatedAt: null,
    updatedBy: null,
  };
}

/** Current display thresholds (defaults when never configured). */
export async function getThresholds(): Promise<ElahDisplayThresholds> {
  return (await getThresholdsState()).thresholds;
}

/** Validate and persist new display thresholds. Caller must hold `analyst:configure_thresholds`. */
export async function setThresholds(
  actor: AnalystActor,
  input: ElahDisplayThresholds,
): Promise<AnalystResult<ElahDisplayThresholds>> {
  const parsed = validateThresholds(input);
  if (!parsed.ok) return parsed;
  await writeAnalystRow({
    actionType: ELAH_ANALYST_ACTION_TYPES.THRESHOLDS_SET,
    actor,
    eventId: null,
    page: "/admin/elah-dashboard",
    targetResource: "elah_display_thresholds",
    payload: { ...parsed.value },
  });
  return parsed;
}
