export default function FounderLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-md bg-surface-border/70" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-surface-border/50" />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-surface-border/40" />
        <div className="h-24 animate-pulse rounded-xl bg-surface-border/40" />
        <div className="h-24 animate-pulse rounded-xl bg-surface-border/40" />
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-surface-border/30" />
    </div>
  );
}
