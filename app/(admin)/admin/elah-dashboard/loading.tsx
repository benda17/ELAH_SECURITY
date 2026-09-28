import { PageShell } from "@/components/layout/page-shell";

function Block({ className }: { className: string }) {
  return <div className={`elah-panel animate-pulse bg-bg-subtle/40 ${className}`} />;
}

export default function ElahDashboardLoading() {
  return (
    <PageShell>
      <div role="status" aria-live="polite" className="space-y-6">
        <span className="sr-only">Loading the ELAH operational dashboard…</span>
        <div aria-hidden className="space-y-2">
          <div className="h-6 w-64 animate-pulse rounded bg-bg-subtle" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-bg-subtle/70" />
        </div>
        <Block className="h-14" />
        <div aria-hidden className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Block key={i} className="h-28" />
          ))}
        </div>
        <div aria-hidden className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <Block className="h-80 xl:col-span-3" />
          <Block className="h-80 xl:col-span-2" />
        </div>
        <Block className="h-72" />
      </div>
    </PageShell>
  );
}
