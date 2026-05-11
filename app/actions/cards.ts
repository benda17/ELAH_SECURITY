"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/logging/logger";

const cardSchema = z.object({
  accountId: z.string().min(1),
  cardType: z.enum(["debit", "credit"]),
  requestReason: z.enum(["new", "replacement", "lost", "stolen"]),
});

export interface CardActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

export async function submitCardRequestAction(
  _prev: CardActionState | undefined,
  formData: FormData,
): Promise<CardActionState> {
  const user = await requireCustomer();
  const profile = user.customerProfile!;

  const parsed = cardSchema.safeParse({
    accountId: formData.get("accountId"),
    cardType: formData.get("cardType"),
    requestReason: formData.get("requestReason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }
  const { accountId, cardType, requestReason } = parsed.data;

  const account = await prisma.bankAccount.findFirst({
    where: { id: accountId, customerProfileId: profile.id },
  });
  if (!account) return { error: "Account not found." };

  const requiresApproval = requestReason === "stolen";

  const created = await prisma.cardRequest.create({
    data: {
      customerProfileId: profile.id,
      accountId,
      cardType,
      requestReason,
      deliveryAddressSummary: profile.address.slice(0, 80),
      requiresApproval,
      status: "submitted",
    },
  });

  await writeAuditLog({
    actionType: "card_request_submitted",
    page: "/cards",
    toolOrFeatureUsed: "card_request_form",
    targetResource: `card_${created.id.slice(-6)}`,
    riskLevel:
      requestReason === "stolen" || requestReason === "lost" ? "high" : "medium",
    requiresApproval,
    approvalStatus: requiresApproval ? "pending" : "not_required",
    actionOutcome: "submitted",
    inputDataSummary: {
      cardType,
      requestReason,
      accountMasked: account.accountNumberMasked,
    },
  });

  revalidatePath("/cards");
  return {
    ok: true,
    message: `Card request submitted. Reference card_${created.id.slice(-6)}.`,
  };
}
