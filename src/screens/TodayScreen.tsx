import { useCallback, useMemo } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { colors, prettyStatus, priorityColors } from "../theme";
import { useStore } from "../store";
import type { RoadmapTask } from "../types";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isDueToday(task: RoadmapTask) {
  if (!task.dueDate || task.status === "done") return false;
  return startOfDay(new Date(task.dueDate)).getTime() === startOfDay(new Date()).getTime();
}

function isOverdue(task: RoadmapTask) {
  if (!task.dueDate || task.status === "done") return false;
  return startOfDay(new Date(task.dueDate)) < startOfDay(new Date());
}

export function TodayScreen({
  onOpenTask,
}: {
  onOpenTask: (task: RoadmapTask) => void;
}) {
  const { data, reminders, loading, refresh, completeTask, error, touch } = useStore();
  const tasks = data?.tasks ?? [];

  useFocusEffect(
    useCallback(() => {
      touch();
    }, [touch]),
  );

  const focus = data?.metrics.topPriorities[0] ?? null;
  const overdue = useMemo(() => tasks.filter(isOverdue).slice(0, 8), [tasks]);
  const dueToday = useMemo(() => tasks.filter(isDueToday).slice(0, 8), [tasks]);
  const blocked = useMemo(
    () => tasks.filter((t) => t.status === "blocked").slice(0, 6),
    [tasks],
  );

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void refresh()}
          tintColor={colors.cyan}
        />
      }
    >
      <Text style={styles.kicker}>Today</Text>
      <Text style={styles.title}>Founder brief</Text>
      <Text style={styles.phase}>{data?.metrics.currentPhase ?? "Loading…"}</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.stats}>
        <Stat n={reminders?.summary.tasksOverdue ?? data?.metrics.tasksOverdue ?? 0} label="Overdue" tone={colors.rose} />
        <Stat n={reminders?.summary.tasksDueToday ?? dueToday.length} label="Due today" tone={colors.amber} />
        <Stat n={data?.metrics.tasksBlocked ?? 0} label="Blocked" tone={colors.violet} />
        <Stat n={`${data?.metrics.overallCompletion ?? 0}%`} label="MVP" tone={colors.cyan} />
      </View>

      {focus && (
        <View style={styles.focus}>
          <Text style={styles.focusLabel}>Focus now</Text>
          <Pressable onPress={() => onOpenTask(focus)}>
            <Text style={styles.focusTitle}>{focus.title}</Text>
            <Text style={styles.meta}>
              {prettyStatus(focus.status)} · {focus.priority}
              {focus.isCriticalPath ? " · critical path" : ""}
            </Text>
          </Pressable>
          {focus.status !== "done" && (
            <Pressable
              style={styles.doneBtn}
              onPress={() => {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                void completeTask(focus.id);
              }}
            >
              <Text style={styles.doneText}>Mark done</Text>
            </Pressable>
          )}
        </View>
      )}

      <Section title="Overdue" items={overdue} onOpenTask={onOpenTask} empty="Nothing overdue." />
      <Section title="Due today" items={dueToday} onOpenTask={onOpenTask} empty="No due dates today." />
      <Section title="Blocked" items={blocked} onOpenTask={onOpenTask} empty="No blockers." />
    </ScrollView>
  );
}

function Stat({
  n,
  label,
  tone,
}: {
  n: number | string;
  label: string;
  tone: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statN, { color: tone }]}>{n}</Text>
      <Text style={styles.statL}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  items,
  onOpenTask,
  empty,
}: {
  title: string;
  items: RoadmapTask[];
  onOpenTask: (task: RoadmapTask) => void;
  empty: string;
}) {
  return (
    <View style={{ marginTop: 22 }}>
      <Text style={styles.section}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : (
        items.map((t) => (
          <Pressable key={t.id} onPress={() => onOpenTask(t)} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: priorityColors[t.priority] ?? colors.dim }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t.title}</Text>
              <Text style={styles.meta}>{prettyStatus(t.status)} · {t.workstream}</Text>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 48 },
  kicker: { color: colors.cyan, fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", fontWeight: "700" },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: 4 },
  phase: { color: colors.muted, marginTop: 4, marginBottom: 16 },
  error: { color: colors.rose, marginBottom: 8 },
  stats: { flexDirection: "row", gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  statN: { fontSize: 18, fontWeight: "800" },
  statL: { color: colors.dim, fontSize: 10, marginTop: 2, textTransform: "uppercase" },
  focus: {
    marginTop: 18,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    padding: 16,
    gap: 8,
  },
  focusLabel: { color: colors.cyan, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: "700" },
  focusTitle: { color: colors.ink, fontSize: 18, fontWeight: "700", lineHeight: 24 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  doneBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.emerald,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 6,
  },
  doneText: { color: "#04210f", fontWeight: "800" },
  section: { color: colors.ink, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  empty: { color: colors.dim },
  row: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    alignItems: "flex-start",
  },
  rowTitle: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
