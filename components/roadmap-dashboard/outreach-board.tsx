"use client";

import { useMemo, useState } from "react";
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
  const [typeFilter, setTypeFilter] = useState("all");

  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(contacts.map((c) => c.contactType))).sort();
    return types;
  }, [contacts]);

  const visible = useMemo(() => {
    if (typeFilter === "all") return contacts;
    return contacts.filter((c) => c.contactType === typeFilter);
  }, [contacts, typeFilter]);

  async function updateStatus(id: string, outreachStatus: string) {
    await fetch("/api/founder/roadmap/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, outreachStatus }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[10px] uppercase tracking-wider text-ink-muted" htmlFor="outreach-type-filter">
          Type
        </label>
        <select
          id="outreach-type-filter"
          className="rounded border border-surface-border bg-surface-raised px-2 py-1 text-xs"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <span className="text-xs text-ink-dim">
          {visible.length} of {contacts.length}
        </span>
      </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-surface-border text-[10px] uppercase tracking-wider text-ink-muted">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Organization</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Firm page</th>
            <th className="px-3 py-2">Stage</th>
            <th className="px-3 py-2">Follow-up</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((c) => {
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
                <td className="px-3 py-2 text-xs">
                  {c.linkedInUrl ? (
                    <a
                      href={c.linkedInUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent-cyan underline-offset-2 hover:underline"
                    >
                      Open
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
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
    </div>
  );
}
