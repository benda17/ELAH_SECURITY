import {
  LayoutDashboard,
  Wallet,
  Send,
  ListChecks,
  FileText,
  CreditCard,
  Landmark,
  MessagesSquare,
  UserCog,
  LineChart,
  Bot,
} from "lucide-react";
import { requireCustomer } from "@/lib/auth/guards";
import { tierFromRole, ROLE_LABEL } from "@/lib/auth/roles";
import { ClientSidebar } from "@/components/layout/client-sidebar";
import { CustomerTopbarWrapper } from "@/components/layout/customer-topbar-wrapper";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCustomer();
  const tier = user.customerProfile?.tier ?? tierFromRole(user.role);

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
    { href: "/accounts", label: "Accounts", icon: <Wallet className="size-4" /> },
    { href: "/transfer", label: "Transfer Funds", icon: <Send className="size-4" /> },
    { href: "/transactions", label: "Transactions", icon: <ListChecks className="size-4" /> },
    { href: "/documents", label: "Documents", icon: <FileText className="size-4" /> },
    { href: "/cards", label: "Cards", icon: <CreditCard className="size-4" /> },
    { href: "/loans", label: "Loans", icon: <Landmark className="size-4" /> },
    { href: "/investments", label: "Investments", icon: <LineChart className="size-4" /> },
    { href: "/support", label: "Support", icon: <MessagesSquare className="size-4" /> },
    { href: "/assistant", label: "AI Assistant", icon: <Bot className="size-4" /> },
    { href: "/profile", label: "Profile", icon: <UserCog className="size-4" /> },
  ];

  return (
    <div className="flex min-h-screen">
      <ClientSidebar
        items={items}
        portalLabel={`Customer · ${ROLE_LABEL[user.role] ?? user.role}`}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <CustomerTopbarWrapper
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
            tier,
          }}
        />
        {children}
      </div>
    </div>
  );
}
