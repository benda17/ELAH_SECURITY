import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildFacebookAuthorizeUrl,
  facebookOAuthConfigured,
} from "@/lib/founder/content-engine/facebook";

export async function GET() {
  if (!facebookOAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET first (Meta Developer → App → Settings).",
      },
      { status: 400 },
    );
  }

  const state = crypto.randomUUID();
  cookies().set({
    name: "facebook_oauth_state",
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(buildFacebookAuthorizeUrl(state));
}
