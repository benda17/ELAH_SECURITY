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

export const MAX_X_POST_CHARS = 280;
const LANDING = "https://www.elahsecurity.com";

/** Logged-in compose UI. We copy an X-ready post and let the founder paste — no paid API. */
export const TWITTER_COMPOSE_URL = "https://x.com/compose/post";

/**
 * Conservative approximation of X's weighted length:
 * ASCII is one unit; non-ASCII (including emoji) is two. Literal URLs are
 * counted at their source length, which is no less than X's shortened-link cost.
 */
export function xPostCharacterCount(text: string): number {
  return Array.from(text).reduce(
    (total, char) => total + ((char.codePointAt(0) ?? 0) <= 0x7f ? 1 : 2),
    0,
  );
}

/** Produce one deterministic X-ready post, capped at 280 Unicode code points. */
export function toTweetText(body: string, hashtags: string[] = []): string {
  const tags = hashtags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));
  let text = body.replace(/\r\n/g, "\n").trim();
  if (tags.length > 0 && !tags.every((tag) => text.includes(tag))) {
    text = `${text}\n\n${tags.join(" ")}`;
  }
  if (xPostCharacterCount(text) <= MAX_X_POST_CHARS) return text;

  const suffix = `…\n\n${LANDING}`;
  const budget = MAX_X_POST_CHARS - xPostCharacterCount(suffix);
  let used = 0;
  let cut = "";
  for (const char of Array.from(text)) {
    const weight = (char.codePointAt(0) ?? 0) <= 0x7f ? 1 : 2;
    if (used + weight > budget) break;
    cut += char;
    used += weight;
  }
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > cut.length * 0.55) cut = cut.slice(0, lastSpace);
  return `${cut.trim()}${suffix}`;
}

/** Manual X compose receives the same capped text as the X API path. */
export function buildTwitterClipboardText(body: string, hashtags: string[] = []): string {
  return toTweetText(body, hashtags);
}
