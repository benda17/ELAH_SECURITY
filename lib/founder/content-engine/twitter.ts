import "server-only";
import crypto from "crypto";
import { toTweetText } from "./format-post";

export { toTweetText };

const TWEETS_URL = "https://api.twitter.com/2/tweets";

export type TwitterCredentials = {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
};

export type TwitterPublishResult = {
  ok: boolean;
  postId?: string;
  error?: string;
};

function env(name: string): string {
  return process.env[name]?.trim() || "";
}

export function getTwitterCredentials(): TwitterCredentials | null {
  const apiKey = env("X_API_KEY") || env("TWITTER_API_KEY");
  const apiSecret = env("X_API_SECRET") || env("TWITTER_API_SECRET");
  const accessToken = env("X_ACCESS_TOKEN") || env("TWITTER_ACCESS_TOKEN");
  const accessTokenSecret =
    env("X_ACCESS_TOKEN_SECRET") || env("TWITTER_ACCESS_TOKEN_SECRET");
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) return null;
  return { apiKey, apiSecret, accessToken, accessTokenSecret };
}

export function twitterConfigured(): boolean {
  return Boolean(getTwitterCredentials());
}

export function getTwitterConfigStatus() {
  return {
    configured: twitterConfigured(),
    apiKeySet: Boolean(env("X_API_KEY") || env("TWITTER_API_KEY")),
    apiSecretSet: Boolean(env("X_API_SECRET") || env("TWITTER_API_SECRET")),
    accessTokenSet: Boolean(env("X_ACCESS_TOKEN") || env("TWITTER_ACCESS_TOKEN")),
    accessTokenSecretSet: Boolean(
      env("X_ACCESS_TOKEN_SECRET") || env("TWITTER_ACCESS_TOKEN_SECRET"),
    ),
  };
}

export function parseTwitterPublishNote(notes: string | null | undefined): {
  twitterPostId: string | null;
  twitterPublishedAt: string | null;
} {
  const match = notes?.match(/^ELAH_TWITTER:(\{.*\})$/m);
  if (!match?.[1]) return { twitterPostId: null, twitterPublishedAt: null };
  try {
    const parsed = JSON.parse(match[1]) as { id?: string; at?: string };
    return {
      twitterPostId: parsed.id?.trim() || null,
      twitterPublishedAt: parsed.at?.trim() || null,
    };
  } catch {
    return { twitterPostId: null, twitterPublishedAt: null };
  }
}

export function upsertTwitterPublishNote(
  notes: string | null | undefined,
  postId: string,
  at: Date,
): string {
  const line = `ELAH_TWITTER:${JSON.stringify({ id: postId, at: at.toISOString() })}`;
  const existing = notes?.trim() ?? "";
  if (!existing) return line;
  if (/^ELAH_TWITTER:(\{.*\})$/m.test(existing)) {
    return existing.replace(/^ELAH_TWITTER:(\{.*\})$/m, line);
  }
  return `${existing}\n${line}`;
}

/** RFC 3986 encoding used by OAuth 1.0a. */
function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function oauthAuthorizationHeader(
  method: string,
  url: string,
  creds: TwitterCredentials,
): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  const base = Object.keys(oauth)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(oauth[k]!)}`)
    .join("&");
  const signatureBase = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(base)}`;
  const signingKey = `${percentEncode(creds.apiSecret)}&${percentEncode(creds.accessTokenSecret)}`;
  oauth.oauth_signature = crypto
    .createHmac("sha1", signingKey)
    .update(signatureBase)
    .digest("base64");

  return `OAuth ${Object.keys(oauth)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauth[k]!)}"`)
    .join(", ")}`;
}

export async function publishTextToTwitter(
  text: string,
  options?: { replyToId?: string },
): Promise<TwitterPublishResult> {
  const creds = getTwitterCredentials();
  if (!creds) {
    return {
      ok: false,
      error:
        "X API keys are not set. Add X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, and X_ACCESS_TOKEN_SECRET to .env.local.",
    };
  }

  const payload: { text: string; reply?: { in_reply_to_tweet_id: string } } = {
    text,
  };
  if (options?.replyToId) {
    payload.reply = { in_reply_to_tweet_id: options.replyToId };
  }

  const res = await fetch(TWEETS_URL, {
    method: "POST",
    headers: {
      Authorization: oauthAuthorizationHeader("POST", TWEETS_URL, creds),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as {
    data?: { id?: string };
    detail?: string;
    title?: string;
    errors?: Array<{ message?: string; detail?: string }>;
  };

  if (!res.ok || !json.data?.id) {
    const fromErrors = json.errors
      ?.map((e) => e.message || e.detail)
      .filter(Boolean)
      .join("; ");
    return {
      ok: false,
      error:
        fromErrors ||
        json.detail ||
        json.title ||
        `X API rejected the tweet (HTTP ${res.status}).`,
    };
  }

  return { ok: true, postId: json.data.id };
}

export async function publishTwitterThread(
  texts: string[],
): Promise<{ ok: boolean; postIds: string[]; error?: string }> {
  const postIds: string[] = [];
  for (const text of texts) {
    const result = await publishTextToTwitter(text, {
      replyToId: postIds.at(-1),
    });
    if (!result.ok || !result.postId) {
      return {
        ok: false,
        postIds,
        error: postIds.length
          ? `Posted ${postIds.length} then X failed: ${result.error}`
          : result.error,
      };
    }
    postIds.push(result.postId);
  }
  return { ok: true, postIds };
}
