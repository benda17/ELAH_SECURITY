import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { CUSTOMER_ROLES, ROLES } from "@/lib/auth/roles";

export default async function RootPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (CUSTOMER_ROLES.includes(user.role as (typeof CUSTOMER_ROLES)[number])) {
    redirect("/dashboard");
  }
  if (user.role === ROLES.BANK_MANAGER) redirect("/manager/dashboard");
  if (user.role === ROLES.SECURITY_REVIEWER) redirect("/admin/security-dashboard");
  if (user.role === ROLES.AI_AGENT) redirect("/admin/agent-simulation-logs");
  redirect("/login");
}
