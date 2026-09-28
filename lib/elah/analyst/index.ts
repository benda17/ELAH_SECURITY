/**
 * Phase 9 analyst data layer (server barrel).
 *
 * Importing this barrel pulls in prisma + `server-only`. Client components
 * must import the client-safe modules directly instead:
 *   `./constants`, `./bands`, `./permissions`, `./filters`, `./validation`,
 *   `./types`, `./export`, `./stats`.
 */

export * from "./constants";
export * from "./bands";
export * from "./permissions";
export * from "./validation";
export * from "./filters";
export * from "./types";
export * from "./export";
export * from "./stats";

export { queryAnalystEvents, listFilterFacets, type AnalystQueryResult, type AnalystFilterFacets } from "./query";
export {
  addAnalystNote,
  setReviewStatus,
  markOutcome,
  submitFeedback,
  getEventAnnotations,
  getReviewStates,
  foldEventAnnotations,
  foldReviewStates,
  type AnalystNote,
  type ReviewStatusEntry,
  type OutcomeMarkEntry,
  type AnalystFeedback,
  type EventAnnotations,
} from "./annotations";
export { saveView, deleteView, listViews, foldSavedViews, type SavedView } from "./saved-views";
export { getThresholds, getThresholdsState, setThresholds, type ThresholdsState } from "./thresholds";
export { requireAnalystPermission, requireAnalystPermissionApi, analystActorFromUser } from "./rbac";
export { getEventAuditHistory, type AuditHistoryEntry, type AuditHistoryKind } from "./audit-history";
export { recordAnalystExport, EXPORT_AUDIT_EVENT_IDS_MAX } from "./export-audit";
export { getDashboardSnapshot, type DashboardSnapshot } from "./snapshot";
