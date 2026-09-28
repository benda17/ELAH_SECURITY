import Link from "next/link";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { can } from "@/lib/elah/analyst/permissions";
import { parseAnalystFilters } from "@/lib/elah/analyst/filters";
import { requireAnalystPermission } from "@/lib/elah/analyst/rbac";
import { getDashboardSnapshot } from "@/lib/elah/analyst/snapshot";
import { getThresholdsState } from "@/lib/elah/analyst/thresholds";
import { withDefaultPreset } from "@/components/elah-analyst/dashboard/helpers";
import { DashboardLive } from "@/components/elah-analyst/dashboard/dashboard-live";
import {
  DASHBOARD_EMPTY_HREF,
  FilterChips,
  ModelBadges,
  PresetNav,
} from "@/components/elah-analyst/dashboard/dashboard-header";

export const dynamic = "force-dynamic";

const PAGE = "/admin/elah-dashboard";

export default async function ElahDashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireAnalystPermission("analyst:view", { page: PAGE });

  const filters = withDefaultPreset(parseAnalystFilters(searchParams));
  const now = new Date();
  const [snapshot, thresholdsState] = await Promise.all([
    getDashboardSnapshot(filters, { now }),
    getThresholdsState(),
  ]);
  const { extras } = snapshot;

  await writeAuditLog({
    actionType: "elah_dashboard_viewed",
    page: PAGE,
    toolOrFeatureUsed: "elah_dashboard",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      query: snapshot.query,
      total: snapshot.stats.total,
      truncated: snapshot.truncated,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="ELAH operational dashboard"
        description="ELAH scores genuine banking intent before a tool runs (0–1, higher = more genuine). Bank policy alone allows, denies, or asks for confirmation — ELAH never allows, blocks, or executes. Low scores are grouped for analyst review."
      />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PresetNav filters={snapshot.filters} />
        <div className="flex flex-wrap items-center gap-1.5">
          <ModelBadges modelVersions={extras.modelVersions} />
        </div>
      </div>
      <FilterChips filters={snapshot.filters} />
      <p className="text-xs text-ink-subtle">
        rules_v0 is uncalibrated: its scores and confidence are heuristic readings, not probabilities. Use them to
        prioritise review, not as evidence on their own.
      </p>

      <DashboardLive
        initialSnapshot={snapshot}
        canConfigure={can(user.role, "analyst:configure_thresholds")}
        thresholdMeta={{
          isDefault: thresholdsState.isDefault,
          updatedAt: thresholdsState.updatedAt,
          updatedByName: thresholdsState.updatedBy?.name ?? null,
        }}
        emptyAction={
          snapshot.filters.preset !== "30d" ? (
            <Link
              href={DASHBOARD_EMPTY_HREF}
              className="text-sm font-medium text-accent-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
            >
              Show the last 30 days
            </Link>
          ) : undefined
        }
      />
    </PageShell>
  );
}
