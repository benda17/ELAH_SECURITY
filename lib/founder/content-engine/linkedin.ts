import "server-only";
import { prisma } from "@/lib/prisma";
import {
  companyPageAdminPostsUrl,
  formatLinkedInCommentary,
} from "@/lib/founder/content-engine/format-post";

export { formatLinkedInCommentary, companyPageAdminPostsUrl };

/**
 * TEMP local/prod smoke-test defaults (override via env when ready).
 */
const TEMP_LINKEDIN = {
  clientId: "778lw9eiiqc965",
  clientSecret: "REPLACE_WITH_LINKEDIN_CLIENT_SECRET",
  productionRedirectUri: "https://elah-webpage.vercel.app/api/linkedin/callback",
  localRedirectUri: "http://localhost:3001/api/linkedin/callback",
  // Company-page posting requires w_organization_social (+ OpenID for member identity).
  scopes: "openid profile w_member_social w_organization_social r_organization_social",
  // Elah Security company page
  organizationId: process.env.LINKEDIN_ORGANIZATION_ID?.trim() || "110857192",
};

const LINKEDIN_AUTH = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_UGC = "https://api.linkedin.com/v2/ugcPosts";
const LINKEDIN_POSTS = "https://api.linkedin.com/rest/posts";
const LINKEDIN_ME_OPENID = "https://api.linkedin.com/v2/userinfo";
const LINKEDIN_ME_V2 = "https://api.linkedin.com/v2/me";
const LINKEDIN_ORG_ACLS =
  "https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED";

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

function configuredOrganizationUrn(): string | null {
  const fromAuthor = process.env.LINKEDIN_AUTHOR_URN?.trim();
  if (fromAuthor?.startsWith("urn:li:organization:")) return fromAuthor;
  const orgId =
    process.env.LINKEDIN_ORGANIZATION_ID?.trim() || TEMP_LINKEDIN.organizationId || "";
  if (!orgId) return null;
  return orgId.startsWith("urn:") ? orgId : `urn:li:organization:${orgId}`;
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
  scope?: string;
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
    scope?: string;
  };
  if (!json.access_token) throw new Error("LinkedIn token response missing access_token");
  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in ?? 3600,
    refreshToken: json.refresh_token,
    scope: json.scope,
  };
}

