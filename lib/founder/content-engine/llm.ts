import "server-only";

const LANDING_PAGE_URL = "https://elah-webpage.vercel.app";

const SYSTEM_PROMPT = `Based on AI security companies' LinkedIn posts, write a LinkedIn company-page post for ELAH Security (banking AI intention scoring / AI security).

Style (match strong AI-security company posts):
- Lead with a concrete real event, incident, regulator action, breach pattern, research finding, or industry case — not soft openers.
- Ban filler openers and transitions such as: "As we continue", "In today's landscape", "It's no secret", "At the end of the day", "In this post", "We're excited to".
- Keep it specific and scannable. Short paragraphs separated by a blank line.
- Length: 140–200 words before the closing link.
- Use at most 1–3 relevant emojis if they help emphasis or scanning (optional; never spam).
- No hashtag blocks in the body (hashtags are added separately).
- Professional company-page voice; no hype.

Evidence (mandatory):
- Name a real organization, regulator, report, or well-known incident when possible.
- If you are not confident a citation is real, describe a clearly general industry pattern — do NOT invent papers, authors, dates, or statistics.
- Tie the case to why intention scoring / explainable controls matter for banking AI assistants.

Close every post with:
1) one short takeaway for security or risk leaders
2) then a blank line
3) then exactly this link on its own line: ${LANDING_PAGE_URL}`;

export function buildFallbackDraft(topic: string): string {
  return `FINRA and other financial regulators have repeatedly warned that AI tools in customer-facing workflows can be steered into policy-bypassing behavior — including social-engineering and prompt-injection patterns that never look like classic malware.

That is the risk ELAH targets: scoring human intention behind banking-assistant actions, with explainable coordinates, so security teams get a calibrated signal before tools move money or change entitlements.

Focus today: ${topic}.

If an agent can act, intention visibility is a control — not a nice-to-have.

${LANDING_PAGE_URL}`;
}

function ensureLandingPageLink(text: string): string {
  const trimmed = text.replace(/\s+$/g, "");
  if (trimmed.includes(LANDING_PAGE_URL)) return trimmed;
  return `${trimmed}\n\n${LANDING_PAGE_URL}`;
}

type ChatResult = { text: string; provider: string };

/**
 * Free providers only: Groq → Gemini → template fallback.
 * OpenAI is intentionally not used (avoids paid credit / 429 quota errors).
 */
export async function generatePostBody(
  topic: string,
  context?: string | null,
): Promise<ChatResult> {
  const userContent = `Based on AI security companies' LinkedIn posts, write one company-page post.

Topic: ${topic}
Context: ${context ?? "ELAH banking MVP — intention scoring for banking AI assistants"}

Requirements:
- Open with a real event / regulator case / documented industry incident (not "As we continue…").
- Blank lines between short paragraphs.
- Light emoji use only if useful (0–3).
- End with a takeaway, then a blank line, then ${LANDING_PAGE_URL}
- Do not invent citations.`;

  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    const text = await chatCompletions({
      provider: "Groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groqKey,
      model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
      system: SYSTEM_PROMPT,
      user: userContent,
    });
    return { text: ensureLandingPageLink(text), provider: "groq" };
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    const text = await generateWithGemini(geminiKey, SYSTEM_PROMPT, userContent);
    return { text: ensureLandingPageLink(text), provider: "gemini" };
  }

  // No free key configured — return template (do not call OpenAI).
  return { text: buildFallbackDraft(topic), provider: "fallback" };
}

export function hasLlmConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim());
}

async function chatCompletions(input: {
  provider: string;
  url: string;
  apiKey: string;
  model: string;
  system: string;
  user: string;
}): Promise<string> {
  const res = await fetch(input.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0.45,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `${input.provider} API error (${res.status}): ${detail.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`${input.provider} returned empty content`);
  return text;
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
