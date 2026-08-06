import "server-only";
import { prisma } from "@/lib/prisma";
import { getContentEngineConfig } from "./config";
import { generatePostBody } from "./llm";
import { publishTextToLinkedIn } from "./linkedin";

const DEFAULT_TOPICS = [
  "AI security in banking assistants",
  "Human intention scoring for financial agents",
  "Explainable AI for fraud and policy bypass detection",
];

export async function scanSourceEvents(): Promise<number> {
  const existing = await prisma.contentSourceEvent.count();
  if (existing > 0) return 0;

  const seeds = DEFAULT_TOPICS.map((title, i) => ({
    sourceType: "research",
    title,
    summary: `Seed topic ${i + 1} for ELAH LinkedIn content engine.`,
    url: null as string | null,
    metadata: JSON.stringify({ seed: true }),
  }));

  await prisma.contentSourceEvent.createMany({ data: seeds });
  return seeds.length;
}

export async function generateLinkedInDraft(
  trigger: "manual" | "cron",
): Promise<{ runId: string; draftId: string | null; error?: string; published?: boolean }> {
  const config = getContentEngineConfig();
  if (!config.enabled && trigger === "cron") {
    return { runId: "", draftId: null, error: "Content engine disabled" };
  }

  const run = await prisma.contentEngineRun.create({
    data: { trigger, status: "running", log: JSON.stringify(["Run started"]) },
  });

  try {
    await scanSourceEvents();
    const source = await prisma.contentSourceEvent.findFirst({
      where: { processed: false },
      orderBy: { capturedAt: "desc" },
    });

    const topic = source?.title ?? DEFAULT_TOPICS[0]!;
    const { text: body, provider } = await generatePostBody(topic, source?.summary);

    const draft = await prisma.linkedInPostDraft.create({
      data: {
        title: topic,
        body,
        hashtags: JSON.stringify(["#ELAH", "#AISecurity", "#BankingAI"]),
        status: "draft",
        sourceEventId: source?.id ?? null,
        runId: run.id,
      },
    });

    if (source) {
      await prisma.contentSourceEvent.update({
        where: { id: source.id },
        data: { processed: true },
      });
    }

    const logLines = [`Draft generated via ${provider}`, draft.id];
    let published = false;

    if (config.autoPublish) {
      const result = await publishTextToLinkedIn(body);
      if (result.ok) {
        await prisma.linkedInPostDraft.update({
          where: { id: draft.id },
          data: { status: "published", publishedAt: new Date() },
        });
        published = true;
        logLines.push(`Auto-published${result.postId ? ` (${result.postId})` : ""}`);
      } else {
        logLines.push(`Auto-publish skipped/failed: ${result.error}`);
      }
    }

    await prisma.contentEngineRun.update({
      where: { id: run.id },
      data: {
        status: "success",
        completedAt: new Date(),
        draftCount: 1,
        log: JSON.stringify(logLines),
      },
    });

    return { runId: run.id, draftId: draft.id, published };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.contentEngineRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: message,
        log: JSON.stringify(["Failed", message]),
      },
    });
    return { runId: run.id, draftId: null, error: message };
  }
}

export async function publishDraftById(
  draftId: string,
): Promise<{ ok: boolean; error?: string }> {
  const draft = await prisma.linkedInPostDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { ok: false, error: "Draft not found" };
  if (draft.status === "published") return { ok: true };

  const result = await publishTextToLinkedIn(draft.body);
  if (!result.ok) return { ok: false, error: result.error };

  await prisma.linkedInPostDraft.update({
    where: { id: draftId },
    data: { status: "published", publishedAt: new Date() },
  });
  return { ok: true };
}
