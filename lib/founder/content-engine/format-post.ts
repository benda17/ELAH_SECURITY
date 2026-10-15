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
  let text = fromLinkedInBold(body).replace(/\r\n/g, "\n").trim();
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

const BOLD_A = 0x1d5d4;
const BOLD_Z = BOLD_A + 25;
const BOLD_a = 0x1d5ee;
const BOLD_z = BOLD_a + 25;
const BOLD_0 = 0x1d7ec;
const BOLD_9 = BOLD_0 + 9;

function boldCodePoint(code: number): string | null {
  if (code >= 0x41 && code <= 0x5a) return String.fromCodePoint(BOLD_A + (code - 0x41));
  if (code >= 0x61 && code <= 0x7a) return String.fromCodePoint(BOLD_a + (code - 0x61));
  if (code >= 0x30 && code <= 0x39) return String.fromCodePoint(BOLD_0 + (code - 0x30));
  return null;
}

function plainCodePoint(code: number): string | null {
  if (code >= BOLD_A && code <= BOLD_Z) return String.fromCharCode(0x41 + (code - BOLD_A));
  if (code >= BOLD_a && code <= BOLD_z) return String.fromCharCode(0x61 + (code - BOLD_a));
  if (code >= BOLD_0 && code <= BOLD_9) return String.fromCharCode(0x30 + (code - BOLD_0));
  return null;
}

/** LinkedIn has no bold control. These sans-serif letters are the bold the feed can show. */
export function toLinkedInBold(text: string): string {
  let out = "";
  const urls = /https?:\/\/\S+/gi;
  let last = 0;
  for (const match of text.matchAll(urls)) {
    const index = match.index ?? 0;
    out += boldPlain(text.slice(last, index));
    out += match[0];
    last = index + match[0].length;
  }
  return out + boldPlain(text.slice(last));
}

function boldPlain(text: string): string {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    out += boldCodePoint(code) ?? char;
  }
  return out;
}

export function fromLinkedInBold(text: string): string {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    out += plainCodePoint(code) ?? char;
  }
  return out;
}

export function hasLinkedInBold(text: string): boolean {
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (plainCodePoint(code)) return true;
  }
  return false;
}

function tidyLinkedInText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, "").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function convertBoldMarkers(text: string): string {
  return text.replace(/\*\*([^*\n]+)\*\*/g, (_, inner: string) => toLinkedInBold(inner.trim()));
}

function splitSentences(paragraph: string): string[] {
  const cleaned = paragraph.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  return cleaned
    .split(/(?<=(?<!\d)(?<![A-Z])[.!?])\s+(?=[A-Z0-9“"(\[])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function styleProse(text: string): string {
  const chunks = text.split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean);
  const urls: string[] = [];
  const paragraphs: string[] = [];
  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    const prose = lines.filter((line) => !/^https?:\/\/\S+$/i.test(line));
    urls.push(...lines.filter((line) => /^https?:\/\/\S+$/i.test(line)));
    if (prose.length > 0) paragraphs.push(prose.join(" "));
  }

  const groups = paragraphs.map(splitSentences).filter((group) => group.length > 0);
  if (groups.length === 0) return urls.join("\n\n");

  const blocks: string[] = [];
  if (groups.length === 1) {
    const sentences = groups[0]!;
    blocks.push(toLinkedInBold(sentences[0]!));
    if (sentences.length === 2) {
      blocks.push(toLinkedInBold(sentences[1]!));
    } else if (sentences.length > 2) {
      blocks.push(sentences.slice(1, -1).join("\n"));
      blocks.push(toLinkedInBold(sentences[sentences.length - 1]!));
    }
  } else {
    const first = groups[0]!;
    const last = groups[groups.length - 1]!;
    const middle = groups.slice(1, -1);
    const opening = [toLinkedInBold(first[0]!)];
    if (first.length > 1) opening.push(first.slice(1).join("\n"));
    blocks.push(opening.join("\n"));
    middle.forEach((group, index) => {
      const turn = index === middle.length - 1;
      if (turn && group.length > 1) {
        blocks.push(`${group.slice(0, -1).join("\n")}\n${toLinkedInBold(group[group.length - 1]!)}`);
      } else if (turn) {
        blocks.push(toLinkedInBold(group[0]!));
      } else {
        blocks.push(group.join("\n"));
      }
    });
    blocks.push(last.map((sentence) => toLinkedInBold(sentence)).join("\n"));
  }

  const body = blocks.filter(Boolean).join("\n\n");
  return urls.length > 0 ? `${body}\n\n${urls.join("\n")}` : body;
}

/**
 * The LinkedIn text UI: a bold opening, short plain lines, a bold turn, and a bold close.
 * Lines wrapped in ** ** become the feed's bold sans-serif. Plain prose gets the same shape.
 */
export function applyLinkedInTextUi(raw: string): string {
  const text = raw.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ").trim();
  if (!text) return "";
  const marked = convertBoldMarkers(text);
  if (marked !== text || hasLinkedInBold(marked)) return tidyLinkedInText(marked);
  return styleProse(text);
}
