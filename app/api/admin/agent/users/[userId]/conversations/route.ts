import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSecurityApi } from "@/lib/auth/api-guards";

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } },
) {
  const { error } = await requireSecurityApi();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  const conversations = await prisma.agentConversation.findMany({
    where: { userId: params.userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          id: true,
          role: true,
          content: true,
          toolName: true,
          createdAt: true,
        },
      },
      pendingActions: {
        where: { status: { in: ["pending", "executed", "cancelled"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          actionType: true,
          toolName: true,
          summary: true,
          status: true,
          createdAt: true,
          expiresAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    user,
    conversations: conversations.map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messages: c.messages,
      pendingActions: c.pendingActions,
    })),
  });
}
