import "server-only";
import { prisma } from "@/lib/prisma";

export async function listContentEngineRuns(limit = 20) {
  return prisma.contentEngineRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function listLinkedInDrafts(limit = 30) {
  return prisma.linkedInPostDraft.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listSourceEvents(limit = 30) {
  return prisma.contentSourceEvent.findMany({
    orderBy: { capturedAt: "desc" },
    take: limit,
  });
}

export async function getLinkedInIntegration() {
  return prisma.linkedInIntegration.findFirst({ orderBy: { updatedAt: "desc" } });
}

export async function updateDraftStatus(
  id: string,
  status: "draft" | "approved" | "rejected" | "published",
  reviewerNotes?: string,
) {
  return prisma.linkedInPostDraft.update({
    where: { id },
    data: {
      status,
      reviewerNotes: reviewerNotes ?? undefined,
      ...(status === "published" ? { publishedAt: new Date() } : {}),
    },
  });
}

export async function updateDraftBody(id: string, body: string, title?: string) {
  return prisma.linkedInPostDraft.update({
    where: { id },
    data: { body, ...(title != null ? { title } : {}) },
  });
}
