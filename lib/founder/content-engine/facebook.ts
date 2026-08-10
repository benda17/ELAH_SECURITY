import "server-only";
import { prisma } from "@/lib/prisma";
import { buildLinkedInClipboardText } from "@/lib/founder/content-engine/format-post";

const GRAPH = "https://graph.facebook.com/v21.0";
const FB_DIALOG = "https://www.facebook.com/v21.0/dialog/oauth";

/** Requires Meta App use case: "Manage everything on your Page". */
const DEFAULT_SCOPES =
  "public_profile,business_management,pages_show_list,pages_manage_posts,pages_read_engagement";

export type FacebookPublishResult = {
  ok: boolean;
  postId?: string;
  error?: string;
};

export type FacebookPageOption = {
  id: string;
  name: string;
  accessToken: string;
  tasks?: string[];
};

function appId() {
  return process.env.FACEBOOK_APP_ID?.trim() || "";
}

function appSecret() {
  return process.env.FACEBOOK_APP_SECRET?.trim() || "";
}

const ELAH_FACEBOOK_PAGE_ID = "1230552100150158";
const ELAH_FACEBOOK_PAGE_NAME = "ELAH Security";

function envPageId() {
  return process.env.FACEBOOK_PAGE_ID?.trim() || ELAH_FACEBOOK_PAGE_ID;
}

function envPageAccessToken() {
  return process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() || "";
}

function isLocalDev() {
  return process.env.NODE_ENV !== "production" || process.env.FACEBOOK_USE_LOCAL_REDIRECT === "true";
}

export function facebookOAuthConfigured(): boolean {
  return Boolean(appId() && appSecret());
}

export function redirectUri(): string {
  const raw = process.env.FACEBOOK_REDIRECT_URI?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.pathname === "/" || u.pathname === "") {
        return `${u.origin}/api/facebook/callback`;
      }
      return `${u.origin}${u.pathname}`.replace(/\/$/, "");
    } catch {
      return raw.replace(/\/$/, "");
    }
  }
  if (isLocalDev()) return "http://localhost:3001/api/facebook/callback";
  return "https://elah-webpage.vercel.app/api/facebook/callback";
}

function oauthScopes(): string {
  return process.env.FACEBOOK_OAUTH_SCOPES?.trim() || DEFAULT_SCOPES;
}

export function buildFacebookAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: appId(),
    redirect_uri: redirectUri(),
    state,
    response_type: "code",
  });
  // Facebook Login for Business configs carry permissions; classic Login uses scope=.
  const configId = process.env.FACEBOOK_LOGIN_CONFIG_ID?.trim();
  if (configId) {
    params.set("config_id", configId);
  } else {
    params.set("scope", oauthScopes());
  }
  return `${FB_DIALOG}?${params.toString()}`;
}

export function getFacebookOAuthDebug() {
  return {
    appIdSet: Boolean(appId()),
    appSecretSet: Boolean(appSecret()),
    redirectUri: redirectUri(),
    scopes: oauthScopes(),
    loginConfigId: process.env.FACEBOOK_LOGIN_CONFIG_ID?.trim() || null,
  };
}

async function getIntegrationRow() {
  return prisma.facebookIntegration.findFirst({ orderBy: { updatedAt: "desc" } });
}

export async function getPublishCredentials(): Promise<{
  pageId: string;
  pageAccessToken: string;
} | null> {
  const envId = envPageId();
  const envToken = envPageAccessToken();
  if (envId && envToken) {
    return { pageId: envId, pageAccessToken: envToken };
  }

  const row = await getIntegrationRow();
  if (row?.pageId && row.pageAccessToken) {
    return { pageId: row.pageId, pageAccessToken: row.pageAccessToken };
  }
  return null;
}

export async function facebookPublishConfigured(): Promise<boolean> {
  return Boolean(await getPublishCredentials());
}

export async function facebookAutoPublishEnabled(): Promise<boolean> {
  const creds = await getPublishCredentials();
  if (!creds) return false;
  const flag = process.env.FACEBOOK_AUTO_PUBLISH?.trim().toLowerCase();
  if (flag === "false") return false;
  // Default on whenever Elah page credentials exist.
  return true;
}

