import Link from "next/link";
import { Tags } from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import {
  listPackNames,
  listRecords,
  packsAvailable,
} from "@/lib/elah/dataset/label-store";

export const dynamic = "force-dynamic";

const LIST_CAP = 80;

export default async function ElahLabelingPage({
  searchParams,
}: {
  searchParams: { pack?: string };
}) {
  await requireSecurity();

  const usingPacks = packsAvailable();
  const packNames = listPackNames();
  const packFilter = (searchParams.pack ?? "").trim();
  const allRecords = listRecords();
  const filtered = packFilter
    ? allRecords.filter((row) => row.pack === packFilter)
    : allRecords;
  const records = filtered.slice(0, LIST_CAP);

  await writeAuditLog({
    actionType: "elah_labeling_viewed",
    page: "/admin/elah-labeling",
    toolOrFeatureUsed: "elah_labeling",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      resultCount: records.length,
      usingPacks,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="ELAH labeling"
        description="Security-admin gold labels for Phase 4. ELAH never allows, blocks, or executes. This is not a customer page and does not change bank policy. See labeling guidelines in the Phase 4 docs pack."
      />

      {packNames.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/admin/elah-labeling"
            className={`rounded-md px-2 py-1 text-xs ${
              !packFilter
                ? "bg-accent-cyan/15 text-accent-cyan"
                : "text-ink-muted hover:text-accent-cyan"
            }`}
          >
            all ({allRecords.length})
          </Link>
          {packNames.map((name) => (
            <Link
              key={name}
              href={`/admin/elah-labeling?pack=${encodeURIComponent(name)}`}
              className={`rounded-md px-2 py-1 text-xs ${
                packFilter === name
                  ? "bg-accent-cyan/15 text-accent-cyan"
                  : "text-ink-muted hover:text-accent-cyan"
              }`}
            >
              {name}
            </Link>
          ))}
        </div>
      ) : null}

      <Card>
        {records.length === 0 ? (
          <Empty
            icon={<Tags className="size-5" />}
            title="No labeling records"
            description="Gold labels and sample rows will appear here. Generate Phase 4 packs to replace the sample queue."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Record</TH>
                <TH>Pack</TH>
                <TH>Intent</TH>
                <TH>Confidence</TH>
                <TH>Notes</TH>
              </TR>
            </THead>
            <tbody>
              {filtered.length > LIST_CAP ? (
                <TR>
                  <TD colSpan={5} className="text-xs text-ink-muted">
                    Showing {records.length} of {filtered.length}. Filter by pack
                    to narrow the queue.
                  </TD>
                </TR>
              ) : null}
              {records.map((row) => (
                <TR key={row.recordId} className="hover:bg-bg-subtle/40">
                  <TD>
                    <Link
                      href={`/admin/elah-labeling/${encodeURIComponent(row.recordId)}`}
                      className="font-mono text-xs text-accent-cyan hover:underline"
                    >
                      {row.recordId}
                    </Link>
                  </TD>
                  <TD>
                    <Badge variant="info">{row.pack}</Badge>
                  </TD>
                  <TD className="font-mono text-xs text-ink">
                    {row.intentLabel ?? "—"}
                  </TD>
                  <TD>
                    {row.annotatorConfidence ? (
                      <Badge
                        variant={
                          row.annotatorConfidence === "high"
                            ? "status-approved"
                            : row.annotatorConfidence === "low"
                              ? "warning"
                              : "default"
                        }
                      >
                        {row.annotatorConfidence}
                      </Badge>
                    ) : (
                      <span className="text-xs text-ink-subtle">—</span>
                    )}
                  </TD>
                  <TD>
                    {row.hasNotes ? (
                      <Badge variant="info">yes</Badge>
                    ) : (
                      <span className="text-xs text-ink-subtle">no</span>
                    )}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </PageShell>
  );
}
