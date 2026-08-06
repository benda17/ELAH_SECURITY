"use client";

import { useRouter } from "next/navigation";
import type { RoadmapContactRecord } from "@/lib/roadmap/types";
import { cn } from "@/lib/utils";

const STAGES = [
  "research",
  "identified",
  "ready_to_contact",
  "contacted",
  "replied",
  "meeting_scheduled",
  "follow_up",
  "interested",
  "pilot_discussion",
  "due_diligence",
  "passed",
  "closed",
] as const;

export function OutreachBoard({ contacts }: { contacts: RoadmapContactRecord[] }) {
  const router = useRouter();
  const now = new Date();

  async function updateStatus(id: string, outreachStatus: string) {
    await fetch("/api/founder/roadmap/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, outreachStatus }),
    });
    router.refresh();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-surface-border text-[10px] uppercase tracking-wider text-ink-muted">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Organization</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Stage</th>
            <th className="px-3 py-2">Follow-up</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => {
            const overdue =
              c.nextFollowUp && new Date(c.nextFollowUp) < now;
            return (
              <tr
                key={c.id}
                className={cn(
                  "border-b border-surface-border/40",
                  overdue && "bg-accent-rose/5",
                )}
              >
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2 text-ink-muted">{c.organization ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{c.contactType.replace(/_/g, " ")}</td>
                <td className="px-3 py-2">
                  <select
                    className="rounded border border-surface-border bg-surface-raised text-xs"
                    value={c.outreachStatus}
                    onChange={(e) => void updateStatus(c.id, e.target.value)}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-xs",
                    overdue ? "text-accent-rose" : "text-ink-muted",
                  )}
                >
                  {c.nextFollowUp
                    ? new Date(c.nextFollowUp).toLocaleDateString()
                    : "—"}
                  {overdue && " (overdue)"}
                </td>
                <td className="max-w-xs truncate px-3 py-2 text-xs text-ink-dim">
                  {c.notes ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
