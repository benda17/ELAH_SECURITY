import "server-only";
import { prisma } from "@/lib/prisma";
import { getContentEngineConfig } from "./config";
import { publishTextToFacebook } from "./facebook";
import { ensureLandingPageLink, generatePostBody } from "./llm";
import { publishTextToLinkedIn } from "./linkedin";
import { ensureV2SourceEvents } from "./source-seeds";
import { publishTextToTwitter, toTweetText, parseTwitterPublishNote, upsertTwitterPublishNote } from "./twitter";
import { V2_SOURCE_TOPICS } from "./v2-content";

function parseHashtags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

const DEFAULT_TOPICS = V2_SOURCE_TOPICS;

const V2_DRAFT_HASHTAGS = ["#ELAH", "#APACT", "#AgentCAPTCHA"];

function pickTopic(indexHint?: number) {
  const i =
    typeof indexHint === "number"
      ? Math.abs(indexHint) % DEFAULT_TOPICS.length
      : Math.floor(Date.now() / 1000) % DEFAULT_TOPICS.length;
  return DEFAULT_TOPICS[i]!;
}

export async function scanSourceEvents(): Promise<number> {
  return ensureV2SourceEvents(prisma);
}

export async function generateLinkedInDraft(
  trigger: "manual" | "cron",
): Promise<{ runId: string; draftId: string | null; error?: string; published?: boolean }> {
  const config = await getContentEngineConfig();
  if (!config.enabled && trigger === "cron") {
    return { runId: "", draftId: null, error: "Content engine disabled" };
  }

  const run = await prisma.contentEngineRun.create({
    data: { trigger, status: "running", log: JSON.stringify(["Run started"]) },
  });

  try {
    await scanSourceEvents();
    const source = await prisma.contentSourceEvent.findFirst({
      where: {
        processed: false,
        title: { in: DEFAULT_TOPICS.map((topic) => topic.title) },
      },
      orderBy: { capturedAt: "asc" },
    });

    const draftCount = await prisma.linkedInPostDraft.count({ where: { era: "v2" } });
    const fallback = pickTopic(draftCount);
    const topic = source?.title ?? fallback.title;
    const researchContext = source?.summary ?? fallback.summary;
    const { text: body, provider } = await generatePostBody(topic, researchContext);

    const draft = await prisma.linkedInPostDraft.create({
      data: {
        title: topic,
        body,
        hashtags: JSON.stringify(V2_DRAFT_HASHTAGS),
        status: "draft",
        era: "v2",
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

    // Generation always creates reviewable drafts. Publishing is explicit (panel actions),
    // so new items land in Drafts / To post — never auto-marked published.
    const logLines = [
      `Draft generated via ${provider}`,
      draft.id,
      "Left as draft for review (no auto-publish)",
    ];
    if (config.autoPublish) {
      logLines.push("CONTENT_AUTO_PUBLISH is set but ignored on generate — publish from the panel");
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

    return { runId: run.id, draftId: draft.id, published: false };
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
  options?: { alsoTwitter?: boolean },
): Promise<{ ok: boolean; error?: string; twitterError?: string }> {
  const draft = await prisma.linkedInPostDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { ok: false, error: "Draft not found" };
  if (draft.status === "published") {
    if (options?.alsoTwitter) {
      const twitter = await publishDraftToTwitterById(draftId);
      return twitter.ok
        ? { ok: true }
        : { ok: true, twitterError: twitter.error };
    }
    return { ok: true };
  }

  const body = ensureLandingPageLink(draft.body);
  const result = await publishTextToLinkedIn(body);
  if (!result.ok) return { ok: false, error: result.error };

  await prisma.linkedInPostDraft.update({
    where: { id: draftId },
    data: {
      body,
      status: "published",
      publishedAt: new Date(),
      ...(result.postId ? { externalPostId: result.postId } : {}),
    },
  });

  if (options?.alsoTwitter) {
    const twitter = await publishDraftToTwitterById(draftId);
    if (!twitter.ok) return { ok: true, twitterError: twitter.error };
  }
  return { ok: true };
}

/** Mark a draft published after posting manually as the Elah company page in LinkedIn UI. */
export async function markDraftPublishedManually(
  draftId: string,
  options?: { alsoTwitter?: boolean },
): Promise<{ ok: boolean; error?: string; twitterError?: string }> {
  const draft = await prisma.linkedInPostDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { ok: false, error: "Draft not found" };
  if (draft.status !== "published") {
    const linkedInNote = "Posted manually as Elah Security company page via LinkedIn admin UI";
    const existingNotes = draft.reviewerNotes?.trim() ?? "";
    const reviewerNotes = !existingNotes
      ? linkedInNote
      : existingNotes.includes(linkedInNote)
        ? existingNotes
        : `${existingNotes}\n${linkedInNote}`;
    await prisma.linkedInPostDraft.update({
      where: { id: draftId },
      data: {
        status: "published",
        publishedAt: new Date(),
        externalPostId: `manual-company:${Date.now()}`,
        reviewerNotes,
      },
    });
  }

  if (options?.alsoTwitter) {
    const twitter = await publishDraftToTwitterById(draftId);
    if (!twitter.ok) return { ok: true, twitterError: twitter.error };
  }
  return { ok: true };
}

export async function publishDraftToFacebookById(
  draftId: string,
  options?: { alsoTwitter?: boolean },
): Promise<{ ok: boolean; error?: string; postId?: string; twitterError?: string }> {
  const draft = await prisma.linkedInPostDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { ok: false, error: "Draft not found" };
  if (!draft.facebookPostId) {
    const body = ensureLandingPageLink(draft.body);
    const result = await publishTextToFacebook(body, parseHashtags(draft.hashtags));
    if (!result.ok) return { ok: false, error: result.error };

    await prisma.linkedInPostDraft.update({
      where: { id: draftId },
      data: {
        body,
        facebookPostId: result.postId ?? null,
        facebookPublishedAt: new Date(),
      },
    });
  }

  if (options?.alsoTwitter) {
    const twitter = await publishDraftToTwitterById(draftId);
    if (!twitter.ok) {
      return {
        ok: true,
        postId: (await prisma.linkedInPostDraft.findUnique({
          where: { id: draftId },
          select: { facebookPostId: true },
        }))?.facebookPostId ?? undefined,
        twitterError: twitter.error,
      };
    }
  }

  const updated = await prisma.linkedInPostDraft.findUnique({
    where: { id: draftId },
    select: { facebookPostId: true },
  });
  return { ok: true, postId: updated?.facebookPostId ?? undefined };
}

/** Record that the founder pasted this draft into X compose (no API). */
export async function markDraftPostedToTwitterManually(
  draftId: string,
): Promise<{ ok: boolean; error?: string; postId?: string }> {
  const draft = await prisma.linkedInPostDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { ok: false, error: "Draft not found" };
  const existing = parseTwitterPublishNote(draft.reviewerNotes);
  if (existing.twitterPostId) return { ok: true, postId: existing.twitterPostId };

  const at = new Date();
  const postId = `manual-compose:${at.getTime()}`;
  await prisma.linkedInPostDraft.update({
    where: { id: draftId },
    data: {
      reviewerNotes: upsertTwitterPublishNote(draft.reviewerNotes, postId, at),
    },
  });
  return { ok: true, postId };
}

export async function publishDraftToTwitterById(
  draftId: string,
): Promise<{ ok: boolean; error?: string; postId?: string }> {
  const draft = await prisma.linkedInPostDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { ok: false, error: "Draft not found" };
  const existing = parseTwitterPublishNote(draft.reviewerNotes);
  if (existing.twitterPostId) return { ok: true, postId: existing.twitterPostId };

  const body = ensureLandingPageLink(draft.body);
  const text = toTweetText(body, parseHashtags(draft.hashtags));
  const result = await publishTextToTwitter(text);
  if (!result.ok || !result.postId) return { ok: false, error: result.error };

  const at = new Date();
  await prisma.linkedInPostDraft.update({
    where: { id: draftId },
    data: {
      body,
      reviewerNotes: upsertTwitterPublishNote(draft.reviewerNotes, result.postId, at),
    },
  });
  return { ok: true, postId: result.postId };
}
