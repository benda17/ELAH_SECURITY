function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-bg-elevated ${className}`} />;
}

/** Placeholder for the ELAH events list while filters / rows load. */
export function ListSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading ELAH events…</span>
      <div aria-hidden className="space-y-2">
        <Bar className="h-6 w-40" />
        <Bar className="h-4 w-full max-w-2xl" />
      </div>
      <div aria-hidden className="elah-panel space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Bar key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Bar key={i} className="h-24 w-full" />
          ))}
        </div>
        <Bar className="h-9 w-32" />
      </div>
      <div aria-hidden className="elah-panel space-y-3 p-6">
        <Bar className="h-4 w-48" />
        {Array.from({ length: 8 }, (_, i) => (
          <Bar key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
