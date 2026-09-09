import { getGmailSendStatus, sendGmailMessage } from "@/lib/newsletter/gmail";

const FOUNDER_INBOX =
  process.env.DEMO_REQUEST_NOTIFY_EMAIL?.trim() || "elahsecurity@gmail.com";

export async function notifyFounderOfDemoRequest(input: {
  name: string;
  email: string;
  company: string;
  role: string;
  goal: string;
}): Promise<void> {
  const status = await getGmailSendStatus();
  if (!status.ready) return;

  const lines = [
    `${input.name} at ${input.company} requested a demo.`,
    `Email: ${input.email}`,
    input.role.trim() ? `Role: ${input.role.trim()}` : null,
    input.goal.trim() ? `Cover: ${input.goal.trim()}` : null,
    "",
    "Open /founder/demo-requests to reply and book a time.",
  ].filter(Boolean) as string[];

  const text = lines.join("\n");
  try {
    await sendGmailMessage({
      to: FOUNDER_INBOX,
      replyTo: input.email,
      subject: `Demo request: ${input.company}`,
      text,
      html: `<pre style="font-family:ui-sans-serif,system-ui,sans-serif;white-space:pre-wrap">${text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</pre>`,
    });
  } catch {
    // Request is already stored. Founder inbox is the source of truth.
  }
}
