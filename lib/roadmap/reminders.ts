import { isTaskOverdue } from "./metrics";
import type { RoadmapContactRecord, RoadmapTaskRecord } from "./types";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function asDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.round(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000,
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export type ReminderTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  phase: string;
  owner: string | null;
  dueDate: string | null;
  daysOverdue?: number;
};

export type ReminderContact = {
  id: string;
  name: string;
  organization: string | null;
  outreachStatus: string;
  nextFollowUp: string | null;
  daysOverdue?: number;
};

export function buildReminderDigest(
  tasks: RoadmapTaskRecord[],
  contacts: RoadmapContactRecord[],
  now = new Date(),
) {
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const open = tasks.filter((t) => t.status !== "done");
  const dueToday = open.filter((t) => {
    const due = asDate(t.dueDate);
    return due ? isSameDay(due, now) : false;
  });
  const overdue = open.filter((t) => isTaskOverdue(t, now));
  const dueThisWeek = open.filter((t) => {
    const due = asDate(t.dueDate);
    return due ? due >= startOfDay(now) && due <= weekEnd : false;
  });
  const blocked = open.filter((t) => t.status === "blocked");

  const mapTask = (t: RoadmapTaskRecord): ReminderTask => {
    const due = asDate(t.dueDate);
    return {
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      phase: t.phase,
      owner: t.owner,
      dueDate: due?.toISOString() ?? null,
      daysOverdue: due && isTaskOverdue(t, now) ? daysBetween(due, now) : undefined,
    };
  };

  const followUpToday = contacts.filter((c) => {
    const d = asDate(c.nextFollowUp);
    return d ? isSameDay(d, now) : false;
  });
  const overdueFollowUp = contacts.filter((c) => {
    const d = asDate(c.nextFollowUp);
    return d ? startOfDay(d) < startOfDay(now) : false;
  });

  const mapContact = (c: RoadmapContactRecord): ReminderContact => {
    const d = asDate(c.nextFollowUp);
    return {
      id: c.id,
      name: c.name,
      organization: c.organization,
      outreachStatus: c.outreachStatus,
      nextFollowUp: d?.toISOString() ?? null,
      daysOverdue: d && startOfDay(d) < startOfDay(now) ? daysBetween(d, now) : undefined,
    };
  };

  return {
    generatedAt: now.toISOString(),
    tasks: {
      dueToday: dueToday.map(mapTask),
      overdue: overdue.map(mapTask),
      dueThisWeek: dueThisWeek.map(mapTask),
      blocked: blocked.map(mapTask),
    },
    contacts: {
      followUpToday: followUpToday.map(mapContact),
      overdueFollowUp: overdueFollowUp.map(mapContact),
    },
    summary: {
      tasksDueToday: dueToday.length,
      tasksOverdue: overdue.length,
      tasksBlocked: blocked.length,
      contactsNeedingFollowUp: overdueFollowUp.length + followUpToday.length,
    },
  };
}
