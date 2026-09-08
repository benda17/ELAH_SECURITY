import { Resend } from "resend";
import { resendConfigured } from "@/lib/newsletter/send";

const FOUNDER_INBOX =
  process.env.DEMO_REQUEST_NOTIFY_EMAIL?.trim() || "elahsecurity@gmail.com";

export async function notifyFounderOfDemoRequest(input: {
  name: string;
  email: string;
  company: string;
  role: string;
  goal: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return;

  const from = resendConfigured().fromValue;
  const resend = new Resend(apiKey);
  const lines = [
    `${input.name} at ${input.company} requested a demo.`,
    `Email: ${input.email}`,
    input.role.trim() ? `Role: ${input.role.trim()}` : null,
    input.goal.trim() ? `Cover: ${input.goal.trim()}` : null,
    "",
    "Open /founder/demo-requests to reply and book a time.",
  ].filter(Boolean);

  try {
    await resend.emails.send({
      from,
      to: FOUNDER_INBOX,
      replyTo: input.email,
      subject: `Demo request: ${input.company}`,
      text: lines.join("\n"),
    });
  } catch {
    // Request is already stored. Founder inbox is the source of truth.
  }
}
