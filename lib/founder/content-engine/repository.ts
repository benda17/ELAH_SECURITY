import "server-only";
import { prisma } from "@/lib/prisma";
import { ensureLandingPageLink } from "./llm";

export async function listContentEngineRuns(limit = 20) {
  return prisma.contentEngineRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}

export async function listLinkedInDrafts(limit = 50) {
  return prisma.linkedInPostDraft.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Rewrite unpublished draft bodies that still close with a legacy landing URL. */
export async function rewriteQueuedDraftLandingUrls(): Promise<number> {
  const drafts = await prisma.linkedInPostDraft.findMany({
    where: { status: { not: "published" } },
    select: { id: true, body: true },
  });
  let updated = 0;
  for (const draft of drafts) {
    const body = ensureLandingPageLink(draft.body);
    if (body === draft.body) continue;
    await prisma.linkedInPostDraft.update({
      where: { id: draft.id },
      data: { body },
    });
    updated += 1;
  }
  return updated;
}

export async function countLinkedInPostsByStatus() {
  const rows = await prisma.linkedInPostDraft.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const counts: Record<string, number> = {
    draft: 0,
    approved: 0,
    rejected: 0,
    published: 0,
  };
  for (const row of rows) {
    counts[row.status] = row._count._all;
  }
  return counts;
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
    data: { body: ensureLandingPageLink(body), ...(title != null ? { title } : {}) },
  });
}

export type DailyPostPoint = {
  date: string;
  label: string;
  created: number;
  published: number;
  facebook: number;
};

/** Last N calendar days of content activity for the Content Engine graph. */
export async function getDailyPostSeries(days = 30): Promise<DailyPostPoint[]> {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const drafts = await prisma.linkedInPostDraft.findMany({
    where: {
      OR: [
        { createdAt: { gte: start, lte: end } },
        { publishedAt: { gte: start, lte: end } },
        { facebookPublishedAt: { gte: start, lte: end } },
      ],
    },
    select: {
      createdAt: true,
      publishedAt: true,
      facebookPublishedAt: true,
    },
  });

  const byDay = new Map<string, DailyPostPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    byDay.set(key, { date: key, label, created: 0, published: 0, facebook: 0 });
  }

  const bump = (when: Date | null | undefined, field: "created" | "published" | "facebook") => {
    if (!when) return;
    const key = when.toISOString().slice(0, 10);
    const row = byDay.get(key);
    if (row) row[field] += 1;
  };

  for (const draft of drafts) {
    bump(draft.createdAt, "created");
    bump(draft.publishedAt, "published");
    bump(draft.facebookPublishedAt, "facebook");
  }

  return Array.from(byDay.values());
}
