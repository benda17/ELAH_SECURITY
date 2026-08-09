import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * TEMP local/prod smoke-test defaults (override via env when ready).
 * Replace TEMP_CLIENT_SECRET with your LinkedIn app secret, then remove this block later.
 */
const TEMP_LINKEDIN = {
  clientId: "778lw9eiiqc965",
  // Paste your LinkedIn "Primary Client Secret" here for the local connect test:
  clientSecret: "REPLACE_WITH_LINKEDIN_CLIENT_SECRET",
  // Production callback on your Founder Vercel host:
  productionRedirectUri: "https://elah-webpage.vercel.app/api/linkedin/callback",
  localRedirectUri: "http://localhost:3001/api/linkedin/callback",
  scopes: "w_member_social",
};

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
  return process.env.LINKEDIN_CLIENT_ID?.trim() || TEMP_LINKEDIN.clientId;
}
function clientSecret() {
  const fromEnv = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (TEMP_LINKEDIN.clientSecret !== "REPLACE_WITH_LINKEDIN_CLIENT_SECRET") {
    return TEMP_LINKEDIN.clientSecret;
  }
  return "";
}

function isLocalDev() {
  return process.env.NODE_ENV !== "production" || process.env.LINKEDIN_USE_LOCAL_REDIRECT === "true";
}

/**
 * Must exactly match an Authorized redirect URL in the LinkedIn app.
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
  if (isLocalDev()) return TEMP_LINKEDIN.localRedirectUri;
  return TEMP_LINKEDIN.productionRedirectUri;
}

function oauthScopes(): string {
  return process.env.LINKEDIN_OAUTH_SCOPES?.trim() || TEMP_LINKEDIN.scopes;
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
      : "Token saved, but author URN missing. Set LINKEDIN_AUTHOR_URN=urn:li:person:XXXX.",
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
        "LinkedIn not ready. Connect LinkedIn, and set LINKEDIN_AUTHOR_URN (urn:li:person:…) if needed.",
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
  return linkedInOAuthConfigured();
}

/** Debug helper for Connect button / settings. */
export function getLinkedInOAuthDebug() {
  return {
    clientIdSet: Boolean(clientId()),
    clientSecretSet: Boolean(clientSecret()),
    redirectUri: redirectUri(),
    scopes: oauthScopes(),
    secretIsPlaceholder:
      !process.env.LINKEDIN_CLIENT_SECRET?.trim() &&
      TEMP_LINKEDIN.clientSecret === "REPLACE_WITH_LINKEDIN_CLIENT_SECRET",
  };
}
