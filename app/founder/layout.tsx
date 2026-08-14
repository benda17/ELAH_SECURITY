import { FounderSidebar } from "@/components/founder/founder-sidebar";

export const dynamic = "force-dynamic";

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-base text-ink">
      <FounderSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
