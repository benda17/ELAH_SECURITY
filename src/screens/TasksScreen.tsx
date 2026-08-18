import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, prettyStatus, priorityColors, STATUSES } from "../theme";
import { useStore } from "../store";
import { PHASE_ORDER, shortPhase } from "../phases";
import type { RoadmapTask, TaskPriority, TaskStatus } from "../types";

const PRIORITIES: Array<TaskPriority | "all"> = ["all", "critical", "high", "medium", "low"];

export function TasksScreen({
  onOpenTask,
}: {
  onOpenTask: (task: RoadmapTask) => void;
}) {
  const { data, loading, refresh, touch } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<TaskStatus | "open" | "all">("open");
  const [phase, setPhase] = useState("all");
  const [priority, setPriority] = useState<TaskPriority | "all">("all");
  const [pulling, setPulling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      touch();
    }, [touch]),
  );

  const phasesPresent = useMemo(() => {
    const seen = new Set((data?.tasks ?? []).map((t) => t.phase));
    const ordered = PHASE_ORDER.filter((p) => seen.has(p));
    const extras = [...seen].filter((p) => !PHASE_ORDER.includes(p as (typeof PHASE_ORDER)[number])).sort();
    return [...ordered, ...extras];
  }, [data?.tasks]);

  const filtered = useMemo(() => {
    let list = data?.tasks ?? [];
    if (status === "open") list = list.filter((t) => t.status !== "done");
    else if (status !== "all") list = list.filter((t) => t.status === status);
    if (phase !== "all") list = list.filter((t) => t.phase === phase);
    if (priority !== "all") list = list.filter((t) => t.priority === priority);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(needle) ||
          t.phase.toLowerCase().includes(needle) ||
          t.workstream.toLowerCase().includes(needle) ||
          t.id.toLowerCase().includes(needle) ||
          (t.description ?? "").toLowerCase().includes(needle) ||
          (t.owner ?? "").toLowerCase().includes(needle),
      );
    }
    return list;
  }, [data?.tasks, q, status, phase, priority]);

  async function onRefresh() {
    setPulling(true);
    try {
      await refresh({ silent: true });
    } finally {
      setPulling(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Tasks</Text>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search title, phase, owner…"
        placeholderTextColor={colors.dim}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <Text style={styles.filterLabel}>Status</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label="To do" active={status === "open"} onPress={() => setStatus("open")} />
        <Chip label="All" active={status === "all"} onPress={() => setStatus("all")} />
        {STATUSES.map((s) => (
          <Chip
            key={s}
            label={prettyStatus(s)}
            active={status === s}
            onPress={() => setStatus(s)}
          />
        ))}
      </ScrollView>

      <Text style={styles.filterLabel}>Phase</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label="All phases" active={phase === "all"} onPress={() => setPhase("all")} />
        {phasesPresent.map((p) => (
          <Chip
            key={p}
            label={shortPhase(p)}
            active={phase === p}
            onPress={() => setPhase(p)}
          />
        ))}
      </ScrollView>

      <Text style={styles.filterLabel}>Priority</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {PRIORITIES.map((p) => (
          <Chip
            key={p}
            label={p === "all" ? "All" : p}
            active={priority === p}
            onPress={() => setPriority(p)}
          />
        ))}
      </ScrollView>

      <Text style={styles.count}>
        {filtered.length} of {data?.tasks.length ?? 0} tasks
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={pulling || (loading && !data)}
            onRefresh={() => void onRefresh()}
            tintColor={colors.cyan}
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => onOpenTask(item)} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: priorityColors[item.priority] ?? colors.dim }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {prettyStatus(item.status)} · {shortPhase(item.phase)} · {item.workstream}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {data ? "No tasks match these filters. Clear a chip or pull to refresh." : "Loading tasks…"}
          </Text>
        }
      />
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 16 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginBottom: 12 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.raised,
    color: colors.ink,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  filterLabel: {
    color: colors.dim,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginTop: 6,
    marginBottom: 6,
  },
  chipRow: { gap: 6, paddingBottom: 4, paddingRight: 16 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  chipText: { color: colors.muted, fontSize: 12, textTransform: "capitalize" },
  chipTextOn: { color: "#041018", fontWeight: "800" },
  count: { color: colors.dim, fontSize: 11, marginTop: 4, marginBottom: 6 },
  row: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowTitle: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  empty: { color: colors.dim, marginTop: 24, textAlign: "center", paddingHorizontal: 16 },
});
