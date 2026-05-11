"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "./topbar";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/admin/security-dashboard": {
    title: "Security overview",
    subtitle: "Security portal",
  },
  "/admin/action-logs": { title: "Action logs", subtitle: "Security portal" },
  "/admin/agent-simulation-logs": {
    title: "Agent simulation logs",
    subtitle: "Security portal",
  },
  "/admin/prompt-injection-scenarios": {
    title: "Prompt-injection scenarios",
    subtitle: "Security portal",
  },
  "/admin/risk-events": { title: "Risk events", subtitle: "Security portal" },
};

export function AdminTopbarWrapper({
  user,
}: {
  user: { name: string; email: string; role: string };
}) {
  const pathname = usePathname();
  const meta = TITLES[pathname] ?? {
    title: "Security",
    subtitle: "Security portal",
  };
  return (
    <Topbar
      userName={user.name}
      email={user.email}
      role={user.role}
      pageTitle={meta.title}
      pageSubtitle={meta.subtitle}
    />
  );
}
