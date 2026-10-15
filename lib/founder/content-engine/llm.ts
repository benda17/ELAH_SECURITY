import "server-only";
import { applyLinkedInTextUi } from "./format-post";

export const LANDING_PAGE_URL = "https://www.elahsecurity.com";

const LEGACY_LANDING_PAGE_URLS = [
  "https://elah-webpage.vercel.app",
  "http://elah-webpage.vercel.app",
  "https://elahsecurity.com",
  "http://elahsecurity.com",
  "http://www.elahsecurity.com",
];

const SYSTEM_PROMPT = `Write a LinkedIn company-page post for ELAH Security about ELAH V2 / APACT, an agentic AI CAPTCHA.

Product facts you must stay inside:
- A website installs an entrance. The agent declares a bounded task in eight fields, proves a session key, and completes three inert exercises (normal page, pressure page, relabeled page).
- If recorded actions stay inside the declaration, the decision is allow_limited and ELAH issues a short-lived token bound to that key (DPoP). Otherwise it returns a reason and no token.
- First profile: guest travel. flight.search and traveler.draft.update on guest/current are allowed. payment.create, contract.submit, and data.export are blocked unless a separate approval exists. That approval flow is not built.
- The human checkbox ("I'm not a robot") sets a site cookie, never calls ELAH, and is logged as unverified. It is explicitly not a check.
- Exercises are mock. Payment is recorded and refused. Nothing is a production deployment.
- A pass shows key possession and behavior on that attempt. It does not identify the model, prove the hidden user prompt, or promise later behavior.

Do not write about banking intention scoring, explainable intention coordinates, CS/CRM intent scores, or "ELAH scores, never acts." ELAH V1 is archived.

Style — this is the post's text UI. LinkedIn has no bold button. Wrap the lines that should hit in double asterisks. Those lines are published as LinkedIn's bold sans-serif. Do not invent another emphasis mark.

Shape, exactly:
**Opening line.**

Short plain line.
Short plain line.
**The turn.**

**Closing line.**
**Closing line.**

${LANDING_PAGE_URL}

- One idea per line. No dense paragraphs. No emoji.
- Bold only the opening, the turn, and the close. Leave the URL and the middle lines plain.
- Lead with the mechanism or a concrete exercise detail, not a soft opener.
- Ban filler: "As we continue", "In today's landscape", "It's no secret", "At the end of the day", "In this post", "We're excited to".
- No hashtag block in the body.
- Do not invent customers, pilots, papers, statistics, or a deployed service.
- If you are not confident a citation is real, leave it out.`;

export function buildFallbackDraft(topic: string): string {
  return `**${topic}.**

A website can put an entrance in front of an agent.
The agent declares a bounded task and proves a session key.
It works three inert exercises: the normal page, a pressure page, and a relabeled page.
**Stay inside the declaration, and the entrance can return allow_limited.**

A short-lived token, bound to that key.
Step outside, and it returns a reason.
**No token.**

The first profile is guest travel.
Search and a guest draft are in bounds.
Payment, contract submission, and data export stay blocked.
That approval flow is not built.
The "I'm not a robot" path sets a cookie, skips ELAH, and is logged as unverified.

**This slice runs locally.**
**A pass records the attempt. It does not name the model, the hidden prompt, or the next action.**

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
  const userContent = `Write one company-page post about ELAH V2, the agentic AI CAPTCHA (APACT).

Topic: ${topic}
Context: ${context ?? "ELAH V2 APACT — guest travel entrance. Search and guest draft only. Payment, contract submission, and data export need an approval flow that is not built."}

Requirements:
- Use the bold-line text UI from the system instructions. One idea per line.
- Wrap only the opening, the turn, and the close in double asterisks.
- No emoji.
- End with the closing bold lines, a blank line, then ${LANDING_PAGE_URL}
- Do not invent citations, customers, or a production deployment.
- Do not claim a passing exercise proves the user prompt or the model identity.
- Do not write a banking intention-scoring post.`;

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
