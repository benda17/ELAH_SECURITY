import "server-only";
import { prisma } from "@/lib/prisma";
import { getContentEngineConfig } from "./config";
import { facebookAutoPublishEnabled, publishTextToFacebook } from "./facebook";
import { generatePostBody } from "./llm";
import { publishTextToLinkedIn } from "./linkedin";

function parseHashtags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

const DEFAULT_TOPICS = [
  {
    title: "AI security in banking assistants",
    summary:
      "Research angle: prompt injection / social engineering against financial chatbots; OWASP LLM Top 10; bank AI assistant misuse cases; need for intention signals before tool execution.",
  },
  {
    title: "Human intention scoring for financial agents",
    summary:
      "Research angle: agentic AI in finance, unauthorized transfers or policy bypass via multi-step tool use; NIST AI RMF / financial-sector AI risk papers; why calibrated intention scores help SOC/risk teams.",
  },
  {
    title: "Explainable AI for fraud and policy bypass detection",
    summary:
      "Research angle: explainability requirements in financial AI (model risk management, SR 11-7 style oversight); fraud cases where opaque models failed review; ELAH explainable coordinates vs black-box alerts.",
  },
  {
    title: "Prompt injection as a banking control failure",
    summary:
      "Research angle: indirect prompt injection via tickets, documents, and emails into bank assistants; real SOC patterns; mapping intention before tool calls.",
  },
  {
    title: "Agentic payments need a human-intention gate",
    summary:
      "Research angle: multi-step agent tool use for transfers and entitlements; when autonomy outruns policy; calibrated 0–1 intention scores for risk teams.",
  },
  {
    title: "From black-box alerts to explainable intention coordinates",
    summary:
      "Research angle: model risk management expectations for AI in finance; why security leaders need readable coordinates, not opaque deny/allow.",
  },
  {
    title: "Social engineering the assistant, not the customer",
    summary:
      "Research angle: attackers targeting the AI layer in digital banking; social-engineering patterns against copilots; ELAH as intention telemetry for defenders.",
  },
  {
    title: "Policy bypass without malware: LLM tool misuse",
    summary:
      "Research angle: assistants that can change limits, open products, or move funds; misuse without classic malware; intention scoring as a control plane signal.",
  },
  {
    title: "Building trust in AI banking with measurable human intent",
    summary:
      "Research angle: board and regulator pressure for AI accountability; measurable intention signals as evidence for audits and incident review.",
  },
];

function pickTopic(indexHint?: number) {
  const i =
    typeof indexHint === "number"
      ? Math.abs(indexHint) % DEFAULT_TOPICS.length
      : Math.floor(Date.now() / 1000) % DEFAULT_TOPICS.length;
  return DEFAULT_TOPICS[i]!;
}

export async function scanSourceEvents(): Promise<number> {
  const existing = await prisma.contentSourceEvent.count();
  if (existing > 0) return 0;

  const seeds = DEFAULT_TOPICS.map((topic, i) => ({
    sourceType: "research",
    title: topic.title,
    summary: topic.summary,
    url: null as string | null,
    metadata: JSON.stringify({ seed: true, index: i }),
  }));

  await prisma.contentSourceEvent.createMany({ data: seeds });
  return seeds.length;
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
      where: { processed: false },
      orderBy: { capturedAt: "desc" },
    });

    const draftCount = await prisma.linkedInPostDraft.count();
    const fallback = pickTopic(draftCount);
    const topic = source?.title ?? fallback.title;
    const researchContext = source?.summary ?? fallback.summary;
    const { text: body, provider } = await generatePostBody(topic, researchContext);

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
    const tags = parseHashtags(draft.hashtags);

    if (config.autoPublish) {
      const result = await publishTextToLinkedIn(body);
      if (result.ok) {
        await prisma.linkedInPostDraft.update({
          where: { id: draft.id },
          data: {
            status: "published",
            publishedAt: new Date(),
            ...(result.postId ? { externalPostId: result.postId } : {}),
          },
        });
        published = true;
        logLines.push(`LinkedIn auto-published${result.postId ? ` (${result.postId})` : ""}`);
      } else {
        logLines.push(`LinkedIn auto-publish skipped/failed: ${result.error}`);
      }
    }

    if (await facebookAutoPublishEnabled()) {
      const fb = await publishTextToFacebook(body, tags);
      if (fb.ok) {
        await prisma.linkedInPostDraft.update({
          where: { id: draft.id },
          data: {
            facebookPostId: fb.postId ?? null,
            facebookPublishedAt: new Date(),
            // If LinkedIn wasn't auto-published, still mark draft published once FB succeeds.
            ...(!published
              ? { status: "published", publishedAt: new Date() }
              : {}),
          },
        });
        published = true;
        logLines.push(`Facebook auto-published${fb.postId ? ` (${fb.postId})` : ""}`);
      } else {
        logLines.push(`Facebook auto-publish failed: ${fb.error}`);
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
    data: {
      status: "published",
      publishedAt: new Date(),
      ...(result.postId ? { externalPostId: result.postId } : {}),
    },
  });
  return { ok: true };
}

/** Mark a draft published after posting manually as the Elah company page in LinkedIn UI. */
export async function markDraftPublishedManually(
  draftId: string,
): Promise<{ ok: boolean; error?: string }> {
  const draft = await prisma.linkedInPostDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { ok: false, error: "Draft not found" };
  if (draft.status === "published") return { ok: true };

  await prisma.linkedInPostDraft.update({
    where: { id: draftId },
    data: {
      status: "published",
      publishedAt: new Date(),
      externalPostId: `manual-company:${Date.now()}`,
      reviewerNotes: "Posted manually as Elah Security company page via LinkedIn admin UI",
    },
  });
  return { ok: true };
}

export async function publishDraftToFacebookById(
  draftId: string,
): Promise<{ ok: boolean; error?: string; postId?: string }> {
  const draft = await prisma.linkedInPostDraft.findUnique({ where: { id: draftId } });
  if (!draft) return { ok: false, error: "Draft not found" };
  if (draft.facebookPostId) return { ok: true, postId: draft.facebookPostId };

  const result = await publishTextToFacebook(draft.body, parseHashtags(draft.hashtags));
  if (!result.ok) return { ok: false, error: result.error };

  await prisma.linkedInPostDraft.update({
    where: { id: draftId },
    data: {
      facebookPostId: result.postId ?? null,
      facebookPublishedAt: new Date(),
      ...(draft.status !== "published"
        ? { status: "published", publishedAt: new Date() }
        : {}),
    },
  });
  return { ok: true, postId: result.postId };
}
