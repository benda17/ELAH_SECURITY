import "server-only";

const SYSTEM_PROMPT = `You write LinkedIn company-page posts for ELAH Security (banking AI intention scoring / AI security).

Voice: professional founder/company page, no hype, no emojis.
Length: 140–200 words.
Format: short paragraphs separated by a blank line. No hashtags in the body.

Evidence requirement (mandatory):
- Ground the post in at least one concrete real-world case, incident, study, regulator action, or industry research finding relevant to the topic (e.g. banking AI misuse, fraud, agentic systems, explainability, policy bypass).
- Name the source plainly (organization, report, regulator, or well-known incident) and state what happened / what was measured.
- Prefer established public cases and research over vague claims. If you are not confident a specific citation is real, use a clearly general industry pattern and do NOT invent paper titles, authors, dates, or statistics.
- Connect the case to why intention scoring / explainable controls matter for bank AI assistants.
- End with a short, concrete takeaway for security or risk leaders.`;

export function buildFallbackDraft(topic: string): string {
  return `In 2023–2024, multiple banks and regulators flagged risks when customer-facing AI assistants were socially engineered into policy-bypassing actions — including social-engineering and prompt-injection patterns documented in industry AI security research and FINRA/FTC guidance on AI in financial services.

That is the problem ELAH focuses on: scoring human intention behind banking-assistant actions, with explainable coordinates, so security teams see a calibrated signal rather than a black-box yes/no.

Today's focus: ${topic}.

If AI agents can move money or change entitlements, intention visibility is not optional — it is control design.`;
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
  const userContent = `Topic: ${topic}
Context: ${context ?? "ELAH banking MVP — intention scoring for banking AI assistants"}

Write one LinkedIn company-page post with blank lines between paragraphs.
Include a real research finding, regulator case, or documented industry incident, then tie it to ELAH's intention-scoring approach.
Do not invent citations.`;

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
    return { text, provider: "groq" };
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    const text = await generateWithGemini(geminiKey, SYSTEM_PROMPT, userContent);
    return { text, provider: "gemini" };
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
