import { FounderSidebar } from "@/components/founder/founder-sidebar";

export const dynamic = "force-dynamic";

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-surface-base text-ink">
      <FounderSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 pt-[calc(3.75rem+env(safe-area-inset-top))] sm:p-6 lg:pt-6">
        {children}
      </main>
    </div>
  );
}
