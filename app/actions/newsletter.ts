"use server";

import { sendNewsletterToAll } from "@/lib/newsletter/send";

export type NewsletterSendState = {
  error?: string;
  sent?: number;
  skipped?: boolean;
};

export async function sendNewsletterAction(
  _prev: NewsletterSendState | undefined,
  formData: FormData,
): Promise<NewsletterSendState> {
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!subject || !body) {
    return { error: "Subject and body are required." };
  }

  const result = await sendNewsletterToAll({ subject, body });
  if (!result.ok) {
    return { error: result.error, skipped: result.skipped, sent: 0 };
  }

  return { sent: result.sent };
}
