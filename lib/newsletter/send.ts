import { Resend } from "resend";
import { listNewsletterSubscribers } from "./repository";

const BATCH_SIZE = 100;
const DEFAULT_FROM = "ELAH <elahsecurity@gmail.com>";
const REPLY_TO = "elahsecurity@gmail.com";

export type NewsletterSendResult =
  | { ok: true; sent: number }
  | { ok: false; error: string; skipped?: boolean };

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toHtml(body: string): string {
  return `<p>${escapeHtml(body).replace(/\n/g, "<br />")}</p>`;
}

function fromAddress(): string {
  return process.env.RESEND_FROM?.trim() || DEFAULT_FROM;
}

export function resendConfigured(): { apiKey: boolean; from: boolean; fromValue: string } {
  return {
    apiKey: Boolean(process.env.RESEND_API_KEY?.trim()),
    from: Boolean(fromAddress()),
    fromValue: fromAddress(),
  };
}

export async function sendNewsletterToAll(input: {
  subject: string;
  body: string;
}): Promise<NewsletterSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY is not set. Add it to .env locally — no email was sent.",
    };
  }

  const from = fromAddress();

  const subscribers = await listNewsletterSubscribers();
  if (subscribers.length === 0) {
    return {
      ok: false,
      skipped: true,
      error: "No newsletter subscribers yet. Nothing was sent.",
    };
  }

  const resend = new Resend(apiKey);
  const html = toHtml(input.body);
  let sent = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const chunk = subscribers.slice(i, i + BATCH_SIZE);
    const { data, error } = await resend.batch.send(
      chunk.map((s) => ({
        from,
        replyTo: REPLY_TO,
        to: s.email,
        subject: input.subject,
        html,
        text: input.body,
      })),
    );

    if (error || !data) {
      const detail = error?.message?.trim() || "Resend rejected the request.";
      return {
        ok: false,
        error:
          sent > 0
            ? `Sent ${sent} then Resend failed: ${detail}`
            : `Resend send failed: ${detail}`,
      };
    }

    sent += data.data.length;
  }

  return { ok: true, sent };
}
