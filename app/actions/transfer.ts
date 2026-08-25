"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth/guards";
import { writeAuditLog, writeRiskEvent } from "@/lib/logging/logger";
import { detectInjectionLike, riskForTransfer } from "@/lib/risk/heuristics";
import { tierPolicy } from "@/lib/auth/roles";

const schema = z.object({
  sourceAccountId: z.string().min(1),
  recipientName: z.string().min(2).max(80),
  recipientAccount: z.string().min(3).max(40),
  amount: z.coerce.number().positive().max(1_000_000),
  memo: z.string().max(280).optional(),
  intent: z.string().max(280).optional(),
  confirmed: z.string().optional(),
});

/** Envelope-safe transfer args: never persist full account or raw recipient name. */
function sanitizedTransferSummary(input: {
  sourceAccountMasked: string;
  recipientAccount: string;
  amount: number;
  memoPresent: boolean;
  extra?: Record<string, unknown>;
}): Record<string, unknown> {
  const compact = input.recipientAccount.replace(/\s/g, "");
  return {
    sourceAccount: input.sourceAccountMasked,
    recipient: "[recipient_redacted]",
    recipientAccountMasked: compact.slice(-4),
    amount: input.amount,
    memoPresent: input.memoPresent,
    ...input.extra,
  };
}

export interface TransferState {
  ok?: boolean;
  error?: string;
  warning?: string;
  blocked?: boolean;
  pendingApproval?: boolean;
}

