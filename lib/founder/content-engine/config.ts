import "server-only";
import { hasLlmConfigured } from "./llm";
import { linkedInOAuthConfigured } from "./linkedin";

export type EnvVarSpec = {
  key: string;
  required: boolean;
  description: string;
  configured: boolean;
  displayValue?: string;
};

export type ContentEngineConfig = {
  enabled: boolean;
  autoPublish: boolean;
  linkedInReady: boolean;
  llmReady: boolean;
  missingRequired: string[];
  envVars: EnvVarSpec[];
  vercelNotes: string[];
};

const ENV_SPECS: Omit<EnvVarSpec, "configured" | "displayValue">[] = [
  {
    key: "GROQ_API_KEY",
    required: false,
    description: "Free Groq LLM key (preferred) — https://console.groq.com/keys",
  },
  {
    key: "GROQ_MODEL",
    required: false,
    description: "Default llama-3.3-70b-versatile",
  },
  {
    key: "GEMINI_API_KEY",
    required: false,
    description: "Optional free Gemini fallback — Google AI Studio",
  },
  {
    key: "OPENAI_API_KEY",
    required: false,
    description: "Unused — remove from Vercel (OpenAI is disabled; use GROQ_API_KEY)",
  },
  { key: "LINKEDIN_CLIENT_ID", required: false, description: "LinkedIn OAuth app client ID" },
  { key: "LINKEDIN_CLIENT_SECRET", required: false, description: "LinkedIn OAuth secret" },
  {
    key: "LINKEDIN_REDIRECT_URI",
    required: false,
    description:
      "Exact callback URL — must be https://YOUR-DOMAIN/api/linkedin/callback (not the site root)",
  },
  {
    key: "LINKEDIN_OAUTH_SCOPES",
    required: false,
    description: "Default w_member_social (do not add openid unless Sign In product is approved)",
  },
  {
    key: "LINKEDIN_ORGANIZATION_ID",
    required: false,
    description: "Company page org ID (optional if posting as person)",
  },
  {
    key: "LINKEDIN_AUTHOR_URN",
    required: false,
    description:
      "Required for Share-only apps: urn:li:person:XXXX (profile id) or urn:li:organization:XXXX",
  },
  {
    key: "LINKEDIN_ACCESS_TOKEN",
    required: false,
    description: "Optional manual token (or use Connect LinkedIn in UI)",
  },
  { key: "CRON_SECRET", required: true, description: "Protects /api/cron/* routes" },
  { key: "CONTENT_ENGINE_ENABLED", required: false, description: "Set true to enable daily cron" },
  {
    key: "CONTENT_AUTO_PUBLISH",
    required: false,
    description: "Set true only after LinkedIn connect works",
  },
];

function maskValue(key: string, value: string): string {
  if (key.includes("SECRET") || key.includes("KEY") || key.includes("TOKEN") || key === "CRON_SECRET") {
    return value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-4)}` : "••••";
  }
  return value;
}

export function getContentEngineConfig(): ContentEngineConfig {
  const envVars: EnvVarSpec[] = ENV_SPECS.map((spec) => {
    const raw = process.env[spec.key];
    const configured = Boolean(raw && raw.trim().length > 0);
    return {
      ...spec,
      configured,
      displayValue: configured ? maskValue(spec.key, raw!.trim()) : undefined,
    };
  });

  // Prefer Groq; any configured LLM satisfies readiness.
  const llmReady = hasLlmConfigured();
  const missingRequired = [
    ...envVars.filter((v) => v.required && !v.configured).map((v) => v.key),
    ...(!llmReady ? ["GROQ_API_KEY or GEMINI_API_KEY"] : []),
  ];

  // Ready to publish if OAuth app exists (UI connect) or manual token+author are set.
  const manualPublishReady = Boolean(
    process.env.LINKEDIN_ACCESS_TOKEN?.trim() &&
      (process.env.LINKEDIN_AUTHOR_URN?.trim() ||
        process.env.LINKEDIN_ORGANIZATION_ID?.trim()),
  );
  const linkedInReady = linkedInOAuthConfigured() || manualPublishReady;

  return {
    enabled: process.env.CONTENT_ENGINE_ENABLED === "true",
    autoPublish: process.env.CONTENT_AUTO_PUBLISH === "true",
    linkedInReady,
    llmReady,
    missingRequired,
    envVars,
    vercelNotes: [
      "Use GROQ_API_KEY for free draft generation (no OpenAI credits).",
      "Connect LinkedIn from Content Engine, or set LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN.",
      "Add secrets in Vercel → Project → Settings → Environment Variables.",
      "Set CONTENT_AUTO_PUBLISH=true only after a manual Publish succeeds.",
      "Cron schedule in vercel.json uses UTC. 18:00 Israel (IDT) ≈ 15:00 UTC.",
    ],
  };
}

export function assertCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
