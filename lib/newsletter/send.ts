import { listNewsletterSubscribers } from "./repository";
import { renderNewsletterEmailHtml } from "./template";
import { getGmailSendStatus, sendGmailToMany } from "./gmail";

export type NewsletterSendResult =
  | { ok: true; sent: number }
  | { ok: false; error: string; skipped?: boolean; sent?: number };

/** @deprecated Use getGmailSendStatus — kept so existing imports keep compiling during the switch. */
export async function resendConfigured() {
  const status = await getGmailSendStatus();
  return {
    apiKey: status.ready,
    from: Boolean(status.fromValue),
    fromValue: status.fromValue,
  };
}

export async function sendNewsletterToAll(input: {
  subject: string;
  body: string;
}): Promise<NewsletterSendResult> {
  const status = await getGmailSendStatus();
  if (!status.ready) {
    return {
      ok: false,
      error: status.oauthApp
        ? "Gmail is not connected. Open Settings and click Connect Gmail — no email was sent."
        : "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then Connect Gmail in Settings — no email was sent.",
    };
  }

  const subscribers = await listNewsletterSubscribers();
  if (subscribers.length === 0) {
    return {
      ok: false,
      skipped: true,
      error: "No newsletter subscribers yet. Nothing was sent.",
    };
  }

  const html = renderNewsletterEmailHtml(input);
  const result = await sendGmailToMany(
    subscribers.map((s) => s.email),
    { subject: input.subject, text: input.body, html },
  );

  if (result.error) {
    return { ok: false, error: result.error, sent: result.sent };
  }

  return { ok: true, sent: result.sent };
}
