import "server-only";
import { prisma } from "@/lib/prisma";

const LINKEDIN_AUTH = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_UGC = "https://api.linkedin.com/v2/ugcPosts";
const LINKEDIN_ME = "https://api.linkedin.com/v2/userinfo";

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
function redirectUri() {
  return (
    process.env.LINKEDIN_REDIRECT_URI?.trim() ||
    `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3001"}/api/linkedin/callback`
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
    // Member posting + OpenID profile for person URN discovery.
    scope: "openid profile w_member_social",
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
  // OpenID userinfo often returns `sub` as person id.
  const res = await fetch(LINKEDIN_ME, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { sub?: string };
  if (!json.sub) return null;
  return json.sub.startsWith("urn:") ? json.sub : `urn:li:person:${json.sub}`;
}

export async function saveLinkedInConnection(input: {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}): Promise<void> {
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID?.trim() || null;
  const envAuthor = process.env.LINKEDIN_AUTHOR_URN?.trim() || null;
  const personUrn = envAuthor ?? (await resolvePersonUrn(input.accessToken));
  // Prefer explicit author URN, then person from OAuth, then org page.
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
    publishEnabled: true,
    lastConnectedAt: new Date(),
    configNotes: authorUrn
      ? `Connected; author=${authorUrn}`
      : "Connected; set LINKEDIN_AUTHOR_URN or LINKEDIN_ORGANIZATION_ID",
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
        "LinkedIn not connected. Connect via Content Engine or set LINKEDIN_ACCESS_TOKEN + LINKEDIN_AUTHOR_URN.",
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
