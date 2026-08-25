import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { formatDate } from "@/lib/utils";
import { listIngestibleEvents } from "@/lib/elah/envelope";
import { FILTER_OPTIONS, listDemoCustomers } from "@/lib/elah/admin-events";

export const dynamic = "force-dynamic";

function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] ?? "").trim();
  return (value ?? "").trim();
}

function asSource(
  value: string,
): "ui" | "agent" | "system" | undefined {
  if (value === "ui" || value === "agent" || value === "system") return value;
  return undefined;
}

export default async function ElahEventsPage({
  searchParams,
}: {
  searchParams: {
    source?: string;
    actionType?: string;
    toolName?: string;
    outcome?: string;
    sessionId?: string;
    q?: string;
    quality?: string;
    userIdHash?: string;
  };
}) {
  await requireSecurity();

  const source = asSource(param(searchParams.source));
  const actionType = param(searchParams.actionType);
  const toolName = param(searchParams.toolName);
  const outcome = param(searchParams.outcome);
  const sessionId = param(searchParams.sessionId);
  const q = param(searchParams.q).toLowerCase();
  const qualityRaw = param(searchParams.quality);
  const quality =
    qualityRaw === "ok" || qualityRaw === "fail" ? qualityRaw : undefined;
  const userIdHashRaw = param(searchParams.userIdHash);
  const userIdHash = userIdHashRaw === "all" ? "" : userIdHashRaw;

  const [listed, demoCustomers] = await Promise.all([
    listIngestibleEvents({
      source,
      actionType: actionType && actionType !== "all" ? actionType : undefined,
      toolName: toolName && toolName !== "all" ? toolName : undefined,
      outcome: outcome && outcome !== "all" ? outcome : undefined,
      sessionId: sessionId || undefined,
      quality,
      userIdHash: userIdHash || undefined,
      take: q ? 200 : 100,
    }),
    listDemoCustomers(),
  ]);

  const events = q
    ? listed.filter((row) => {
        const hash = row.event.actor.userIdHash ?? "";
        return (
          row.event.eventId.toLowerCase().includes(q) ||
          hash.toLowerCase().includes(q)
        );
      })
    : listed;

  await writeAuditLog({
    actionType: "elah_events_viewed",
    page: "/admin/elah-events",
    toolOrFeatureUsed: "elah_event_viewer",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: {
      source: source ?? "all",
      actionType: actionType || "all",
      toolName: toolName || "all",
      outcome: outcome || "all",
      sessionId: sessionId || null,
      q: q || null,
      quality: quality ?? "all",
      userIdHash: userIdHash || null,
      resultCount: events.length,
    },
  });

  return (
    <PageShell>
      <SectionHeader
        title="ELAH events"
        description="Ingestible ElahEvent envelopes for security review. Page views are excluded. ELAH never allows, blocks, or executes — this list is observability only, with no scores."
      />

      <Card>
        <form className="mb-4 flex flex-wrap items-center gap-3" method="get">
          <input
            name="q"
            defaultValue={param(searchParams.q)}
            placeholder="Search eventId or userIdHash"
            className="block min-w-[220px] flex-1 rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-cyan focus:outline-none"
          />
          <select
            name="userIdHash"
            defaultValue={userIdHash || "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All demo users</option>
            {demoCustomers.map((customer) => (
              <option key={customer.userIdHash} value={customer.userIdHash}>
                {customer.name} · {customer.roleLabel}
              </option>
            ))}
          </select>
          <select
            name="source"
            defaultValue={source ?? "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All sources</option>
            {FILTER_OPTIONS.sources.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            name="actionType"
            defaultValue={actionType || "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All actions</option>
            {FILTER_OPTIONS.actionTypes.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select
            name="toolName"
            defaultValue={toolName || "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All tools</option>
            {FILTER_OPTIONS.toolNames.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            name="outcome"
            defaultValue={outcome || "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All outcomes</option>
            {FILTER_OPTIONS.outcomes.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select
            name="quality"
            defaultValue={quality ?? "all"}
            className="rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink focus:outline-none"
          >
            <option value="all">All quality</option>
            <option value="ok">Quality ok</option>
            <option value="fail">Quality fail</option>
          </select>
          <input
            name="sessionId"
            defaultValue={sessionId}
            placeholder="sessionId"
            className="w-[180px] rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent-cyan focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg border border-line-strong bg-bg-elevated px-3 py-2 text-sm text-ink hover:bg-bg-subtle"
          >
            Apply
          </button>
        </form>

        {events.length === 0 ? (
          <Empty
            icon={<ScanSearch className="size-5" />}
            title="No ElahEvents match"
            description="Ingestible events appear after customer UI actions or assistant tool calls. Admin page views are operational logs, not ElahEvents."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Time</TH>
                <TH>Action</TH>
                <TH>Source</TH>
                <TH>Customer said</TH>
                <TH>Outcome</TH>
                <TH>Tool</TH>
                <TH>Quality</TH>
                <TH>Event</TH>
              </TR>
            </THead>
            <tbody>
              {events.map((row) => (
                <TR key={`${row.auditLogId}-${row.event.eventId}`} className="hover:bg-bg-subtle/40">
                  <TD className="whitespace-nowrap text-ink-muted">
                    <Link
                      href={`/admin/elah-events/${row.event.eventId}`}
                      className="hover:text-accent-cyan"
                    >
                      {formatDate(row.event.occurredAt)}
                    </Link>
                  </TD>
                  <TD>
                    <Link
                      href={`/admin/elah-events/${row.event.eventId}`}
                      className="font-medium text-ink hover:text-accent-cyan"
                    >
                      {row.event.actionType.replaceAll("_", " ")}
                    </Link>
                  </TD>
                  <TD>
                    <Badge
                      variant={
                        row.event.source === "agent" ? "role-agent" : "info"
                      }
                    >
                      {row.event.source}
                    </Badge>
                  </TD>
                  <TD className="max-w-[220px] truncate text-ink-muted">
                    {row.event.conversation?.utterance ?? "—"}
                  </TD>
                  <TD>{row.event.outcome.replaceAll("_", " ")}</TD>
                  <TD className="font-mono text-xs text-ink-muted">
                    {row.event.action.toolName ?? "—"}
                  </TD>
                  <TD>
                    <Badge
                      variant={
                        row.quality.ok ? "status-approved" : "status-rejected"
                      }
                    >
                      {row.quality.ok ? "ok" : "fail"}
                    </Badge>
                  </TD>
                  <TD>
                    <Link
                      href={`/admin/elah-events/${row.event.eventId}`}
                      className="font-mono text-xs text-accent-cyan hover:underline"
                      title={row.event.eventId}
                    >
                      {row.event.eventId.slice(0, 8)}
                    </Link>
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
