"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "./topbar";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Overview", subtitle: "Customer portal" },
  "/accounts": { title: "Accounts", subtitle: "Customer portal" },
  "/transfer": { title: "Transfer Funds", subtitle: "Customer portal" },
  "/transactions": { title: "Transactions", subtitle: "Customer portal" },
  "/documents": { title: "Documents", subtitle: "Customer portal" },
  "/cards": { title: "Cards", subtitle: "Customer portal" },
  "/loans": { title: "Loans", subtitle: "Customer portal" },
  "/support": { title: "Support", subtitle: "Customer portal" },
  "/profile": { title: "Profile", subtitle: "Customer portal" },
  "/investments": { title: "Investments", subtitle: "Customer portal" },
  "/assistant": { title: "AI Assistant", subtitle: "Customer portal" },
};

export function CustomerTopbarWrapper({
  user,
}: {
  user: { name: string; email: string; role: string; tier?: string | null };
}) {
  const pathname = usePathname();
  const meta = TITLES[pathname] ?? { title: "Customer", subtitle: "Customer portal" };
  return (
    <Topbar
      userName={user.name}
      email={user.email}
      role={user.role}
      tier={user.tier ?? undefined}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
    />
  );
}
