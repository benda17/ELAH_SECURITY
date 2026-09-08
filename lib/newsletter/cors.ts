const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "https://www.elahsecurity.com",
  "https://elahsecurity.com",
];

function extraOrigins(): string[] {
  return (process.env.NEWSLETTER_CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function allowedNewsletterOrigin(origin: string | null): string | null {
  if (!origin) return null;
  const allowed = new Set([...DEFAULT_ORIGINS, ...extraOrigins()]);
  return allowed.has(origin) ? origin : null;
}

export function newsletterCorsHeaders(origin: string | null): HeadersInit {
  const allowed = allowedNewsletterOrigin(origin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (allowed) {
    headers["Access-Control-Allow-Origin"] = allowed;
  }
  return headers;
}
