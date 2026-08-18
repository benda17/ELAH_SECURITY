import * as Linking from "expo-linking";
import type { RoadmapTask } from "./types";
import { prettyStatus } from "./theme";

export function taskShareText(task: RoadmapTask) {
  const lines = [
    `ELAH · ${task.title}`,
    "",
    task.description?.trim() || "No description yet.",
    "",
    `Status: ${prettyStatus(task.status)} · Priority: ${task.priority}`,
    `Phase: ${task.phase}`,
  ];
  if (task.dueDate) {
    lines.push(`Due: ${new Date(task.dueDate).toLocaleDateString()}`);
  }
  if (task.blockingReason) {
    lines.push(`Blocked: ${task.blockingReason}`);
  }
  lines.push("", "Sent from ELAH Founder");
  return lines.join("\n");
}

export async function shareToWhatsApp(text: string) {
  const encoded = encodeURIComponent(text);
  const native = `whatsapp://send?text=${encoded}`;
  const web = `https://wa.me/?text=${encoded}`;
  const canOpen = await Linking.canOpenURL("whatsapp://send");
  await Linking.openURL(canOpen ? native : web);
}
