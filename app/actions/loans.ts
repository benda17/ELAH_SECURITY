"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth/guards";
import { writeAuditLog, writeRiskEvent } from "@/lib/logging/logger";
import { tierPolicy } from "@/lib/auth/roles";
import { detectInjectionLike } from "@/lib/risk/heuristics";

const loanSchema = z.object({
  amount: z.coerce.number().positive().max(10_000_000),
  purpose: z.string().min(2).max(140),
  termMonths: z.coerce.number().int().min(6).max(360),
  incomeRange: z.string().min(1).max(40),
  notes: z.string().max(500).optional(),
});

export interface LoanActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  blocked?: boolean;
}

export async function submitLoanAction(
  _prev: LoanActionState | undefined,
  formData: FormData,
): Promise<LoanActionState> {
  const user = await requireCustomer();
  const profile = user.customerProfile!;
  const tier = profile.tier as "basic" | "premium" | "vip";
  const policy = tierPolicy(tier);

  const parsed = loanSchema.safeParse({
    amount: formData.get("amount"),
    purpose: formData.get("purpose"),
    termMonths: formData.get("termMonths"),
    incomeRange: formData.get("incomeRange"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }
  const { amount, purpose, termMonths, incomeRange, notes } = parsed.data;

  const overLimit = amount > policy.loanRequestLimit;
  const injection = detectInjectionLike(notes ?? "");
  const requiresApproval = true; // All loan requests require manager approval per README.
  const risk =
    amount >= policy.loanRequestLimit * 0.75
      ? "high"
      : amount >= policy.loanRequestLimit / 4
        ? "medium"
        : "low";

  if (overLimit) {
    const log = await writeAuditLog({
      actionType: "loan_request_blocked",
      page: "/loans",
      toolOrFeatureUsed: "loan_request_form",
      amount,
      riskLevel: "high",
      actionOutcome: "blocked",
      reasonForFlagging: `Requested amount ${amount} exceeds ${tier} tier loan ceiling of ${policy.loanRequestLimit}.`,
      inputDataSummary: { purpose, termMonths, incomeRange },
    });
    await writeRiskEvent({
      severity: "high",
      eventType: "tier_limit_violation",
      actorType: "customer",
      actorId: user.id,
      customerProfileId: profile.id,
      relatedAuditLogIds: [log.id],
      reasonForFlagging:
        "Customer attempted loan request exceeding tier ceiling.",
      detectedPattern: "loan_tier_limit_exceeded",
    });
    return {
      blocked: true,
      error: `Loan requests above ${policy.loanRequestLimit.toLocaleString()} are not permitted on your tier.`,
    };
  }

  const created = await prisma.loanRequest.create({
    data: {
      customerProfileId: profile.id,
      requestedAmount: amount,
      purpose,
      termMonths,
      incomeRange,
      employmentStatus: profile.employmentStatus,
      requiresManagerApproval: requiresApproval,
      status: "submitted",
      riskLevel: risk,
      notes,
      containsInjectionTest: injection.matched,
    },
  });

  await prisma.approvalRequest.create({
    data: {
      requestType: "loan",
      targetResourceId: created.id,
      customerProfileId: profile.id,
      requestedByActorType: "customer",
      requestedByActorId: user.id,
      assignedManagerId: profile.assignedManagerId,
      amount,
      riskLevel: risk,
      status: "pending",
    },
  });

  const log = await writeAuditLog({
    actionType: "loan_request_submitted",
    page: "/loans",
    toolOrFeatureUsed: "loan_request_form",
    targetResource: `loan_${created.id.slice(-6)}`,
    amount,
    riskLevel: risk,
    requiresApproval: true,
    approvalStatus: "pending",
    actionOutcome: "submitted",
    inputDataSummary: { purpose, termMonths, incomeRange },
    reasonForFlagging: injection.matched
      ? "Loan request notes contain instruction-like text (simulation prompt-injection detection)."
      : null,
  });

  if (injection.matched) {
    await writeRiskEvent({
      severity: "medium",
      eventType: "prompt_injection_detected",
      actorType: "customer",
      actorId: user.id,
      customerProfileId: profile.id,
      relatedAuditLogIds: [log.id],
      reasonForFlagging:
        "Customer-supplied loan notes match prompt-injection heuristics.",
      detectedPattern: "loan_note_injection",
    });
  }

  revalidatePath("/loans");
  return {
    ok: true,
    message: `Loan request loan_${created.id.slice(-6)} submitted for manager review.`,
  };
}
