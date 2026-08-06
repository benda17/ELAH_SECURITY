import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildLinkedInAuthorizeUrl, linkedInOAuthConfigured } from "@/lib/founder/content-engine/linkedin";

export async function GET() {
  if (!linkedInOAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET first." },
      { status: 400 },
    );
  }

  const state = crypto.randomUUID();
  cookies().set({
    name: "linkedin_oauth_state",
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(buildLinkedInAuthorizeUrl(state));
}
