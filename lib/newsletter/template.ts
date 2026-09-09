const REPLY_TO = "elahsecurity@gmail.com";
const SITE_URL = "https://elahsecurity.com";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderNewsletterBodyHtml(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return `<p style="margin:0;color:#7d8ba3;font-size:16px;line-height:1.7;">Your update will appear here as you write.</p>`;
  }

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px;font-size:16px;line-height:1.75;color:#e7ecf7;">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

export function renderNewsletterEmailHtml(input: {
  subject: string;
  body: string;
}): string {
  const subject = escapeHtml(input.subject.trim() || "Weekly Newsletter");
  const bodyHtml = renderNewsletterBodyHtml(input.body);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#070b14;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070b14;">
    <tr>
      <td align="center" style="padding:36px 16px 48px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
          <tr>
            <td style="padding:0 0 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;letter-spacing:0.28em;font-weight:700;color:#00A8FF;">ELAH</td>
                  <td align="right" style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7a94;">Weekly Newsletter</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="height:1px;background:rgba(0,168,255,0.28);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 0 8px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 0 0;border-top:1px solid rgba(231,236,247,0.1);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;line-height:1.65;color:#6b7a94;">
              ELAH · Reasoning-level security for agentic AI<br />
              <a href="${SITE_URL}" style="color:#00A8FF;text-decoration:none;">elahsecurity.com</a>
              &nbsp;·&nbsp;Reply to this email to reach ${escapeHtml(REPLY_TO)}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
