const REPLY_TO = "elahsecurity@gmail.com";
const SITE_URL = "https://elahsecurity.com";

// Sent mail needs an absolute URL. The dashboard preview passes the current
// origin instead, because this file is not on the production host yet.
const DAVE_PATH = "/dave/dave-peek.png";
const DAVE_PUBLIC_ORIGIN = "https://elahfounderplatform.vercel.app";

export type NewsletterLook = "light" | "dark";

const LOOKS = {
  dark: {
    page: "#070b14",
    card: "#0b1424",
    cardBorder: "rgba(0,168,255,0.28)",
    kicker: "#6b7a94",
    tagline: "#e7ecf7",
    body: "#e7ecf7",
    placeholder: "#7d8ba3",
    footer: "#6b7a94",
    footerRule: "rgba(231,236,247,0.1)",
    link: "#00A8FF",
    logo: "/email/elah-logo-on-dark.png",
  },
  light: {
    page: "#f4f6f9",
    card: "#ffffff",
    cardBorder: "#d5deea",
    kicker: "#66758c",
    tagline: "#243044",
    body: "#1c2433",
    placeholder: "#7d8ba3",
    footer: "#66758c",
    footerRule: "#e2e8f0",
    link: "#0077b6",
    logo: "/email/elah-logo-on-light.png",
  },
} as const;

export function parseNewsletterLook(value: unknown): NewsletterLook {
  return value === "dark" ? "dark" : "light";
}

function publicSrc(path: string, origin?: string): string {
  const base = (origin || DAVE_PUBLIC_ORIGIN).replace(/\/$/, "");
  return `${base}${path}`;
}

export function daveImageSrc(origin?: string): string {
  return publicSrc(DAVE_PATH, origin);
}

export function logoImageSrc(look: NewsletterLook = "light", origin?: string): string {
  return publicSrc(LOOKS[look].logo, origin);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderNewsletterBodyHtml(
  body: string,
  look: NewsletterLook = "light",
): string {
  const ink = LOOKS[look];
  const trimmed = body.trim();
  if (!trimmed) {
    return `<p style="margin:0;color:${ink.placeholder};font-size:16px;line-height:1.7;">Your update will appear here as you write.</p>`;
  }

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px;font-size:16px;line-height:1.75;color:${ink.body};">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

export function renderNewsletterEmailHtml(input: {
  subject: string;
  body: string;
  look?: NewsletterLook;
  daveSrc?: string;
  logoSrc?: string;
}): string {
  const look = parseNewsletterLook(input.look);
  const ink = LOOKS[look];
  const subject = escapeHtml(input.subject.trim() || "Weekly Newsletter");
  const bodyHtml = renderNewsletterBodyHtml(input.body, look);
  const daveSrc = input.daveSrc || daveImageSrc();
  const logoSrc = input.logoSrc || logoImageSrc(look);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
  <style>
    /* Dave's head is cut through the shirt on its right and bottom edges, and
       those edges sit on the header's corner. While he leans in, he is pushed
       a little past both edges so the cut stays hidden. Clients that drop this
       block show the final pose, which is the inline layout. */
    .dave-peek {
      transform-origin: 100% 100%;
      animation: davePeek 1.5s cubic-bezier(0.16, 0.84, 0.22, 1) 0.35s both;
    }
    @keyframes davePeek {
      0% { transform: translate3d(104%, 4%, 0) rotate(0deg); }
      55% { transform: translate3d(4%, 3%, 0) rotate(-8deg); }
      80% { transform: translate3d(4%, 3%, 0) rotate(-3deg); }
      100% { transform: none; }
    }
    @media (max-width: 420px) {
      .dave-cell { width: 132px !important; }
      .dave-peek { width: 132px !important; height: auto !important; }
      .elah-logo { width: 132px !important; height: auto !important; }
    }
    @media (prefers-reduced-motion: reduce) {
      .dave-peek { animation: none; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${ink.page};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${ink.page};">
    <tr>
      <td align="center" style="padding:36px 16px 48px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
          <tr>
            <td style="padding:0;background:${ink.card};border:1px solid ${ink.cardBorder};border-radius:14px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td height="168" style="height:168px;padding:0 12px 0 26px;vertical-align:middle;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;">
                    <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${ink.kicker};">Weekly Newsletter</div>
                    <img class="elah-logo" src="${escapeHtml(logoSrc)}" alt="ELAH" width="168" height="55" style="display:block;margin-top:14px;width:168px;height:55px;border:0;" />
                    <div style="margin-top:10px;font-size:13px;line-height:1.4;color:${ink.tagline};">APACT · a CAPTCHA for agents</div>
                  </td>
                  <td class="dave-cell" width="176" style="width:176px;padding:0;vertical-align:bottom;font-size:0;line-height:0;">
                    <img class="dave-peek" src="${escapeHtml(daveSrc)}" alt="Dave, the ELAH mascot, peeking in from the right" width="176" height="147" style="display:block;width:176px;height:147px;border:0;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td id="newsletter-body" style="padding:30px 0 8px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 0 0;border-top:1px solid ${ink.footerRule};font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;font-size:12px;line-height:1.65;color:${ink.footer};">
              Dave is watching the gate.<br />
              ELAH · APACT, a CAPTCHA for agents<br />
              <a href="${SITE_URL}" style="color:${ink.link};text-decoration:none;">elahsecurity.com</a>
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
