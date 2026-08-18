import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, prettyStatus, statusColors } from "../theme";
import { useStore } from "../store";
import { PHASE_ORDER, shortPhase } from "../phases";
import type { RoadmapTask } from "../types";

const DAY = 86_400_000;

function ms(value: string | null | undefined) {
  if (!value) return null;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function taskRange(task: RoadmapTask) {
  const start = ms(task.startDate) ?? ms(task.dueDate) ?? ms(task.createdAt);
  const end =
    ms(task.dueDate) ??
    ms(task.completedAt) ??
    (start != null ? start + 14 * DAY : null);
  if (start == null || end == null) return null;
  return { start, end: Math.max(end, start + DAY) };
}

function pct(value: number, min: number, span: number) {
  if (span <= 0) return 0;
  return Math.max(0, Math.min(100, ((value - min) / span) * 100));
}

function formatTick(value: number) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function GanttScreen({
  onOpenTask,
}: {
  onOpenTask: (task: RoadmapTask) => void;
}) {
  const { data, loading, refresh, touch } = useStore();
  const tasks = data?.tasks ?? [];
  const milestones = data?.milestones ?? [];
  const [openPhase, setOpenPhase] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      touch();
    }, [touch]),
  );

  const { rows, ticks, hasDates } = useMemo(() => {
    const ranges = tasks.map(taskRange).filter((r): r is { start: number; end: number } => r != null);
    const min = ranges.length ? Math.min(...ranges.map((r) => r.start)) : Date.now();
    const max = ranges.length ? Math.max(...ranges.map((r) => r.end)) : min + 90 * DAY;
    const span = Math.max(DAY, max - min);

    const phaseRows = PHASE_ORDER.map((phase) => {
      const phaseTasks = tasks.filter((t) => t.phase === phase);
      const done = phaseTasks.filter((t) => t.status === "done").length;
      const active = phaseTasks.filter(
        (t) => t.status === "in_progress" || t.status === "in_review",
      ).length;
      const blocked = phaseTasks.filter((t) => t.status === "blocked").length;
      const rest = Math.max(0, phaseTasks.length - done - active - blocked);
      const completion =
        phaseTasks.length > 0 ? Math.round((done / phaseTasks.length) * 100) : 0;
      const dated = phaseTasks
        .map((t) => ({ task: t, range: taskRange(t) }))
        .filter((x): x is { task: RoadmapTask; range: { start: number; end: number } } => x.range != null);
      const start = dated.length ? Math.min(...dated.map((x) => x.range.start)) : min;
      const end = dated.length ? Math.max(...dated.map((x) => x.range.end)) : min + DAY;
      return {
        phase,
        phaseTasks,
        done,
        active,
        blocked,
        rest,
        completion,
        total: phaseTasks.length,
        left: pct(start, min, span),
        width: Math.max(4, pct(end, min, span) - pct(start, min, span)),
        dated,
      };
    }).filter((r) => r.total > 0);

    const tickCount = 4;
    const axis = Array.from({ length: tickCount }, (_, i) => min + (span * i) / (tickCount - 1));
    return { rows: phaseRows, ticks: axis, hasDates: ranges.length > 0 };
  }, [tasks]);

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={colors.cyan} />
      }
    >
      <Text style={styles.kicker}>Roadmap</Text>
      <Text style={styles.title}>Gantt</Text>
      <Text style={styles.sub}>
        {data?.metrics.overallCompletion ?? 0}% MVP · {data?.metrics.currentPhase ?? ""}
      </Text>

      {hasDates && (
        <View style={styles.axis}>
          {ticks.map((tick) => (
            <Text key={tick} style={styles.axisTick}>
              {formatTick(tick)}
            </Text>
          ))}
        </View>
      )}

      {rows.map((row) => {
        const expanded = openPhase === row.phase;
        const segs = [
          { n: row.done, color: colors.emerald },
          { n: row.active, color: colors.amber },
          { n: row.blocked, color: colors.rose },
          { n: row.rest, color: "#243044" },
        ].filter((s) => s.n > 0);
        return (
          <View key={row.phase} style={styles.row}>
            <Pressable onPress={() => setOpenPhase(expanded ? null : row.phase)}>
              <View style={styles.rowHead}>
                <Text style={styles.phase}>{shortPhase(row.phase)}</Text>
                <Text style={styles.pct}>{row.completion}%</Text>
              </View>
              <View style={styles.lane}>
                <View
                  style={[
                    styles.ganttBar,
                    { left: `${row.left}%`, width: `${row.width}%` },
                  ]}
                >
                  {segs.map((s, i) => (
                    <View key={i} style={[styles.seg, { flex: s.n, backgroundColor: s.color }]} />
                  ))}
                </View>
              </View>
              <Text style={styles.meta} numberOfLines={1}>
                {row.phase.replace(/^Phase \d+ — /, "")} · {row.done}/{row.total}
              </Text>
            </Pressable>
            {expanded &&
              row.phaseTasks.slice(0, 16).map((t) => {
                const range = taskRange(t);
                const min = ticks[0] ?? Date.now();
                const span = (ticks[ticks.length - 1] ?? min) - min || DAY;
                const left = range ? pct(range.start, min, span) : 0;
                const width = range ? Math.max(6, pct(range.end, min, span) - left) : 100;
                return (
                  <Pressable key={t.id} onPress={() => onOpenTask(t)} style={styles.task}>
                    <Text style={styles.taskTitle} numberOfLines={2}>
                      {t.title}
                    </Text>
                    <View style={styles.lane}>
                      <View
                        style={[
                          styles.taskBar,
                          {
                            left: `${left}%`,
                            width: `${width}%`,
                            backgroundColor: statusColors[t.status] ?? colors.cyan,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.meta}>{prettyStatus(t.status)}</Text>
                  </Pressable>
                );
              })}
          </View>
        );
      })}

      <View style={styles.legend}>
        <Legend color={colors.emerald} label="Done" />
        <Legend color={colors.amber} label="Active" />
        <Legend color={colors.rose} label="Blocked" />
        <Legend color={colors.dim} label="Open" />
      </View>

      {milestones.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={styles.section}>Milestones</Text>
          {milestones.map((m) => (
            <View key={m.id} style={styles.ms}>
              <Text style={styles.taskTitle}>{m.title}</Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.seg,
                    { flex: Math.max(1, m.completionPercentage), backgroundColor: colors.cyan },
                  ]}
                />
                <View
                  style={[
                    styles.seg,
                    { flex: Math.max(1, 100 - m.completionPercentage), backgroundColor: "#1a2233" },
                  ]}
                />
              </View>
              <Text style={styles.meta}>
                {m.completionPercentage}%
                {m.targetDate ? ` · ${new Date(m.targetDate).toLocaleDateString()}` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legItem}>
      <View style={[styles.legDot, { backgroundColor: color }]} />
      <Text style={styles.legText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  kicker: {
    color: colors.cyan,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: 4 },
  sub: { color: colors.muted, marginBottom: 14, marginTop: 4 },
  axis: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  axisTick: { color: colors.dim, fontSize: 10 },
  legend: { flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 8 },
  legItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legDot: { width: 8, height: 8, borderRadius: 4 },
  legText: { color: colors.dim, fontSize: 11 },
  row: { marginBottom: 14 },
  rowHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  phase: { color: colors.ink, fontWeight: "800", fontSize: 13 },
  pct: { color: colors.cyan, fontWeight: "700", fontSize: 13 },
  lane: {
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1a2233",
    position: "relative",
  },
  ganttBar: {
    position: "absolute",
    top: 0,
    height: 16,
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
  },
  taskBar: {
    position: "absolute",
    top: 3,
    height: 10,
    borderRadius: 5,
  },
  track: {
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    flexDirection: "row",
    backgroundColor: "#1a2233",
  },
  seg: { height: 16 },
  meta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  task: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  taskTitle: { color: colors.ink, fontWeight: "600" },
  section: {
    color: colors.cyan,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 10,
  },
  ms: { marginBottom: 14 },
});
