import "server-only";

const SYSTEM_PROMPT =
  "You write concise LinkedIn posts for ELAH, an AI security company focused on banking assistant intention scoring. Professional, founder voice, no hype. 120-180 words. No hashtags in the body.";

export function buildFallbackDraft(topic: string): string {
  return `We're building ELAH to score human intention in banking AI assistants — not to replace bank policy, but to give security teams a calibrated 0–1 intention signal with explainable coordinates.

Today's focus: ${topic}.

If you're exploring agentic banking or AI security pilots, I'd welcome a conversation.`;
}

type ChatResult = { text: string; provider: string };

/**
 * Prefer free providers: Groq → Gemini → OpenAI (optional paid) → template fallback.
 */
export async function generatePostBody(
  topic: string,
  context?: string | null,
): Promise<ChatResult> {
  const userContent = `Topic: ${topic}\nContext: ${context ?? "ELAH banking MVP"}\nWrite one LinkedIn post.`;

  if (process.env.GROQ_API_KEY?.trim()) {
    const text = await chatCompletions({
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY.trim(),
      model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
      system: SYSTEM_PROMPT,
      user: userContent,
    });
    return { text, provider: "groq" };
  }

  if (process.env.GEMINI_API_KEY?.trim()) {
    const text = await generateWithGemini(
      process.env.GEMINI_API_KEY.trim(),
      SYSTEM_PROMPT,
      userContent,
    );
    return { text, provider: "gemini" };
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    const text = await chatCompletions({
      url: "https://api.openai.com/v1/chat/completions",
      apiKey: process.env.OPENAI_API_KEY.trim(),
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      system: SYSTEM_PROMPT,
      user: userContent,
    });
    return { text, provider: "openai" };
  }

  return { text: buildFallbackDraft(topic), provider: "fallback" };
}

export function hasLlmConfigured(): boolean {
  return Boolean(
    process.env.GROQ_API_KEY?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim(),
  );
}

async function chatCompletions(input: {
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
      temperature: 0.7,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM API error (${res.status}): ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("LLM returned empty content");
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
