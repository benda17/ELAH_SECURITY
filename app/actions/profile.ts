"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCustomer } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/logging/logger";

const profileSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(5).max(40),
  address: z.string().min(5).max(160),
  employmentStatus: z.string().min(2).max(80),
});

export interface ProfileActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

export async function updateProfileAction(
  _prev: ProfileActionState | undefined,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireCustomer();
  const profile = user.customerProfile!;
  const parsed = profileSchema.safeParse({
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    employmentStatus: formData.get("employmentStatus"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;
  const changed: string[] = [];
  if (data.email !== profile.email) changed.push("email");
  if (data.phone !== profile.phone) changed.push("phone");
  if (data.address !== profile.address) changed.push("address");
  if (data.employmentStatus !== profile.employmentStatus)
    changed.push("employmentStatus");

  if (changed.length === 0) {
    return { ok: true, message: "No changes to save." };
  }

  await prisma.customerProfile.update({
    where: { id: profile.id },
    data,
  });

  const risk = changed.includes("email") || changed.includes("address") ? "high" : "medium";
  await writeAuditLog({
    actionType: "profile_updated",
    page: "/profile",
    toolOrFeatureUsed: "profile_form",
    targetResource: `customer_${profile.id.slice(-6)}`,
    riskLevel: risk,
    actionOutcome: "submitted",
    createdByAgent: false,
    inputDataSummary: { changedFields: changed }, // intentionally no values
  });

  revalidatePath("/profile");
  return { ok: true, message: `Updated: ${changed.join(", ")}.` };
}