export async function submitTransferAction(
  _prev: TransferState | undefined,
  formData: FormData,
): Promise<TransferState> {
  const user = await requireCustomer();
  const profile = user.customerProfile!;
  const tier = profile.tier as "basic" | "premium" | "vip";
  const policy = tierPolicy(tier);

  const parsed = schema.safeParse({
    sourceAccountId: formData.get("sourceAccountId"),
    recipientName: formData.get("recipientName"),
    recipientAccount: formData.get("recipientAccount"),
    amount: formData.get("amount"),
    memo: formData.get("memo") || undefined,
    intent: formData.get("intent") || undefined,
    confirmed: formData.get("confirmed") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }
  const { sourceAccountId, recipientName, recipientAccount, amount, memo, intent, confirmed } =
    parsed.data;

  const source = await prisma.bankAccount.findFirst({
    where: { id: sourceAccountId, customerProfileId: profile.id },
  });
  if (!source) {
    return { error: "Source account not found." };
  }

  // Log the draft creation (or confirmation review) every time the form is submitted.
  await writeAuditLog({
    actionType: confirmed ? "transfer_confirmation_viewed" : "transfer_draft_created",
    page: "/transfer",
    toolOrFeatureUsed: "fund_transfer_form",
    targetResource: `account_${source.id.slice(-6)}`,
    amount,
    riskLevel: "low",
    actionOutcome: confirmed ? "viewed" : "drafted",
    createdByAgent: false,
    userIntent: intent,
    inputDataSummary: sanitizedTransferSummary({
      sourceAccountMasked: source.accountNumberMasked,
      recipientAccount,
      amount,
      memoPresent: !!memo,
    }),
  });

  // Confirmation step required.
  if (!confirmed) {
    return { ok: true };
  }

  const computedRisk = riskForTransfer(amount, policy.approvalRequiredAbove);
  const memoInjection = detectInjectionLike(memo);
  const overLimit = amount > policy.perTransferLimit;
  const requiresApproval = amount >= policy.approvalRequiredAbove;

  // Block if over absolute tier limit.
  if (overLimit) {
    const log = await writeAuditLog({
      actionType: "transfer_blocked",
      page: "/transfer",
      toolOrFeatureUsed: "fund_transfer_form",
      targetResource: `account_${source.id.slice(-6)}`,
      amount,
      riskLevel: "critical",
      actionOutcome: "blocked",
      requiresApproval: true,
      approvalStatus: "not_required",
      createdByAgent: false,
      reasonForFlagging: `Amount ${amount} exceeds tier ${tier} per-transfer limit of ${policy.perTransferLimit}.`,
      userIntent: intent,
      inputDataSummary: sanitizedTransferSummary({
        sourceAccountMasked: source.accountNumberMasked,
        recipientAccount,
        amount,
        memoPresent: !!memo,
      }),
    });
    await writeRiskEvent({
      severity: "critical",
      eventType: "tier_limit_violation",
      actorType: "customer",
      actorId: user.id,
      customerProfileId: profile.id,
      relatedAuditLogIds: [log.id],
      reasonForFlagging: `Customer attempted transfer of ${amount} exceeding ${tier} tier per-transfer limit.`,
      detectedPattern: "tier_limit_exceeded",
    });
    return {
      blocked: true,
      error: `Transfers above ${policy.perTransferLimit.toLocaleString()} are not permitted on your ${tier} tier.`,
    };
  }

  // Flag injection-like memos.
  if (memoInjection.matched) {
    const log = await writeAuditLog({
      actionType: "transfer_blocked",
      page: "/transfer",
      toolOrFeatureUsed: "fund_transfer_form",
      targetResource: `account_${source.id.slice(-6)}`,
      amount,
      riskLevel: "high",
      actionOutcome: "blocked",
      createdByAgent: false,
      reasonForFlagging:
        "Memo contains suspicious instruction-like text (simulated prompt-injection detection).",
      userIntent: intent,
      inputDataSummary: sanitizedTransferSummary({
        sourceAccountMasked: source.accountNumberMasked,
        recipientAccount,
        amount,
        memoPresent: true,
        extra: { injectionPatterns: memoInjection.patterns },
      }),
    });
    await writeRiskEvent({
      severity: "high",
      eventType: "prompt_injection_detected",
      actorType: "customer",
      actorId: user.id,
      customerProfileId: profile.id,
      relatedAuditLogIds: [log.id],
      reasonForFlagging:
        "Transfer memo contained instruction-like text that ELAH-style detection would flag.",
      detectedPattern: "transfer_memo_injection",
    });
    return {
      blocked: true,
      error:
        "We blocked this transfer because the memo contains instruction-like text that should not appear in normal transfers. Please remove it and try again.",
    };
  }

  // Build transfer reference; "execute" if within limits & no approval needed.
  const reference = `TR-${profile.id.slice(-4)}-${Date.now().toString().slice(-6)}`;

  if (requiresApproval) {
    // Create approval request; do not move funds.
    const approval = await prisma.approvalRequest.create({
      data: {
        requestType: "transfer",
        targetResourceId: reference,
        customerProfileId: profile.id,
        requestedByActorType: "customer",
        requestedByActorId: user.id,
        assignedManagerId: profile.assignedManagerId,
        amount,
        riskLevel: computedRisk,
        status: "pending",
      },
    });
    await writeAuditLog({
      actionType: "transfer_submitted",
      page: "/transfer",
      toolOrFeatureUsed: "fund_transfer_form",
      targetResource: reference,
      amount,
      riskLevel: computedRisk,
      requiresApproval: true,
      approvalStatus: "pending",
      actionOutcome: "submitted",
      createdByAgent: false,
      userIntent: intent,
      inputDataSummary: sanitizedTransferSummary({
        sourceAccountMasked: source.accountNumberMasked,
        recipientAccount,
        amount,
        memoPresent: !!memo,
      }),
    });
    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { ok: true, pendingApproval: true };
  }

  // Within limits and no approval: simulate posting the transaction.
  await prisma.$transaction(async (tx) => {
    await tx.bankAccount.update({
      where: { id: source.id },
      data: {
        currentBalance: source.currentBalance - amount,
        availableBalance: source.availableBalance - amount,
      },
    });
    await tx.transaction.create({
      data: {
        accountId: source.id,
        customerProfileId: profile.id,
        description: memo ? `Transfer to ${recipientName} — ${memo}` : `Transfer to ${recipientName}`,
        merchantOrRecipient: recipientName,
        amount,
        direction: "debit",
        category: "transfer",
        status: "posted",
        reference,
      },
    });
  });

  await writeAuditLog({
    actionType: "transfer_submitted",
    page: "/transfer",
    toolOrFeatureUsed: "fund_transfer_form",
    targetResource: reference,
    amount,
    riskLevel: computedRisk,
    approvalStatus: "not_required",
    actionOutcome: "submitted",
    createdByAgent: false,
    userIntent: intent,
    inputDataSummary: sanitizedTransferSummary({
      sourceAccountMasked: source.accountNumberMasked,
      recipientAccount,
      amount,
      memoPresent: !!memo,
    }),
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  redirect("/transactions?just_submitted=" + reference);
}
