import { NextRequest, NextResponse } from "next/server";
import {
  allowedNewsletterOrigin,
  newsletterCorsHeaders,
} from "@/lib/newsletter/cors";
import { createNewsletterSubscriber } from "@/lib/newsletter/repository";

export const dynamic = "force-dynamic";

function json(
  body: unknown,
  status: number,
  origin: string | null,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: newsletterCorsHeaders(origin),
  });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !allowedNewsletterOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: newsletterCorsHeaders(origin),
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !allowedNewsletterOrigin(origin)) {
    return json({ ok: false, error: "origin not allowed" }, 403, origin);
  }

  let payload: { email?: unknown; consent?: unknown; source?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400, origin);
  }

  if (payload.consent !== true) {
    return json(
      {
        ok: false,
        error: "Consent is required. Check the box to subscribe.",
      },
      400,
      origin,
    );
  }

  const email = typeof payload.email === "string" ? payload.email : "";
  const source =
    typeof payload.source === "string" && payload.source.trim()
      ? payload.source.trim()
      : "hero";

  try {
    const result = await createNewsletterSubscriber({ email, source });
    return json(
      {
        ok: true,
        alreadySubscribed: !result.created,
      },
      200,
      origin,
    );
  } catch (err) {
    if (err instanceof Error && err.message === "invalid_email") {
      return json({ ok: false, error: "Enter a valid email address." }, 400, origin);
    }
    return json({ ok: false, error: "Could not save subscription." }, 500, origin);
  }
}
