import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { api } from "../api";
import { colors, prettyStatus, STATUSES } from "../theme";
import { useStore } from "../store";
import { shareToWhatsApp, taskShareText } from "../whatsapp";
import { reminderWhen, scheduleTaskReminder } from "../notifications";
import type { RoadmapTask, TaskStatus } from "../types";

export function TaskDetailScreen({
  taskId,
  onBack,
}: {
  taskId: string;
  onBack: () => void;
}) {
  const { data, completeTask, setStatus } = useStore();
  const seeded = data?.tasks.find((t) => t.id === taskId) ?? null;
  const [task, setTask] = useState<RoadmapTask | null>(seeded);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api<{ task: RoadmapTask }>(`/api/founder/roadmap/tasks/${taskId}`)
      .then((res) => {
        if (!cancelled) setTask(res.task);
      })
      .catch(() => {
        /* keep seeded */
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  if (!task) {
    return (
      <View style={styles.wrap}>
        <Pressable onPress={onBack}><Text style={styles.back}>← Back</Text></Pressable>
        <Text style={styles.body}>Task not found.</Text>
      </View>
    );
  }

  const current = task;

  async function onComplete() {
    setBusy(true);
    try {
      const updated = await completeTask(current.id);
      setTask(updated);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setBusy(false);
    }
  }

  async function onStatus(next: TaskStatus) {
    const updated = await setStatus(current.id, next);
    setTask(updated);
  }

  async function onWhatsApp() {
    try {
      await shareToWhatsApp(taskShareText(current));
    } catch {
      Alert.alert("WhatsApp", "Could not open WhatsApp. Is it installed?");
    }
  }

  async function onRemind(kind: "1h" | "tonight" | "tomorrow") {
    const when = reminderWhen(kind);
    await scheduleTaskReminder(current, when);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Reminder set", when.toLocaleString());
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 48 }}>
      <Pressable onPress={onBack}><Text style={styles.back}>← Tasks</Text></Pressable>
      <Text style={styles.title}>{current.title}</Text>
      <Text style={styles.meta}>
        {prettyStatus(current.status)} · {current.priority}
        {current.isCriticalPath ? " · critical path" : ""}
      </Text>

      <View style={styles.actions}>
        {current.status !== "done" && (
          <Pressable disabled={busy} onPress={() => void onComplete()} style={styles.primary}>
            <Text style={styles.primaryText}>Complete</Text>
          </Pressable>
        )}
        <Pressable onPress={() => void onWhatsApp()} style={styles.secondary}>
          <Text style={styles.secondaryText}>WhatsApp</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Description</Text>
      <Text style={styles.body}>
        {current.description?.trim() || "No description yet."}
      </Text>

      {current.notes ? (
        <>
          <Text style={styles.section}>Notes</Text>
          <Text style={styles.body}>{current.notes}</Text>
        </>
      ) : null}

      {current.blockingReason ? (
        <>
          <Text style={[styles.section, { color: colors.rose }]}>Blocker</Text>
          <Text style={styles.body}>{current.blockingReason}</Text>
        </>
      ) : null}

      <Text style={styles.section}>Remind me</Text>
      <View style={styles.row}>
        <Chip label="In 1 hour" onPress={() => void onRemind("1h")} />
        <Chip label="Tonight 9pm" onPress={() => void onRemind("tonight")} />
        <Chip label="Tomorrow 8am" onPress={() => void onRemind("tomorrow")} />
      </View>

      <Text style={styles.section}>Status</Text>
      <View style={styles.row}>
        {STATUSES.map((s) => (
          <Chip
            key={s}
            label={prettyStatus(s)}
            active={current.status === s}
            onPress={() => void onStatus(s)}
          />
        ))}
      </View>

      <Text style={styles.section}>Details</Text>
      <Text style={styles.meta}>Phase: {current.phase}</Text>
      <Text style={styles.meta}>Workstream: {current.workstream}</Text>
      <Text style={styles.meta}>Owner: {current.owner ?? "Unassigned"}</Text>
      <Text style={styles.meta}>
        Due: {current.dueDate ? new Date(current.dueDate).toLocaleDateString() : "—"}
      </Text>
    </ScrollView>
  );
}

function Chip({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  back: { color: colors.cyan, fontWeight: "700", marginBottom: 12 },
  title: { color: colors.ink, fontSize: 24, fontWeight: "800", lineHeight: 30 },
  meta: { color: colors.muted, marginTop: 4 },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  primary: {
    backgroundColor: colors.emerald,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryText: { color: "#04210f", fontWeight: "800" },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryText: { color: colors.ink, fontWeight: "700" },
  section: {
    color: colors.cyan,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 8,
  },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipOn: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  chipText: { color: colors.muted, fontSize: 12, textTransform: "capitalize" },
  chipTextOn: { color: "#041018", fontWeight: "800" },
});
