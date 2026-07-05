import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSecurityApi } from "@/lib/auth/api-guards";

export async function GET(req: NextRequest) {
  const { error } = await requireSecurityApi();
  if (error) return error;

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 200);
  const userId = req.nextUrl.searchParams.get("userId") ?? undefined;

  const rows = await prisma.agentConversation.findMany({
    where: userId ? { userId } : undefined,
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { messages: true, pendingActions: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    count: rows.length,
    conversations: rows.map((c) => ({
      id: c.id,
      userId: c.userId,
      userName: c.user.name,
      userEmail: c.user.email,
      title: c.title,
      status: c.status,
      messageCount: c._count.messages,
      pendingActionCount: c._count.pendingActions,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
}
