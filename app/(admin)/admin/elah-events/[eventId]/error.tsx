"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Empty } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export default function ElahEventDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageShell>
      <div role="alert">
        <Empty
          icon={<AlertTriangle className="size-5" />}
          title="Could not load this ELAH event"
          description={`Something went wrong while loading the event, its score snapshot, or its review data.${
            error.digest ? ` Reference: ${error.digest}` : ""
          }`}
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button type="button" size="sm" onClick={reset}>
                Try again
              </Button>
              <Link href="/admin/elah-events" className="text-sm text-ink-muted hover:text-accent-cyan">
                Back to all ELAH events
              </Link>
            </div>
          }
        />
      </div>
    </PageShell>
  );
}
