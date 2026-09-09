import "server-only";
import { prisma } from "@/lib/prisma";

const GMAIL_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GMAIL_TOKEN = "https://oauth2.googleapis.com/token";
const GMAIL_SEND = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const GMAIL_USERINFO = "https://www.googleapis.com/oauth2/v2/userinfo";

const DEFAULT_FROM_EMAIL = "elahsecurity@gmail.com";
const DEFAULT_FROM_NAME = "ELAH";
const LOCAL_REDIRECT = "http://localhost:3001/api/gmail/callback";
const PROD_REDIRECT = "https://elahfounderplatform.vercel.app/api/gmail/callback";
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

const SEND_GAP_MS = 350;

export type GmailSendStatus = {
  oauthApp: boolean;
  connected: boolean;
  ready: boolean;
  fromValue: string;
  email: string | null;
  redirectUri: string;
};

function clientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() || "";
}

function clientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
}

function isLocalDev() {
  return process.env.NODE_ENV !== "production" || process.env.GMAIL_USE_LOCAL_REDIRECT === "true";
}

export function expectedGmailAddress() {
  const raw = process.env.GMAIL_FROM?.trim() || DEFAULT_FROM_EMAIL;
  const match = /<([^>]+)>/.exec(raw);
  return (match?.[1] || raw).trim().toLowerCase() || DEFAULT_FROM_EMAIL;
}

export function fromHeaderValue(email = expectedGmailAddress()) {
  return `${DEFAULT_FROM_NAME} <${email}>`;
}

export function gmailOAuthConfigured() {
  return Boolean(clientId() && clientSecret());
}

export function gmailRedirectUri(): string {
  const raw = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.pathname === "/" || u.pathname === "") {
        return `${u.origin}/api/gmail/callback`;
      }
      return `${u.origin}${u.pathname}`.replace(/\/$/, "");
    } catch {
      return raw.replace(/\/$/, "");
    }
  }
  if (isLocalDev()) return LOCAL_REDIRECT;
  return PROD_REDIRECT;
}

export function buildGmailAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId(),
    redirect_uri: gmailRedirectUri(),
    state,
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });
  return `${GMAIL_AUTH}?${params.toString()}`;
}

export async function exchangeGmailCode(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: gmailRedirectUri(),
    client_id: clientId(),
    client_secret: clientSecret(),
  });
  const res = await fetch(GMAIL_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(
      json.error_description || json.error || `Google token exchange failed (${res.status})`,
    );
  }
  return {
    accessToken: json.access_token,
    expiresIn: json.expires_in ?? 3600,
    refreshToken: json.refresh_token,
  };
}

async function fetchGmailEmail(accessToken: string): Promise<string> {
  const res = await fetch(GMAIL_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = (await res.json()) as { email?: string };
  const email = json.email?.trim().toLowerCase() || "";
  if (!email) throw new Error("Google did not return the Gmail address.");
  return email;
}

export async function saveGmailConnection(input: {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}): Promise<void> {
  const email = await fetchGmailEmail(input.accessToken);
  const expected = expectedGmailAddress();
  if (email !== expected) {
    throw new Error(
      `Connected ${email}, but sending is set to ${expected}. Sign in with that Gmail account.`,
    );
  }

  const existing = await prisma.gmailIntegration.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  const refreshToken = input.refreshToken || existing?.refreshToken || null;
  if (!refreshToken) {
    throw new Error(
      "Google did not return a refresh token. Disconnect the app at myaccount.google.com/permissions, then Connect Gmail again.",
    );
  }

  const data = {
    email,
    accessToken: input.accessToken,
    refreshToken,
    tokenExpiresAt: new Date(Date.now() + input.expiresIn * 1000),
    accessTokenSet: true,
    lastConnectedAt: new Date(),
    configNotes: `Connected as ${email}`,
  };

  if (existing) {
    await prisma.gmailIntegration.update({ where: { id: existing.id }, data });
  } else {
    await prisma.gmailIntegration.create({ data });
  }
}

async function loadGmailRow() {
  try {
    return await prisma.gmailIntegration.findFirst({
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return null;
  }
}

export async function getGmailSendStatus(): Promise<GmailSendStatus> {
  const row = await loadGmailRow();
  const envRefresh = process.env.GMAIL_REFRESH_TOKEN?.trim();
  const connected = Boolean(row?.refreshToken || envRefresh);
  const email = row?.email?.trim().toLowerCase() || (connected ? expectedGmailAddress() : null);
  return {
    oauthApp: gmailOAuthConfigured(),
    connected,
    ready: connected,
    fromValue: fromHeaderValue(email || expectedGmailAddress()),
    email,
    redirectUri: gmailRedirectUri(),
  };
}

async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId(),
    client_secret: clientSecret(),
  });
  const res = await fetch(GMAIL_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    throw new Error(
      json.error_description || json.error || "Gmail access expired. Connect Gmail again in Settings.",
    );
  }
  return { accessToken: json.access_token, expiresIn: json.expires_in ?? 3600 };
}

