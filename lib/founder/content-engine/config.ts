import "server-only";

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
  missingRequired: string[];
  envVars: EnvVarSpec[];
  vercelNotes: string[];
};

const ENV_SPECS: Omit<EnvVarSpec, "configured" | "displayValue">[] = [
  { key: "OPENAI_API_KEY", required: true, description: "Powers draft generation" },
  { key: "CONTENT_SEARCH_PROVIDER", required: false, description: "e.g. tavily, serpapi" },
  { key: "CONTENT_SEARCH_API_KEY", required: false, description: "API key for search provider" },
  { key: "LINKEDIN_CLIENT_ID", required: false, description: "LinkedIn OAuth app client ID" },
  { key: "LINKEDIN_CLIENT_SECRET", required: false, description: "LinkedIn OAuth secret" },
  { key: "LINKEDIN_REDIRECT_URI", required: false, description: "OAuth redirect URI" },
  { key: "LINKEDIN_ORGANIZATION_ID", required: false, description: "Company page to publish to" },
  { key: "CRON_SECRET", required: true, description: "Protects /api/cron/* routes" },
  { key: "CONTENT_ENGINE_ENABLED", required: false, description: "Set true to enable engine" },
  { key: "CONTENT_AUTO_PUBLISH", required: false, description: "Keep false until LinkedIn is configured" },
];

function maskValue(key: string, value: string): string {
  if (key.includes("SECRET") || key.includes("KEY") || key === "CRON_SECRET") {
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

  const missingRequired = envVars.filter((v) => v.required && !v.configured).map((v) => v.key);
  const linkedInReady =
    envVars.find((v) => v.key === "LINKEDIN_CLIENT_ID")?.configured === true &&
    envVars.find((v) => v.key === "LINKEDIN_CLIENT_SECRET")?.configured === true &&
    envVars.find((v) => v.key === "LINKEDIN_ORGANIZATION_ID")?.configured === true;

  return {
    enabled: process.env.CONTENT_ENGINE_ENABLED === "true",
    autoPublish: process.env.CONTENT_AUTO_PUBLISH === "true",
    linkedInReady,
    missingRequired,
    envVars,
    vercelNotes: [
      "Add all secrets in Vercel → Project → Settings → Environment Variables.",
      "Never paste production secrets into the browser UI — use Vercel env vars only.",
      "Set CONTENT_AUTO_PUBLISH=false until LinkedIn OAuth is verified.",
      "Cron schedule in vercel.json uses UTC. 18:00 Israel (IDT) ≈ 15:00 UTC — verify when DST changes.",
    ],
  };
}

export function assertCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
