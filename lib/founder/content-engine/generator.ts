import "server-only";
import { prisma } from "@/lib/prisma";
import { getContentEngineConfig } from "./config";

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
): Promise<{ runId: string; draftId: string | null; error?: string }> {
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
    let body: string;

    if (process.env.OPENAI_API_KEY) {
      body = await generateWithOpenAI(topic, source?.summary);
    } else {
      body = buildFallbackDraft(topic);
    }

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

    await prisma.contentEngineRun.update({
      where: { id: run.id },
      data: {
        status: "success",
        completedAt: new Date(),
        draftCount: 1,
        log: JSON.stringify(["Draft generated", draft.id]),
      },
    });

    return { runId: run.id, draftId: draft.id };
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

async function generateWithOpenAI(topic: string, context?: string | null): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You write concise LinkedIn posts for ELAH, an AI security company focused on banking assistant intention scoring. Professional, founder voice, no hype. 120-180 words.",
        },
        {
          role: "user",
          content: `Topic: ${topic}\nContext: ${context ?? "ELAH banking MVP"}\nWrite one LinkedIn post.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content?.trim() ?? buildFallbackDraft(topic);
}

function buildFallbackDraft(topic: string): string {
  return `We're building ELAH to score human intention in banking AI assistants — not to replace bank policy, but to give security teams a calibrated 0–1 intention signal with explainable coordinates.

Today's focus: ${topic}.

If you're exploring agentic banking or AI security pilots, I'd welcome a conversation.`;
}
