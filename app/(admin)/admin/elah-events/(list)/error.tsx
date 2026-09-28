"use client";

import Link from "next/link";
import { AlertOctagon, RotateCcw } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function ElahEventsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageShell className="px-4 sm:px-6">
      <div role="alert" className="elah-panel flex flex-col items-center p-10 text-center">
        <div className="mb-3 rounded-full border border-accent-rose/40 bg-accent-rose/10 p-3 text-accent-rose">
          <AlertOctagon aria-hidden className="size-5" />
        </div>
        <h2 className="text-base font-semibold text-ink">ELAH events could not be loaded</h2>
        <p className="mt-1 max-w-md text-sm text-ink-muted">
          The event store or score data did not respond. No data was changed. Try again, or reset the
          filters if a specific query keeps failing.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-ink-subtle">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button type="button" variant="secondary" onClick={reset}>
            <RotateCcw aria-hidden className="size-4" />
            Try again
          </Button>
          <Link
            href="/admin/elah-events"
            className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-ink-muted hover:bg-bg-elevated hover:text-ink"
          >
            Reset filters
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
