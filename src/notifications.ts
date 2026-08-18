import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import type { ReminderDigest, RoadmapTask } from "./types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const MORNING_ID = "elah-morning-brief";
const EVENING_ID = "elah-evening-wrap";

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function setBadge(count: number) {
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch {
    /* simulator */
  }
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function scheduleTaskReminder(task: RoadmapTask, when: Date) {
  if (when.getTime() <= Date.now() + 15_000) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "ELAH reminder",
      body: task.title,
      data: { taskId: task.id },
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  });
}

export async function scheduleDigestNotifications(digest: ReminderDigest) {
  const ok = await ensureNotificationPermission();
  if (!ok) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) =>
        [MORNING_ID, EVENING_ID].includes(String(n.identifier)) ||
        String(n.content.data?.kind) === "due-task",
      )
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const overdue = digest.summary.tasksOverdue;
  const dueToday = digest.summary.tasksDueToday;
  const follow = digest.summary.contactsNeedingFollowUp;
  const badge = overdue + dueToday + follow;
  await setBadge(badge);

  const morningBody =
    overdue || dueToday || follow
      ? `${overdue} overdue · ${dueToday} due today · ${follow} follow-ups`
      : "Inbox is clear. Pick one critical-path task.";

  await Notifications.scheduleNotificationAsync({
    identifier: MORNING_ID,
    content: {
      title: "ELAH morning brief",
      body: morningBody,
      sound: true,
      data: { kind: "brief" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  await Notifications.scheduleNotificationAsync({
    identifier: EVENING_ID,
    content: {
      title: "ELAH evening wrap",
      body:
        digest.summary.tasksBlocked > 0
          ? `${digest.summary.tasksBlocked} blocked tasks still open. Unblock one before tomorrow.`
          : "Close one loop before you stop: mark a task done or send a WhatsApp follow-up.",
      sound: true,
      data: { kind: "wrap" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 30,
    },
  });

  const dueItems = [...digest.tasks.dueToday, ...digest.tasks.dueThisWeek].slice(0, 12);
  const seen = new Set<string>();
  for (const task of dueItems) {
    if (!task.dueDate || seen.has(task.id)) continue;
    seen.add(task.id);
    const due = startOfDay(new Date(task.dueDate));
    due.setHours(9, 0, 0, 0);
    if (due.getTime() <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task due",
        body: task.title,
        data: { taskId: task.id, kind: "due-task" },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: due },
    });
  }
}

export function reminderWhen(kind: "1h" | "tonight" | "tomorrow"): Date {
  const d = new Date();
  if (kind === "1h") {
    d.setHours(d.getHours() + 1);
    return d;
  }
  if (kind === "tonight") {
    d.setHours(21, 0, 0, 0);
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    return d;
  }
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d;
}
