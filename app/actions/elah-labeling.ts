"use server";

import { revalidatePath } from "next/cache";
import { requireSecurity } from "@/lib/auth/guards";
import { hashUserId } from "@/lib/elah/helpers";
import { writeAuditLog } from "@/lib/logging/logger";
import {
  isAnnotatorConfidence,
  isContextualRiskTag,
  isElahBankingIntent,
  upsertGoldLabel,
  type ContextualRiskTag,
  type GoldLabel,
} from "@/lib/elah/dataset/label-store";

const NOTES_MAX = 2000;
const PII_DIGITS = /\d{8,}/;

export interface LabelingActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

function parseCoord(
  value: FormDataEntryValue | null,
  name: string,
): number | { error: string } {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1) {
    return { error: `${name} must be a number between 0 and 1.` };
  }
  return Math.round(n * 1000) / 1000;
}

export async function saveGoldLabel(
  _prev: LabelingActionState | undefined,
  formData: FormData,
): Promise<LabelingActionState> {
  const user = await requireSecurity();

  const recordId = String(formData.get("recordId") ?? "").trim();
  if (!recordId) {
    return { error: "recordId is required." };
  }

  const intentLabel = String(formData.get("intentLabel") ?? "").trim();
  if (!isElahBankingIntent(intentLabel)) {
    return { error: "intentLabel must be a closed ElahBankingIntent value." };
  }

  const confidenceRaw = String(formData.get("annotatorConfidence") ?? "").trim();
  if (!isAnnotatorConfidence(confidenceRaw)) {
    return { error: "annotatorConfidence must be high, medium, or low." };
  }

  const reviewNotes = String(formData.get("reviewNotes") ?? "");
  if (reviewNotes.length > NOTES_MAX) {
    return { error: `reviewNotes must be at most ${NOTES_MAX} characters.` };
  }
  if (PII_DIGITS.test(reviewNotes)) {
    return { error: "reviewNotes must not contain long digit sequences (possible PII)." };
  }

  const tags = formData
    .getAll("contextualRiskTags")
    .map((value) => String(value))
    .filter(isContextualRiskTag);

  const humanAgency = parseCoord(formData.get("humanAgency"), "humanAgency");
  if (typeof humanAgency === "object") return humanAgency;
  const financialRisk = parseCoord(formData.get("financialRisk"), "financialRisk");
  if (typeof financialRisk === "object") return financialRisk;
  const emotionalUrgency = parseCoord(
    formData.get("emotionalUrgency"),
    "emotionalUrgency",
  );
  if (typeof emotionalUrgency === "object") return emotionalUrgency;

  const labeledAt = new Date().toISOString();
  const annotatorId = `${user.role}:${hashUserId(user.id)}`;

  const label: GoldLabel = {
    recordId,
    intentLabel,
    annotatorId,
    annotatorConfidence: confidenceRaw,
    contextualRiskTags: tags as ContextualRiskTag[],
    reviewNotes,
    humanAgency,
    financialRisk,
    emotionalUrgency,
    labeledAt,
  };

  upsertGoldLabel(label);

  await writeAuditLog({
    actionType: "elah_gold_label_saved",
    page: `/admin/elah-labeling/${recordId}`,
    toolOrFeatureUsed: "elah_labeling",
    riskLevel: "low",
    actionOutcome: "submitted",
    inputDataSummary: {
      recordId,
      intentLabel,
      annotatorConfidence: confidenceRaw,
      tagCount: tags.length,
      notesLength: reviewNotes.length,
    },
  });

  revalidatePath("/admin/elah-labeling");
  revalidatePath(`/admin/elah-labeling/${recordId}`);
  return { ok: true, message: "Gold label saved." };
}
