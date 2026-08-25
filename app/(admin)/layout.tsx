import {
  ShieldCheck,
  ListChecks,
  Bot,
  Bug,
  AlertOctagon,
  MessagesSquare,
  ScanSearch,
} from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { ClientSidebar } from "@/components/layout/client-sidebar";
import { AdminTopbarWrapper } from "@/components/layout/admin-topbar-wrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSecurity();

  const items = [
    {
      href: "/admin/security-dashboard",
      label: "Security dashboard",
      icon: <ShieldCheck className="size-4" />,
    },
    {
      href: "/admin/action-logs",
      label: "Action logs",
      icon: <ListChecks className="size-4" />,
    },
    {
      href: "/admin/elah-events",
      label: "ELAH events",
      icon: <ScanSearch className="size-4" />,
    },
    {
      href: "/admin/assistant-logs",
      label: "Assistant logs",
      icon: <MessagesSquare className="size-4" />,
    },
    {
      href: "/admin/agent-simulation-logs",
      label: "Agent simulation",
      icon: <Bot className="size-4" />,
    },
    {
      href: "/admin/prompt-injection-scenarios",
      label: "Injection scenarios",
      icon: <Bug className="size-4" />,
    },
    {
      href: "/admin/risk-events",
      label: "Risk events",
      icon: <AlertOctagon className="size-4" />,
    },
  ];

  return (
    <div className="flex min-h-screen">
      <ClientSidebar items={items} portalLabel="Security portal" />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbarWrapper
          user={{ name: user.name, email: user.email, role: user.role }}
        />
        {children}
      </div>
    </div>
  );
}
