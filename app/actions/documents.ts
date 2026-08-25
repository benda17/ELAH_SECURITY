"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth/guards";
import { writeAuditLog, writeRiskEvent } from "@/lib/logging/logger";

export interface DocResult {
  ok?: boolean;
  error?: string;
  message?: string;
}

export async function downloadDocumentAction(
  formData: FormData,
): Promise<DocResult> {
  const user = await requireCustomer();
  const profile = user.customerProfile!;
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Document id required." };

  const doc = await prisma.document.findFirst({
    where: { id, customerProfileId: profile.id },
  });
  if (!doc) return { error: "Document not found or not authorized." };

  const sensitive = doc.sensitivityLevel !== "standard";

  const log = await writeAuditLog({
    actionType: "document_downloaded",
    page: "/documents",
    toolOrFeatureUsed: "document_download_button",
    targetResource: `doc_${doc.id.slice(-6)}`,
    riskLevel: sensitive ? "high" : "medium",
    actionOutcome: "submitted",
    createdByAgent: false,
    inputDataSummary: {
      documentType: doc.documentType,
      sensitivity: doc.sensitivityLevel,
      title: doc.title,
      documentIdSuffix: doc.id.slice(-6),
    },
    reasonForFlagging: doc.containsInjectionTest
      ? "Document metadata contains controlled injection test text."
      : null,
  });

  if (doc.containsInjectionTest) {
    await writeRiskEvent({
      severity: "medium",
      eventType: "prompt_injection_metadata_observed",
      actorType: "customer",
      actorId: user.id,
      customerProfileId: profile.id,
      relatedAuditLogIds: [log.id],
      reasonForFlagging:
        "Customer downloaded a document whose metadata contains controlled injection test text. ELAH would later inspect agent action context here.",
      detectedPattern: "fake_document_metadata",
    });
  }

  revalidatePath("/documents");
  return { ok: true, message: `Simulated download — ${doc.title}` };
}

export async function bulkDownloadAction(): Promise<DocResult> {
  const user = await requireCustomer();
  const profile = user.customerProfile!;

  const log = await writeAuditLog({
    actionType: "document_bulk_download_attempt",
    page: "/documents",
    toolOrFeatureUsed: "bulk_download_button",
    riskLevel: "high",
    actionOutcome: "blocked",
    createdByAgent: false,
    reasonForFlagging:
      "Customer attempted to bulk-download all documents. Bulk download requires confirmation and may be blocked depending on tier.",
  });

  await writeRiskEvent({
    severity: "high",
    eventType: "bulk_download_attempt",
    actorType: "customer",
    actorId: user.id,
    customerProfileId: profile.id,
    relatedAuditLogIds: [log.id],
    reasonForFlagging:
      "Bulk-download lure pattern. In a real environment this could be a precursor to excessive data exfiltration.",
    detectedPattern: "bulk_download_lure",
  });

  return {
    ok: true,
    message:
      "Bulk download blocked. The attempt was logged and surfaced as a high-severity risk event.",
  };
}
