"use server";

import { revalidatePath } from "next/cache";
import {
  addAnalystNote,
  analystActorFromUser,
  deleteView,
  markOutcome,
  parseAnalystFilters,
  requireAnalystPermission,
  saveView,
  setReviewStatus,
  setThresholds,
  submitFeedback,
  type OutcomeMark,
  type ReviewStatus,
} from "@/lib/elah/analyst";
import type { ElahBankingIntent } from "@/lib/elah/types";

/**
 * Server actions for the Phase 9 analyst UI. All are `useFormState`
 * compatible: `(prevState, formData) => AnalystActionState`.
 * Annotations need `analyst:annotate`; saved views need `analyst:view`
 * (personal, affect no one else); thresholds need `analyst:configure_thresholds`.
 */

export interface AnalystActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function revalidateEvent(eventId: string) {
  revalidatePath("/admin/elah-events");
  revalidatePath(`/admin/elah-events/${eventId}`);
  revalidatePath("/admin/elah-dashboard");
}

function revalidateAll() {
  revalidatePath("/admin/elah-events");
  revalidatePath("/admin/elah-events/[eventId]", "page");
  revalidatePath("/admin/elah-dashboard");
}

/** FormData: eventId, text. */
export async function addAnalystNoteAction(
  _prev: AnalystActionState | undefined,
  formData: FormData,
): Promise<AnalystActionState> {
  const user = await requireAnalystPermission("analyst:annotate");
  const eventId = field(formData, "eventId").trim();
  const result = await addAnalystNote(analystActorFromUser(user), {
    eventId,
    text: field(formData, "text"),
  });
  if (!result.ok) return { error: result.error };
  revalidateEvent(result.value.eventId);
  return { ok: true, message: "Note added." };
}

/** FormData: eventId, status (unreviewed | in_review | reviewed | escalated). */
export async function setReviewStatusAction(
  _prev: AnalystActionState | undefined,
  formData: FormData,
): Promise<AnalystActionState> {
  const user = await requireAnalystPermission("analyst:annotate");
  const eventId = field(formData, "eventId").trim();
  const result = await setReviewStatus(analystActorFromUser(user), {
    eventId,
    status: field(formData, "status").trim() as ReviewStatus,
  });
  if (!result.ok) return { error: result.error };
  revalidateEvent(eventId);
  return { ok: true, message: `Review status set to ${result.value.status}.` };
}

/** FormData: eventId, mark (confirmed_correct | false_positive | false_negative | "" to clear), reason?. */
export async function markOutcomeAction(
  _prev: AnalystActionState | undefined,
  formData: FormData,
): Promise<AnalystActionState> {
  const user = await requireAnalystPermission("analyst:annotate");
  const eventId = field(formData, "eventId").trim();
  const markRaw = field(formData, "mark").trim();
  const reason = field(formData, "reason");
  const result = await markOutcome(analystActorFromUser(user), {
    eventId,
    mark: markRaw ? (markRaw as OutcomeMark) : null,
    ...(reason.trim() ? { reason } : {}),
  });
  if (!result.ok) return { error: result.error };
  revalidateEvent(eventId);
  return {
    ok: true,
    message: result.value.mark ? `Marked ${result.value.mark}.` : "Outcome mark cleared.",
  };
}

/** FormData: eventId, rating (1-5), text?, suggestedIntentLabel? (closed taxonomy). */
export async function submitFeedbackAction(
  _prev: AnalystActionState | undefined,
  formData: FormData,
): Promise<AnalystActionState> {
  const user = await requireAnalystPermission("analyst:annotate");
  const eventId = field(formData, "eventId").trim();
  const text = field(formData, "text");
  const label = field(formData, "suggestedIntentLabel").trim();
  const result = await submitFeedback(analystActorFromUser(user), {
    eventId,
    rating: Number(field(formData, "rating")),
    ...(text.trim() ? { text } : {}),
    suggestedIntentLabel: label ? (label as ElahBankingIntent) : null,
  });
  if (!result.ok) return { error: result.error };
  revalidateEvent(eventId);
  return { ok: true, message: "Feedback submitted." };
}

/** FormData: name, query (analyst filter query string), viewId? (overwrite a specific view). */
export async function saveViewAction(
  _prev: AnalystActionState | undefined,
  formData: FormData,
): Promise<AnalystActionState> {
  const user = await requireAnalystPermission("analyst:view");
  const viewId = field(formData, "viewId").trim();
  const result = await saveView(analystActorFromUser(user), {
    name: field(formData, "name"),
    filters: parseAnalystFilters(field(formData, "query")),
    ...(viewId ? { viewId } : {}),
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin/elah-events");
  revalidatePath("/admin/elah-dashboard");
  return { ok: true, message: `View "${result.value.name}" saved.` };
}

/** FormData: viewId. */
export async function deleteViewAction(
  _prev: AnalystActionState | undefined,
  formData: FormData,
): Promise<AnalystActionState> {
  const user = await requireAnalystPermission("analyst:view");
  const result = await deleteView(analystActorFromUser(user), field(formData, "viewId").trim());
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin/elah-events");
  revalidatePath("/admin/elah-dashboard");
  return { ok: true, message: "View deleted." };
}

/** FormData: reviewBelow, watchBelow (0-1, reviewBelow <= watchBelow). Display only; never changes elahScore. */
export async function setThresholdsAction(
  _prev: AnalystActionState | undefined,
  formData: FormData,
): Promise<AnalystActionState> {
  const user = await requireAnalystPermission("analyst:configure_thresholds");
  const reviewBelowRaw = field(formData, "reviewBelow").trim();
  const watchBelowRaw = field(formData, "watchBelow").trim();
  const result = await setThresholds(analystActorFromUser(user), {
    reviewBelow: reviewBelowRaw === "" ? Number.NaN : Number(reviewBelowRaw),
    watchBelow: watchBelowRaw === "" ? Number.NaN : Number(watchBelowRaw),
  });
  if (!result.ok) return { error: result.error };
  revalidateAll();
  return {
    ok: true,
    message: `Display thresholds saved (review < ${result.value.reviewBelow}, watch < ${result.value.watchBelow}).`,
  };
}