export async function introspectLinkedInToken(accessToken: string): Promise<{
  active: boolean;
  scope: string;
}> {
  try {
    const body = new URLSearchParams({
      token: accessToken,
      client_id: clientId(),
      client_secret: clientSecret(),
    });
    const res = await fetch("https://www.linkedin.com/oauth/v2/introspectToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return { active: false, scope: "" };
    const json = (await res.json()) as { active?: boolean; scope?: string };
    return {
      active: Boolean(json.active),
      scope: (json.scope ?? "").replace(/\s+/g, ","),
    };
  } catch {
    return { active: false, scope: "" };
  }
}

function scopeIncludesOrgPosting(scope: string): boolean {
  const parts = scope
    .toLowerCase()
    .split(/[,\s]+/)
    .filter(Boolean);
  return parts.includes("w_organization_social") || parts.includes("w_organization_social_feed");
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

/** Prefer Elah Security / Elah org pages the member administers. */
async function resolveOrganizationUrn(accessToken: string): Promise<string | null> {
  const configured = configuredOrganizationUrn();
  if (configured) return configured;

  try {
    const res = await fetch(LINKEDIN_ORG_ACLS, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      elements?: Array<{ organizationalTarget?: string }>;
    };
    const orgs = (json.elements ?? [])
      .map((e) => e.organizationalTarget)
      .filter((u): u is string => Boolean(u?.startsWith("urn:li:organization:")));

    if (orgs.length === 0) return null;

    // Prefer names matching Elah when we can fetch details; otherwise first admin org.
    for (const urn of orgs) {
      const id = urn.split(":").pop();
      if (!id) continue;
      try {
        const orgRes = await fetch(`https://api.linkedin.com/v2/organizations/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        });
        if (!orgRes.ok) continue;
        const org = (await orgRes.json()) as { localizedName?: string; vanityName?: string };
        const label = `${org.localizedName ?? ""} ${org.vanityName ?? ""}`.toLowerCase();
        if (label.includes("elah")) return urn;
      } catch {
        /* keep scanning */
      }
    }
    return orgs[0] ?? null;
  } catch {
    return null;
  }
}

/** Escape reserved Little Text characters for LinkedIn Posts API commentary. */
function escapeLinkedInCommentary(text: string): string {
  return text.replace(/([|{}@[\]()<>#*_~\\])/g, "\\$1");
}

export function getElahCompanyAdminPostsUrl(): string {
  const urn = configuredOrganizationUrn() || `urn:li:organization:${TEMP_LINKEDIN.organizationId}`;
  const id = urn.replace(/^urn:li:organization:/, "") || TEMP_LINKEDIN.organizationId;
  return companyPageAdminPostsUrl(id);
}

export async function saveLinkedInConnection(input: {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  scope?: string;
}): Promise<void> {
  const introspected = await introspectLinkedInToken(input.accessToken);
  const scope = (input.scope || introspected.scope || "").trim();
  const hasOrgPostScope = scopeIncludesOrgPosting(scope);

  // Prefer company page (organization) over personal profile.
  const organizationUrn = await resolveOrganizationUrn(input.accessToken);
  const envAuthor = process.env.LINKEDIN_AUTHOR_URN?.trim() || null;
  const configuredOrg = configuredOrganizationUrn();
  const personUrn = await resolvePersonUrn(input.accessToken);

  // Keep company author configured even if scopes are missing — UI will block publish.
  const authorUrn =
    (envAuthor?.startsWith("urn:li:organization:") ? envAuthor : null) ||
    configuredOrg ||
    organizationUrn ||
    (envAuthor?.startsWith("urn:li:person:") ? envAuthor : null) ||
    personUrn;

  const orgId =
    (authorUrn?.startsWith("urn:li:organization:") ? authorUrn.split(":").pop() : null) ||
    organizationUrn?.split(":").pop() ||
    process.env.LINKEDIN_ORGANIZATION_ID?.trim() ||
    TEMP_LINKEDIN.organizationId ||
    null;

  const existing = await prisma.linkedInIntegration.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  let configNotes: string;
  if (!authorUrn) {
    configNotes =
      "Token saved, but no company/person author URN. Set LINKEDIN_ORGANIZATION_ID.";
  } else if (authorUrn.startsWith("urn:li:organization:") && !hasOrgPostScope) {
    configNotes =
      `Company page ${authorUrn} is set, but this token only has scopes [${scope || "unknown"}]. ` +
      "Enable LinkedIn app product Community Management API, then revoke + reconnect so the token includes w_organization_social.";
  } else if (authorUrn.startsWith("urn:li:organization:")) {
    configNotes = `Connected; posting as company page ${authorUrn} (scopes: ${scope || "ok"})`;
  } else {
    configNotes = `Connected; posting as person ${authorUrn} (scopes: ${scope || "unknown"})`;
  }

  const data = {
    organizationId: orgId,
    authorUrn,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken ?? null,
    tokenExpiresAt: new Date(Date.now() + input.expiresIn * 1000),
    accessTokenSet: true,
    // Only enable publish when org author has org scopes (or person author).
    publishEnabled: Boolean(
      authorUrn && (authorUrn.startsWith("urn:li:person:") || hasOrgPostScope),
    ),
    lastConnectedAt: new Date(),
    configNotes,
  };

  if (existing) {
    await prisma.linkedInIntegration.update({ where: { id: existing.id }, data });
  } else {
    await prisma.linkedInIntegration.create({ data });
  }
}

export async function listAdminOrganizations(): Promise<
  Array<{ urn: string; name: string; vanityName?: string }>
> {
  const row = await prisma.linkedInIntegration.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (!row?.accessToken) return [];

  try {
    const res = await fetch(LINKEDIN_ORG_ACLS, {
      headers: {
        Authorization: `Bearer ${row.accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      elements?: Array<{ organizationalTarget?: string }>;
    };
    const urns = (json.elements ?? [])
      .map((e) => e.organizationalTarget)
      .filter((u): u is string => Boolean(u?.startsWith("urn:li:organization:")));

    const results: Array<{ urn: string; name: string; vanityName?: string }> = [];
    for (const urn of urns) {
      const id = urn.split(":").pop();
      if (!id) continue;
      try {
        const orgRes = await fetch(`https://api.linkedin.com/v2/organizations/${id}`, {
          headers: {
            Authorization: `Bearer ${row.accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        });
        if (!orgRes.ok) {
          results.push({ urn, name: `Organization ${id}` });
          continue;
        }
        const org = (await orgRes.json()) as {
          localizedName?: string;
          vanityName?: string;
        };
        results.push({
          urn,
          name: org.localizedName || `Organization ${id}`,
          vanityName: org.vanityName,
        });
      } catch {
        results.push({ urn, name: `Organization ${id}` });
      }
    }
    return results.sort((a, b) => {
      const aElah = a.name.toLowerCase().includes("elah") ? 0 : 1;
      const bElah = b.name.toLowerCase().includes("elah") ? 0 : 1;
      return aElah - bElah || a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}

export async function getPublishCredentials(): Promise<{
  accessToken: string;
  authorUrn: string;
} | null> {
  const envToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const preferredOrg = configuredOrganizationUrn();
  const envAuthor = process.env.LINKEDIN_AUTHOR_URN?.trim() || preferredOrg;

  if (envToken && envAuthor) {
    return { accessToken: envToken, authorUrn: envAuthor };
  }

  const row = await prisma.linkedInIntegration.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (!row?.accessToken) return null;

  // Always prefer configured / discovered company page when publishing.
  if (preferredOrg) {
    return { accessToken: row.accessToken, authorUrn: preferredOrg };
  }
  if (row.authorUrn?.startsWith("urn:li:organization:")) {
    return { accessToken: row.accessToken, authorUrn: row.authorUrn };
  }

  // Upgrade a personal author to company page if the token can see admin orgs.
  const orgUrn = await resolveOrganizationUrn(row.accessToken);
  if (orgUrn) {
    await prisma.linkedInIntegration.update({
      where: { id: row.id },
      data: {
        authorUrn: orgUrn,
        organizationId: orgUrn.split(":").pop() ?? null,
        publishEnabled: true,
        configNotes: `Connected; posting as company page ${orgUrn}`,
      },
    });
    return { accessToken: row.accessToken, authorUrn: orgUrn };
  }

  if (row.authorUrn) {
    return { accessToken: row.accessToken, authorUrn: row.authorUrn };
  }
  if (envAuthor) {
    return { accessToken: row.accessToken, authorUrn: envAuthor };
  }
  return null;
}

export async function getLinkedInConnectionStatus(): Promise<{
  tokenSaved: boolean;
  authorUrn: string | null;
  canPublish: boolean;
  notes: string | null;
  postsAsCompany: boolean;
  tokenScopes: string | null;
  missingOrgPermission: boolean;
}> {
  const row = await prisma.linkedInIntegration.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  const tokenSaved = Boolean(row?.accessToken || row?.accessTokenSet);
  let tokenScopes: string | null = null;
  let hasOrgPostScope = false;

  if (row?.accessToken) {
    const introspected = await introspectLinkedInToken(row.accessToken);
    tokenScopes = introspected.scope || null;
    hasOrgPostScope = scopeIncludesOrgPosting(introspected.scope);
  }

  const creds = await getPublishCredentials();
  const authorUrn = creds?.authorUrn ?? row?.authorUrn ?? null;
  const postsAsCompany = Boolean(authorUrn?.startsWith("urn:li:organization:"));
  const missingOrgPermission = postsAsCompany && tokenSaved && !hasOrgPostScope;
  const canPublish = Boolean(creds && (!postsAsCompany || hasOrgPostScope));

  return {
    tokenSaved,
    authorUrn,
    canPublish,
    notes: row?.configNotes ?? null,
    postsAsCompany,
    tokenScopes,
    missingOrgPermission,
  };
}

export async function saveAuthorUrn(authorUrnRaw: string): Promise<{ ok: boolean; error?: string }> {
  const authorUrn = authorUrnRaw.trim();
  if (!authorUrn.startsWith("urn:li:person:") && !authorUrn.startsWith("urn:li:organization:")) {
    return {
      ok: false,
      error: "Use urn:li:organization:XXXX (company) or urn:li:person:XXXX",
    };
  }
  const existing = await prisma.linkedInIntegration.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (!existing?.accessToken) {
    return { ok: false, error: "Connect LinkedIn first, then set the author URN." };
  }
  const organizationId = authorUrn.startsWith("urn:li:organization:")
    ? authorUrn.split(":").pop() ?? null
    : existing.organizationId;
  await prisma.linkedInIntegration.update({
    where: { id: existing.id },
    data: {
      authorUrn,
      organizationId,
      publishEnabled: true,
      configNotes: authorUrn.startsWith("urn:li:organization:")
        ? `Connected; posting as company page ${authorUrn}`
        : `Connected; author=${authorUrn}`,
    },
  });
  return { ok: true };
}

export async function publishTextToLinkedIn(
  text: string,
): Promise<LinkedInPublishResult> {
  const creds = await getPublishCredentials();
  if (!creds) {
    return {
      ok: false,
      error:
        "LinkedIn not ready. Connect LinkedIn as a company-page admin, and set LINKEDIN_ORGANIZATION_ID (or urn:li:organization:…).",
    };
  }

  const isOrg = creds.authorUrn.startsWith("urn:li:organization:");
  if (isOrg) {
    const introspected = await introspectLinkedInToken(creds.accessToken);
    if (!scopeIncludesOrgPosting(introspected.scope)) {
      return {
        ok: false,
        error:
          "Token is missing w_organization_social. In LinkedIn Developer Portal → Products, request/enable Community Management API, then revoke the app under LinkedIn → Settings → Data privacy → Permitted services, and click Connect LinkedIn again.",
      };
    }
  }

  const commentary = formatLinkedInCommentary(text);
  const postsCommentary = escapeLinkedInCommentary(commentary);

  // Prefer versioned Posts API (better commentary / paragraph handling).
  const postsRes = await fetch(LINKEDIN_POSTS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "LinkedIn-Version": process.env.LINKEDIN_API_VERSION?.trim() || "202502",
    },
    body: JSON.stringify({
      author: creds.authorUrn,
      commentary: postsCommentary,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    }),
  });

  if (postsRes.ok) {
    const postId = postsRes.headers.get("x-restli-id") ?? undefined;
    return { ok: true, postId };
  }

  const postsErr = await postsRes.text().catch(() => "");

  // Fallback to legacy UGC endpoint.
  const ugcRes = await fetch(LINKEDIN_UGC, {
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
          shareCommentary: { text: commentary },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!ugcRes.ok) {
    const ugcErr = await ugcRes.text().catch(() => "");
    const hint = isOrg
      ? " Ensure Community Management / w_organization_social is approved and you are a page admin."
      : " For the Elah Security company page, set LINKEDIN_ORGANIZATION_ID and reconnect.";
    return {
      ok: false,
      error: `LinkedIn publish failed (posts ${postsRes.status}: ${postsErr.slice(0, 180)} | ugc ${ugcRes.status}: ${ugcErr.slice(0, 180)}).${hint}`,
    };
  }

  const postId = ugcRes.headers.get("x-restli-id") ?? undefined;
  return { ok: true, postId };
}

export function isLinkedInPublishReadySync(): boolean {
  return linkedInOAuthConfigured();
}

export function getLinkedInOAuthDebug() {
  return {
    clientIdSet: Boolean(clientId()),
    clientSecretSet: Boolean(clientSecret()),
    redirectUri: redirectUri(),
    scopes: oauthScopes(),
    organizationUrn: configuredOrganizationUrn(),
    secretIsPlaceholder:
      !process.env.LINKEDIN_CLIENT_SECRET?.trim() &&
      TEMP_LINKEDIN.clientSecret === "REPLACE_WITH_LINKEDIN_CLIENT_SECRET",
  };
}
