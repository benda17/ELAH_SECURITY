import { BankingSidebar } from "@/components/banking/banking-sidebar";

export default function BankingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-base text-ink">
      <BankingSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
