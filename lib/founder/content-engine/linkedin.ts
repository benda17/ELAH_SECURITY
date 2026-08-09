import "server-only";
import { prisma } from "@/lib/prisma";

const LINKEDIN_AUTH = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_UGC = "https://api.linkedin.com/v2/ugcPosts";
const LINKEDIN_ME_OPENID = "https://api.linkedin.com/v2/userinfo";
const LINKEDIN_ME_V2 = "https://api.linkedin.com/v2/me";

export type LinkedInPublishResult = {
  ok: boolean;
  postId?: string;
  error?: string;
};

function clientId() {
  return process.env.LINKEDIN_CLIENT_ID?.trim() ?? "";
}
function clientSecret() {
  return process.env.LINKEDIN_CLIENT_SECRET?.trim() ?? "";
}

/**
 * Must exactly match an Authorized redirect URL in the LinkedIn app.
 * If env is set to the site root by mistake, append /api/linkedin/callback.
 */
export function redirectUri(): string {
  const raw = process.env.LINKEDIN_REDIRECT_URI?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.pathname === "/" || u.pathname === "") {
        return `${u.origin}/api/linkedin/callback`;
      }
      return `${u.origin}${u.pathname}`.replace(/\/$/, "");
    } catch {
      return raw.replace(/\/$/, "");
    }
  }
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (host) {
    const origin = host.startsWith("http") ? host : `https://${host}`;
    return `${origin.replace(/\/$/, "")}/api/linkedin/callback`;
  }
  return "http://localhost:3001/api/linkedin/callback";
}

/** Default: Share on LinkedIn only. Add openid/profile only if that product is approved. */
function oauthScopes(): string {
  return (
    process.env.LINKEDIN_OAUTH_SCOPES?.trim() ||
    "w_member_social"
  );
}

export function linkedInOAuthConfigured(): boolean {
  return Boolean(clientId() && clientSecret());
}

export function buildLinkedInAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    redirect_uri: redirectUri(),
    state,
    scope: oauthScopes(),
  });
  return `${LINKEDIN_AUTH}?${params.toString()}`;
}

export async function exchangeLinkedInCode(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    client_id: clientId(),
    client_secret: clientSecret(),
  });

  const res = await fetch(LINKEDIN_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LinkedIn token exchange failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };
  if (!json.access_token) throw new Error("LinkedIn token response missing access_token");
  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in ?? 3600,
    refreshToken: json.refresh_token,
  };
}

async function resolvePersonUrn(accessToken: string): Promise<string | null> {
  // 1) OpenID userinfo (only if openid scope was granted)
  try {
    const res = await fetch(LINKEDIN_ME_OPENID, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const json = (await res.json()) as { sub?: string };
      if (json.sub) {
        return json.sub.startsWith("urn:") ? json.sub : `urn:li:person:${json.sub}`;
      }
    }
  } catch {
    /* ignore */
  }

  // 2) Classic /v2/me (needs profile scopes — often unavailable with Share-only apps)
  try {
    const res = await fetch(LINKEDIN_ME_V2, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const json = (await res.json()) as { id?: string };
      if (json.id) return `urn:li:person:${json.id}`;
    }
  } catch {
    /* ignore */
  }

  return null;
}

export async function saveLinkedInConnection(input: {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}): Promise<void> {
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID?.trim() || null;
  const envAuthor = process.env.LINKEDIN_AUTHOR_URN?.trim() || null;
  const personUrn = await resolvePersonUrn(input.accessToken);
  const authorUrn =
    envAuthor ||
    personUrn ||
    (orgId ? `urn:li:organization:${orgId}` : null);

  const existing = await prisma.linkedInIntegration.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  const data = {
    organizationId: orgId,
    authorUrn,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken ?? null,
    tokenExpiresAt: new Date(Date.now() + input.expiresIn * 1000),
    accessTokenSet: true,
    publishEnabled: Boolean(authorUrn),
    lastConnectedAt: new Date(),
    configNotes: authorUrn
      ? `Connected; author=${authorUrn}`
      : "Token saved, but author URN missing. Set LINKEDIN_AUTHOR_URN=urn:li:person:XXXX in Vercel.",
  };

  if (existing) {
    await prisma.linkedInIntegration.update({ where: { id: existing.id }, data });
  } else {
    await prisma.linkedInIntegration.create({ data });
  }
}

export async function getPublishCredentials(): Promise<{
  accessToken: string;
  authorUrn: string;
} | null> {
  const envToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const envAuthor =
    process.env.LINKEDIN_AUTHOR_URN?.trim() ||
    (process.env.LINKEDIN_ORGANIZATION_ID?.trim()
      ? `urn:li:organization:${process.env.LINKEDIN_ORGANIZATION_ID.trim()}`
      : null);

  if (envToken && envAuthor) {
    return { accessToken: envToken, authorUrn: envAuthor };
  }

  const row = await prisma.linkedInIntegration.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (row?.accessToken && row.authorUrn && row.publishEnabled) {
    return { accessToken: row.accessToken, authorUrn: row.authorUrn };
  }
  // Token connected but author only in env
  if (row?.accessToken && envAuthor) {
    return { accessToken: row.accessToken, authorUrn: envAuthor };
  }
  return null;
}

export async function publishTextToLinkedIn(
  text: string,
): Promise<LinkedInPublishResult> {
  const creds = await getPublishCredentials();
  if (!creds) {
    return {
      ok: false,
      error:
        "LinkedIn not ready. Connect LinkedIn, and set LINKEDIN_AUTHOR_URN (urn:li:person:…) if profile scope is unavailable.",
    };
  }

  const res = await fetch(LINKEDIN_UGC, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: creds.authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return {
      ok: false,
      error: `LinkedIn publish failed (${res.status}): ${detail.slice(0, 400)}`,
    };
  }

  const postId = res.headers.get("x-restli-id") ?? undefined;
  return { ok: true, postId: postId ?? undefined };
}

export function isLinkedInPublishReadySync(): boolean {
  const envToken = Boolean(process.env.LINKEDIN_ACCESS_TOKEN?.trim());
  const envAuthor = Boolean(
    process.env.LINKEDIN_AUTHOR_URN?.trim() ||
      process.env.LINKEDIN_ORGANIZATION_ID?.trim(),
  );
  return (envToken && envAuthor) || linkedInOAuthConfigured();
}
