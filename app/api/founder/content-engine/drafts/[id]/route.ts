import { NextRequest, NextResponse } from "next/server";
import {
  markDraftPostedToTwitterManually,
  markDraftPublishedManually,
  publishDraftById,
  publishDraftToFacebookById,
  publishDraftToTwitterById,
} from "@/lib/founder/content-engine/generator";
import { updateDraftBody, updateDraftStatus } from "@/lib/founder/content-engine/repository";

function withTwitter(
  result: { ok: boolean; error?: string; twitterError?: string; postId?: string },
) {
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  if (result.twitterError) {
    return NextResponse.json({
      ok: true,
      postId: result.postId,
      twitterError: result.twitterError,
    });
  }
  return NextResponse.json({ ok: true, postId: result.postId });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = (await req.json()) as {
    action?:
      | "approve"
      | "reject"
      | "edit"
      | "publish"
      | "mark_published"
      | "publish_facebook"
      | "publish_twitter"
      | "mark_twitter_posted";
    text?: string;
    title?: string;
    notes?: string;
    alsoTwitter?: boolean;
  };

  if (body.action === "edit" && body.text) {
    await updateDraftBody(params.id, body.text, body.title);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "approve") {
    await updateDraftStatus(params.id, "approved", body.notes);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reject") {
    await updateDraftStatus(params.id, "rejected", body.notes);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "publish") {
    return withTwitter(
      await publishDraftById(params.id, { alsoTwitter: Boolean(body.alsoTwitter) }),
    );
  }

  if (body.action === "mark_published") {
    return withTwitter(
      await markDraftPublishedManually(params.id, {
        alsoTwitter: Boolean(body.alsoTwitter),
      }),
    );
  }

  if (body.action === "publish_facebook") {
    return withTwitter(
      await publishDraftToFacebookById(params.id, {
        alsoTwitter: Boolean(body.alsoTwitter),
      }),
    );
  }

  if (body.action === "publish_twitter") {
    const result = await publishDraftToTwitterById(params.id);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, postId: result.postId });
  }

  if (body.action === "mark_twitter_posted") {
    const result = await markDraftPostedToTwitterManually(params.id);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, postId: result.postId });
  }

  return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
}
