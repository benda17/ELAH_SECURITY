import { PageShell } from "@/components/layout/page-shell";

function Block({ className }: { className: string }) {
  return <div className={`elah-panel animate-pulse ${className}`} />;
}

export default function Loading() {
  return (
    <PageShell>
      <div role="status" aria-live="polite" className="space-y-6">
        <span className="sr-only">Loading ELAH event…</span>
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse rounded bg-bg-elevated" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-bg-elevated" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-5 w-20 animate-pulse rounded-full bg-bg-elevated" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Block className="h-56" />
            <Block className="h-72" />
            <Block className="h-80" />
            <Block className="h-96" />
          </div>
          <div className="space-y-6">
            <Block className="h-[32rem]" />
            <Block className="h-64" />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
