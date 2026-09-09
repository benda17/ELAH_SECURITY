import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildGmailAuthorizeUrl, gmailOAuthConfigured } from "@/lib/newsletter/gmail";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!gmailOAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first." },
      { status: 400 },
    );
  }

  const state = crypto.randomUUID();
  cookies().set({
    name: "gmail_oauth_state",
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(buildGmailAuthorizeUrl(state));
}
