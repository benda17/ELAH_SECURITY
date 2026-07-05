import { NextRequest, NextResponse } from "next/server";
import { requireCustomerApi } from "@/lib/auth/api-guards";
import { clientIp, getSessionId } from "@/lib/auth/session";
import {
  handleAgentChat,
  listConversationMessages,
  listUserConversations,
} from "@/lib/agent/orchestrator";
import type { AgentChatRequestBody } from "@/lib/agent/types";
import { writeAgentEvent } from "@/lib/agent/logger";

export async function POST(req: NextRequest) {
  const { user, error } = await requireCustomerApi();
  if (error || !user) return error!;

  let body: AgentChatRequestBody;
  try {
    body = (await req.json()) as AgentChatRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message || message.length > 4000) {
    return NextResponse.json(
      { ok: false, error: "Message is required (max 4000 characters)." },
      { status: 400 },
    );
  }

  try {
    const result = await handleAgentChat({
      user,
      message,
      conversationId: body.conversationId,
      ipAddress: clientIp(),
      userAgent: req.headers.get("user-agent") ?? undefined,
      sessionCookieId: getSessionId(),
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/agent/chat] error", err);
    await writeAgentEvent({
      eventType: "agent_error",
      userId: user.id,
      sessionId: getSessionId(),
      conversationId: body.conversationId ?? null,
      userMessage: message,
      resultSummary: err instanceof Error ? err.message : "unknown_error",
    });
    return NextResponse.json(
      {
        ok: false,
        error: "The assistant encountered an error. Please try again.",
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireCustomerApi();
  if (error || !user) return error!;

  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (conversationId) {
    const messages = await listConversationMessages(user.id, conversationId);
    if (!messages) {
      return NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, conversationId, messages });
  }

  const conversations = await listUserConversations(user.id);
  return NextResponse.json({ ok: true, conversations });
}