async function getAccessToken(): Promise<string> {
  const row = await loadGmailRow();
  const refreshToken = row?.refreshToken?.trim() || process.env.GMAIL_REFRESH_TOKEN?.trim() || "";
  if (!refreshToken) {
    throw new Error("Gmail is not connected. Open Settings and click Connect Gmail.");
  }

  const stillValid =
    row?.accessToken &&
    row.tokenExpiresAt &&
    row.tokenExpiresAt.getTime() - 60_000 > Date.now();
  if (stillValid && row.accessToken) return row.accessToken;

  const next = await refreshAccessToken(refreshToken);
  if (row) {
    await prisma.gmailIntegration.update({
      where: { id: row.id },
      data: {
        accessToken: next.accessToken,
        tokenExpiresAt: new Date(Date.now() + next.expiresIn * 1000),
        accessTokenSet: true,
      },
    });
  }
  return next.accessToken;
}

function assertEmail(value: string): string {
  const email = value.trim();
  if (!email || /[\r\n]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid recipient address.");
  }
  return email;
}

function encodeHeaderValue(value: string): string {
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildMime(input: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): string {
  const boundary = `elah_${crypto.randomUUID().replace(/-/g, "")}`;
  const headers = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeaderValue(input.subject)}`,
  ];
  if (input.replyTo) headers.push(`Reply-To: ${input.replyTo}`);
  headers.push("MIME-Version: 1.0", `Content-Type: multipart/alternative; boundary="${boundary}"`);
  return [
    ...headers,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.text,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    input.html,
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

export async function sendGmailMessage(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  const to = assertEmail(input.to);
  const status = await getGmailSendStatus();
  const raw = toBase64Url(
    buildMime({
      from: status.fromValue,
      to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    }),
  );

  const sendOnce = async (accessToken: string) =>
    fetch(GMAIL_SEND, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

  let accessToken = await getAccessToken();
  let res = await sendOnce(accessToken);
  if (res.status === 401) {
    const row = await loadGmailRow();
    const refreshToken = row?.refreshToken?.trim() || process.env.GMAIL_REFRESH_TOKEN?.trim() || "";
    if (!refreshToken) throw new Error("Gmail access expired. Connect Gmail again in Settings.");
    const next = await refreshAccessToken(refreshToken);
    if (row) {
      await prisma.gmailIntegration.update({
        where: { id: row.id },
        data: {
          accessToken: next.accessToken,
          tokenExpiresAt: new Date(Date.now() + next.expiresIn * 1000),
          accessTokenSet: true,
        },
      });
    }
    accessToken = next.accessToken;
    res = await sendOnce(accessToken);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    let message = `Gmail send failed (${res.status})`;
    try {
      const json = JSON.parse(detail) as { error?: { message?: string } };
      if (json.error?.message) message = json.error.message;
    } catch {
      if (detail.trim()) message = detail.trim().slice(0, 280);
    }
    throw new Error(message);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendGmailToMany(
  recipients: string[],
  message: { subject: string; text: string; html: string },
): Promise<{ sent: number; error?: string }> {
  let sent = 0;
  for (const recipient of recipients) {
    try {
      await sendGmailMessage({
        to: recipient,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      sent += 1;
      if (sent < recipients.length) await delay(SEND_GAP_MS);
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Gmail rejected the request.";
      return {
        sent,
        error:
          sent > 0
            ? `Sent ${sent} then Gmail failed: ${detail}`
            : `Gmail send failed: ${detail}`,
      };
    }
  }
  return { sent };
}