export async function getFacebookPublishStatus(): Promise<{
  configured: boolean;
  autoPublish: boolean;
  oauthConfigured: boolean;
  pageId: string | null;
  pageName: string | null;
  notes: string | null;
}> {
  const creds = await getPublishCredentials();
  const row = await getIntegrationRow();
  return {
    configured: Boolean(creds),
    autoPublish: await facebookAutoPublishEnabled(),
    oauthConfigured: facebookOAuthConfigured(),
    pageId: creds?.pageId ?? row?.pageId ?? null,
    pageName: row?.pageName ?? null,
    notes: row?.configNotes ?? null,
  };
}

export async function exchangeFacebookCode(code: string): Promise<{
  accessToken: string;
  expiresIn?: number;
}> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("client_id", appId());
  url.searchParams.set("client_secret", appSecret());
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("code", code);

  const res = await fetch(url);
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message || `Facebook token exchange failed (${res.status})`);
  }
  return { accessToken: json.access_token, expiresIn: json.expires_in };
}

export async function exchangeForLongLivedUserToken(shortLivedToken: string): Promise<{
  accessToken: string;
  expiresIn?: number;
}> {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId());
  url.searchParams.set("client_secret", appSecret());
  url.searchParams.set("fb_exchange_token", shortLivedToken);

  const res = await fetch(url);
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message || `Long-lived token exchange failed (${res.status})`);
  }
  return { accessToken: json.access_token, expiresIn: json.expires_in };
}

