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
