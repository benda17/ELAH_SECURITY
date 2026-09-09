/**
 * LinkedIn's feed often collapses single newlines into spaces.
 * Promote line breaks to paragraph breaks (`\n\n`) so spacing survives paste/publish.
 */
export function formatLinkedInCommentary(text: string): string {
  let t = text.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
  const paragraphs = t
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.replace(/[ \t]+$/g, "").trim())
        .filter(Boolean)
        .join("\n\n"),
    )
    .filter(Boolean);
  return paragraphs.join("\n\n");
}

export function buildLinkedInClipboardText(body: string, hashtags: string[] = []): string {
  const commentary = formatLinkedInCommentary(body);
  const tags = hashtags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));
  if (tags.length === 0) return commentary;
  return `${commentary}\n\n${tags.join(" ")}`;
}

export function companyPageAdminPostsUrl(organizationId: string): string {
  const id = organizationId.replace(/^urn:li:organization:/, "").trim();
  return `https://www.linkedin.com/company/${id}/admin/feed/posts/`;
}

const MAX_TWEET_CHARS = 280;
const LANDING = "https://www.elahsecurity.com";

/** Logged-in compose UI. We copy the full post and let the founder paste — no paid API. */
export const TWITTER_COMPOSE_URL = "https://x.com/compose/post";

function codePointLength(text: string): number {
  return Array.from(text).length;
}

/** Truncate to 280 chars — only for the paid X API path, not the compose paste. */
export function toTweetText(body: string, hashtags: string[] = []): string {
  const tags = hashtags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));
  let text = body.replace(/\r\n/g, "\n").trim();
  if (tags.length > 0 && !tags.every((tag) => text.includes(tag))) {
    text = `${text}\n\n${tags.join(" ")}`;
  }
  if (codePointLength(text) <= MAX_TWEET_CHARS) return text;

  const suffix = `\n\n${LANDING}`;
  const budget = MAX_TWEET_CHARS - codePointLength(suffix) - 1;
  const chars = Array.from(text);
  let cut = chars.slice(0, Math.max(0, budget)).join("");
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > budget * 0.55) cut = cut.slice(0, lastSpace);
  return `${cut.trim()}…${suffix}`;
}

/** Same full post LinkedIn and Facebook publish — not a 280-character snippet. */
export function buildTwitterClipboardText(body: string, hashtags: string[] = []): string {
  return buildLinkedInClipboardText(body, hashtags);
}