export async function listManagedPages(userAccessToken: string): Promise<FacebookPageOption[]> {
  const url = new URL(`${GRAPH}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token,tasks");
  url.searchParams.set("access_token", userAccessToken);
  url.searchParams.set("limit", "100");

  const res = await fetch(url);
  const json = (await res.json()) as {
    data?: Array<{
      id?: string;
      name?: string;
      access_token?: string;
      tasks?: string[];
    }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(json.error?.message || `Failed to list Facebook pages (${res.status})`);
  }

  const pages = (json.data ?? [])
    .filter((p): p is { id: string; name: string; access_token: string; tasks?: string[] } =>
      Boolean(p.id && p.name && p.access_token),
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      accessToken: p.access_token,
      tasks: p.tasks,
    }));

  return pages.sort((a, b) => {
    const aElah = a.name.toLowerCase().includes("elah") ? 0 : 1;
    const bElah = b.name.toLowerCase().includes("elah") ? 0 : 1;
    return aElah - bElah || a.name.localeCompare(b.name);
  });
}

export async function saveFacebookConnection(input: {
  userAccessToken: string;
  expiresIn?: number;
}): Promise<{ pages: FacebookPageOption[]; selectedPageId: string | null }> {
  const pages = await listManagedPages(input.userAccessToken);
  // Always publish as ELAH Security — never prompt for page selection.
  const elah =
    pages.find((p) => p.id === ELAH_FACEBOOK_PAGE_ID) ||
    pages.find((p) => p.id === envPageId()) ||
    pages.find((p) => p.name.toLowerCase().includes("elah")) ||
    null;

  const existing = await getIntegrationRow();
  const data = {
    userAccessToken: input.userAccessToken,
    tokenExpiresAt: input.expiresIn
      ? new Date(Date.now() + input.expiresIn * 1000)
      : null,
    accessTokenSet: true,
    lastConnectedAt: new Date(),
    pageId: elah?.id ?? ELAH_FACEBOOK_PAGE_ID,
    pageName: elah?.name ?? ELAH_FACEBOOK_PAGE_NAME,
    pageAccessToken: elah?.accessToken ?? null,
    publishEnabled: Boolean(elah?.accessToken),
    autoPublish: true,
    configNotes: elah
      ? `Auto-publishing as ${elah.name} (${elah.id})`
      : `Connected, but ELAH page (${ELAH_FACEBOOK_PAGE_ID}) was not in me/accounts. Reconnect as Page admin.`,
  };

  if (existing) {
    await prisma.facebookIntegration.update({ where: { id: existing.id }, data });
  } else {
    await prisma.facebookIntegration.create({ data });
  }

  return { pages, selectedPageId: elah?.id ?? null };
}

export async function selectFacebookPage(pageId: string): Promise<{
  ok: boolean;
  error?: string;
  pageName?: string;
}> {
  const row = await getIntegrationRow();
  if (!row?.userAccessToken) {
    return { ok: false, error: "Connect Facebook first." };
  }

  const pages = await listManagedPages(row.userAccessToken);
  const page = pages.find((p) => p.id === pageId);
  if (!page) {
    return { ok: false, error: "Page not found for this Facebook account." };
  }

  await prisma.facebookIntegration.update({
    where: { id: row.id },
    data: {
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.accessToken,
      publishEnabled: true,
      autoPublish: true,
      configNotes: `Connected; publishing as Facebook Page "${page.name}" (${page.id})`,
    },
  });

  return { ok: true, pageName: page.name };
}

export async function listSavedFacebookPages(): Promise<FacebookPageOption[]> {
  const row = await getIntegrationRow();
  if (!row?.userAccessToken) return [];
  try {
    return await listManagedPages(row.userAccessToken);
  } catch {
    return [];
  }
}

export async function setFacebookAutoPublish(enabled: boolean): Promise<void> {
  const row = await getIntegrationRow();
  if (!row) return;
  await prisma.facebookIntegration.update({
    where: { id: row.id },
    data: { autoPublish: enabled },
  });
}

/** Paste a Page access token (e.g. from Graph API Explorer) when OAuth scopes are blocked. */
export async function saveManualPageCredentials(input: {
  pageId: string;
  pageAccessToken: string;
  pageName?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const pageId = input.pageId.trim();
  const pageAccessToken = input.pageAccessToken.trim();
  if (!pageId || !pageAccessToken) {
    return { ok: false, error: "pageId and pageAccessToken are required" };
  }

  // Verify the token can read the page before saving.
  const verifyUrl = new URL(`${GRAPH}/${encodeURIComponent(pageId)}`);
  verifyUrl.searchParams.set("fields", "id,name");
  verifyUrl.searchParams.set("access_token", pageAccessToken);
  const verifyRes = await fetch(verifyUrl);
  const verifyJson = (await verifyRes.json().catch(() => ({}))) as {
    id?: string;
    name?: string;
    error?: { message?: string };
  };
  if (!verifyRes.ok || !verifyJson.id) {
    return {
      ok: false,
      error:
        verifyJson.error?.message ||
        "Token could not access that Page. Use a Page access token (from me/accounts), not a User token.",
    };
  }

  const existing = await getIntegrationRow();
  const data = {
    pageId: verifyJson.id,
    pageName: input.pageName?.trim() || verifyJson.name || null,
    pageAccessToken,
    accessTokenSet: true,
    publishEnabled: true,
    autoPublish: true,
    lastConnectedAt: new Date(),
    configNotes: `Manual Page token; publishing as "${verifyJson.name ?? verifyJson.id}" (${verifyJson.id})`,
  };

  if (existing) {
    await prisma.facebookIntegration.update({ where: { id: existing.id }, data });
  } else {
    await prisma.facebookIntegration.create({ data });
  }
  return { ok: true };
}

export async function publishTextToFacebook(
  text: string,
  hashtags: string[] = [],
): Promise<FacebookPublishResult> {
  const creds = await getPublishCredentials();
  if (!creds) {
    return {
      ok: false,
      error:
        "Facebook not connected. Click Connect Facebook and select the Elah page (needs pages_manage_posts).",
    };
  }

  const message = buildLinkedInClipboardText(text, hashtags);
  const url = new URL(`${GRAPH}/${encodeURIComponent(creds.pageId)}/feed`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      message,
      access_token: creds.pageAccessToken,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string; code?: number; type?: string };
  };

  if (!res.ok || !json.id) {
    return {
      ok: false,
      error:
        json.error?.message ||
        `Facebook publish failed (${res.status}). Reconnect Facebook and confirm Page publish permission.`,
    };
  }

  return { ok: true, postId: json.id };
}
