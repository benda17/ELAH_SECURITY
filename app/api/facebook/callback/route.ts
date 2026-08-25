import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeFacebookCode,
  exchangeForLongLivedUserToken,
  saveFacebookConnection,
} from "@/lib/founder/content-engine/facebook";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");
  const expected = cookies().get("facebook_oauth_state")?.value;

  const back = new URL("/founder/content-engine", url.origin);

  if (err) {
    back.searchParams.set(
      "facebook",
      `error:${encodeURIComponent(errDesc || err)}`,
    );
    return NextResponse.redirect(back);
  }
  if (!code || !state || !expected || state !== expected) {
    back.searchParams.set("facebook", "error:invalid_state");
    return NextResponse.redirect(back);
  }

  try {
    const shortLived = await exchangeFacebookCode(code);
    const longLived = await exchangeForLongLivedUserToken(shortLived.accessToken);
    const { selectedPageId } = await saveFacebookConnection({
      userAccessToken: longLived.accessToken,
      expiresIn: longLived.expiresIn,
    });
    cookies().delete("facebook_oauth_state");
    back.searchParams.set(
      "facebook",
      selectedPageId ? "connected" : "connected_no_page",
    );
    return NextResponse.redirect(back);
  } catch (e) {
    const message = e instanceof Error ? e.message : "token_failed";
    back.searchParams.set("facebook", `error:${encodeURIComponent(message.slice(0, 160))}`);
    return NextResponse.redirect(back);
  }
}
