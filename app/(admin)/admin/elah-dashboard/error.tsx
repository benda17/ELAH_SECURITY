"use client";

import { AlertTriangle } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";

export default function ElahDashboardError({
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
          icon={<AlertTriangle className="size-5 text-accent-amber" aria-hidden />}
          title="The ELAH dashboard could not load"
          description={`The analyst data could not be read right now. No data was changed.${
            error.digest ? ` Reference: ${error.digest}.` : ""
          }`}
          action={
            <Button type="button" variant="secondary" size="sm" onClick={reset}>
              Try again
            </Button>
          }
        />
      </div>
    </PageShell>
  );
}
