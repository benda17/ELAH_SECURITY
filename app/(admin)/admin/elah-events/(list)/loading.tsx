import { PageShell } from "@/components/layout/page-shell";
import { ListSkeleton } from "@/components/elah-analyst/list/list-skeleton";

export default function ElahEventsLoading() {
  return (
    <PageShell className="px-4 sm:px-6">
      <ListSkeleton />
    </PageShell>
  );
}
