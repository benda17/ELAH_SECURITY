import "server-only";
import { facebookAutoPublishEnabled, facebookPublishConfigured } from "./facebook";
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
  facebookAutoPublish: boolean;
  facebookReady: boolean;
  linkedInReady: boolean;
  twitterReady: boolean;
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
    description: "Optional; retired Llama 3.3 IDs remap to openai/gpt-oss-120b",
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
    description:
      "Prefer: openid profile w_member_social w_organization_social r_organization_social",
  },
  {
    key: "LINKEDIN_ORGANIZATION_ID",
    required: false,
    description: "Elah Security company numeric id — posts as urn:li:organization:ID",
  },
  {
    key: "LINKEDIN_AUTHOR_URN",
    required: false,
    description: "Prefer urn:li:organization:XXXX for the Elah Security company page",
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
    description: "Ignored on generate — drafts stay for review; publish from the panel",
  },
  {
    key: "FACEBOOK_APP_ID",
    required: false,
    description: "Meta App ID — Developers → App → Settings → Basic",
  },
  {
    key: "FACEBOOK_APP_SECRET",
    required: false,
    description: "Meta App Secret — used for OAuth + long-lived Page tokens",
  },
  {
    key: "FACEBOOK_REDIRECT_URI",
    required: false,
    description:
      "Must be https://YOUR-DOMAIN/api/facebook/callback (add same URL in Meta → Facebook Login → Valid OAuth Redirect URIs)",
  },
  {
    key: "FACEBOOK_PAGE_ID",
    required: false,
    description: "Optional override Page ID (otherwise chosen after Connect Facebook)",
  },
  {
    key: "FACEBOOK_PAGE_ACCESS_TOKEN",
    required: false,
    description: "Optional manual Page token (or use Connect Facebook in UI)",
  },
  {
    key: "FACEBOOK_AUTO_PUBLISH",
    required: false,
    description: "Legacy flag; generate no longer auto-posts — use Publish on each draft",
  },
  {
    key: "X_API_KEY",
    required: false,
    description:
      "Unused for posting. X uses copy-and-paste compose. Optional leftover if you later enable the paid API.",
  },
  {
    key: "X_API_SECRET",
    required: false,
    description: "X/Twitter API Key Secret (Consumer Secret) — same Keys and tokens page",
  },
  {
    key: "X_ACCESS_TOKEN",
    required: false,
    description:
      "X user Access Token — generate with Read and Write after User authentication is set to Read and write",
  },
  {
    key: "X_ACCESS_TOKEN_SECRET",
    required: false,
    description: "X user Access Token Secret — pair of the Access Token above",
  },
  {
    key: "RESEND_API_KEY",
    required: false,
    description:
      "Turns on newsletter sending. Create a free key at resend.com/api-keys, then add it here or in Vercel.",
  },
  {
    key: "RESEND_FROM",
    required: false,
    description: "From line on the email, e.g. ELAH <elahsecurity@gmail.com>",
  },
];

function maskValue(key: string, value: string): string {
  if (key.includes("SECRET") || key.includes("KEY") || key.includes("TOKEN") || key === "CRON_SECRET") {
    return value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-4)}` : "••••";
  }
  return value;
}

export async function getContentEngineConfig(): Promise<ContentEngineConfig> {
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
  const [facebookReady, facebookAutoPublish] = await Promise.all([
    facebookPublishConfigured(),
    facebookAutoPublishEnabled(),
  ]);

  return {
    enabled: process.env.CONTENT_ENGINE_ENABLED === "true",
    autoPublish: process.env.CONTENT_AUTO_PUBLISH === "true",
    facebookAutoPublish,
    facebookReady,
    linkedInReady,
    twitterReady: true,
    llmReady,
    missingRequired,
    envVars,
    vercelNotes: [
      "Use GROQ_API_KEY for free draft generation (no OpenAI credits).",
      "Connect LinkedIn from Content Engine, or set LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN.",
      "Facebook: Connect once; publish drafts to ELAH Security from the panel.",
      "X/Twitter: copy-and-paste from Content Engine (Post to X). No paid posting API.",
      "Weekly Newsletter: set RESEND_API_KEY so Publish can deliver to subscribers.",
      "Content cron runs 3× daily (06:00, 12:00, 18:00 UTC).",
      "Add secrets in Vercel → Project → Settings → Environment Variables.",
      "Cron schedule in vercel.json uses UTC.",
    ],
  };
}

export function assertCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
