"use server";

import { cookies } from "next/headers";
import { FOUNDER_COOKIE, isFounderSessionToken } from "@/lib/founder-session";
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
  const token = cookies().get(FOUNDER_COOKIE)?.value;
  if (!(await isFounderSessionToken(token))) {
    return { error: "Sign in to the Founder platform to publish a newsletter." };
  }

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();

  if (!subject || !body) {
    return { error: "Subject and body are required." };
  }

  if (confirm !== "publish") {
    return { error: "Confirm publish to send this email." };
  }

  const result = await sendNewsletterToAll({ subject, body });
  if (!result.ok) {
    return { error: result.error, skipped: result.skipped, sent: result.sent ?? 0 };
  }

  return { sent: result.sent };
}
