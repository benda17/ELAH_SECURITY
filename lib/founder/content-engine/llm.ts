import "server-only";
import { applyLinkedInTextUi } from "./format-post";
import { V2_DRAFTS } from "./v2-content";

export const LANDING_PAGE_URL = "https://www.elahsecurity.com";

const LEGACY_LANDING_PAGE_URLS = [
  "https://elah-webpage.vercel.app",
  "http://elah-webpage.vercel.app",
  "https://elahsecurity.com",
  "http://elahsecurity.com",
  "http://www.elahsecurity.com",
];

const SYSTEM_PROMPT = `Based on how AI security companies write LinkedIn posts, write a company-page post for ELAH Security.

ELAH verifies that an AI agent is acting inside a limited permission before a protected website runs the action. It does not read the agent's private reasoning, name the model, or replace the site's own policy. A human checkbox is not that check. One allowed attempt does not authorize a later, wider action. The working build is a local prototype. Do not claim customers, a pilot, or a production deployment. Do not revive banking intention scores, explainable coordinates, or "ELAH scores, never acts."

How to write:
- Write an original post with one argument. The topic is a research angle, not an outline to paraphrase.
- Do not summarize the TDD, the concept page, or any design document. Do not list protocol fields, exercise steps, catalog function names, or walk a spec section by section.
- Lead with a concrete pattern a security leader would recognize: a control that fails, a class of misuse, or a question current tools do not answer. Not a soft opener.
- Ban filler: "As we continue", "In today's landscape", "It's no secret", "At the end of the day", "In this post", "We're excited to".
- Short paragraphs, with a blank line between them. About 140–200 words before the link. No emoji. No hashtag block.
- If you are not confident a citation is real, describe the pattern and do not invent papers, authors, dates, statistics, customers, or incidents.
- Text UI: LinkedIn has no bold button. Wrap only the opening line, one turn, and the closing takeaway in double asterisks. Those lines are published as LinkedIn's bold sans-serif. Leave the middle paragraphs and the URL plain.

Close with the takeaway in double asterisks, a blank line, then exactly:
${LANDING_PAGE_URL}`;

export function buildFallbackDraft(topic: string): string {
  const match = V2_DRAFTS.find((draft) => draft.title === topic);
  if (match) return match.body;
  return `**${topic}.**

Protected sites still meet agents with a human checkbox, a suspicion score, or a session that was authenticated once. None of those say whether this action sits inside a limited permission.

ELAH is the check at that action. A short-lived grant, bound to the agent key, either covers the request or the site gets a refusal. The check does not read private reasoning, and it does not replace the platform's own policy. One allowed attempt is not approval for a wider one. The working build is a local prototype.

**Authorize the action. A login, a logo, or a checkbox will not do it.**

${LANDING_PAGE_URL}`;
}

export function ensureLandingPageLink(text: string): string {
  let trimmed = text.replace(/\s+$/g, "");
  trimmed = trimmed.replace(
    /https?:\/\/(www\.)?elah-webpage\.vercel\.app[^\s)]*/gi,
    LANDING_PAGE_URL,
  );
  for (const legacy of LEGACY_LANDING_PAGE_URLS) {
    trimmed = trimmed.split(legacy).join(LANDING_PAGE_URL);
  }
  if (
    trimmed.includes(LANDING_PAGE_URL) ||
    trimmed.includes("www.elahsecurity.com")
  ) {
    return trimmed;
  }
  return `${trimmed}\n\n${LANDING_PAGE_URL}`;
}

type ChatResult = { text: string; provider: string };

/** Groq retired llama-3.3-70b-versatile (and llama-3.1-8b-instant) on 16 Aug 2026. */
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";

const DEPRECATED_GROQ_MODELS: Record<string, string> = {
  "llama-3.3-70b-versatile": DEFAULT_GROQ_MODEL,
  "llama-3.1-8b-instant": "openai/gpt-oss-20b",
};

export function resolveGroqModel(configured?: string | null): string {
  const raw = configured?.trim() || DEFAULT_GROQ_MODEL;
  return DEPRECATED_GROQ_MODELS[raw] ?? raw;
}

/**
 * Free providers only: Groq → Gemini → template fallback.
 * OpenAI is intentionally not used (avoids paid credit / 429 quota errors).
 */
export async function generatePostBody(
  topic: string,
  context?: string | null,
): Promise<ChatResult> {
  const userContent = `Write one company-page post in the style of an AI security company's LinkedIn post.

Topic: ${topic}
Angle: ${context ?? "A protected site still cannot tell a permitted agent action from a session, a checkbox, or a vendor name."}

The angle is a writing brief. Do not paste it back as a list, and do not turn it into a walkthrough of a design document.
Use the bold-line marks from the system instructions. About 140–200 words. End with the takeaway, a blank line, then ${LANDING_PAGE_URL}.`;

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    const text = await chatCompletions({
      provider: "Groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: resolveGroqModel(process.env.GROQ_MODEL),
      fallbackModel: DEFAULT_GROQ_MODEL,
      system: SYSTEM_PROMPT,
      user: userContent,
    });
    return { text: applyLinkedInTextUi(ensureLandingPageLink(text)), provider: "groq" };
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    const text = await generateWithGemini(geminiKey, SYSTEM_PROMPT, userContent);
    return { text: applyLinkedInTextUi(ensureLandingPageLink(text)), provider: "gemini" };
  }

  // No free key configured — return template (do not call OpenAI).
  return { text: applyLinkedInTextUi(buildFallbackDraft(topic)), provider: "fallback" };
}

export function hasLlmConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim());
}

async function chatCompletions(input: {
  provider: string;
  url: string;
  apiKey: string;
  model: string;
  fallbackModel?: string;
  system: string;
  user: string;
}): Promise<string> {
  const models = [input.model];
  if (input.fallbackModel && input.fallbackModel !== input.model) {
    models.push(input.fallbackModel);
  }

  let lastError = "";
  for (const model of models) {
    const res = await fetch(input.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.45,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      }),
    });

    if (res.ok) {
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error(`${input.provider} returned empty content`);
      return text;
    }

    const detail = await res.text().catch(() => "");
    lastError = `${input.provider} API error (${res.status}): ${detail.slice(0, 200)}`;
    if (res.status !== 404) break;
  }

  throw new Error(lastError || `${input.provider} API error`);
}

async function generateWithGemini(
  apiKey: string,
  system: string,
  user: string,
): Promise<string> {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini API error (${res.status}): ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}
