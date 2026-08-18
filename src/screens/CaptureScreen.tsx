import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors } from "../theme";
import { useStore } from "../store";

function isoDaysFromNow(days: number | null) {
  if (days == null) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

export function CaptureScreen({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const { createTask } = useStore();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"critical" | "high" | "medium" | "low">("high");
  const [due, setDue] = useState<number | null>(1);
  const [busy, setBusy] = useState(false);

  async function onSave() {
    if (!title.trim()) {
      Alert.alert("Title needed", "Write the actual work in one sentence.");
      return;
    }
    setBusy(true);
    try {
      const task = await createTask({
        title: title.trim(),
        notes: notes.trim() || undefined,
        priority,
        dueDate: isoDaysFromNow(due),
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTitle("");
      setNotes("");
      onCreated(task.id);
    } catch (err) {
      Alert.alert("Could not save", err instanceof Error ? err.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Capture</Text>
      <Text style={styles.sub}>Dump a founder task before it evaporates.</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="What needs to happen?"
        placeholderTextColor={colors.dim}
        style={styles.input}
      />
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Context, files, people — optional"
        placeholderTextColor={colors.dim}
        style={[styles.input, { height: 110, textAlignVertical: "top" }]}
        multiline
      />
      <Text style={styles.label}>Priority</Text>
      <View style={styles.row}>
        {(["critical", "high", "medium", "low"] as const).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPriority(p)}
            style={[styles.chip, priority === p && styles.chipOn]}
          >
            <Text style={[styles.chipText, priority === p && styles.chipTextOn]}>{p}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Due</Text>
      <View style={styles.row}>
        {[
          { n: 0, l: "Today" },
          { n: 1, l: "Tomorrow" },
          { n: 7, l: "Next week" },
          { n: null, l: "None" },
        ].map((opt) => (
          <Pressable
            key={String(opt.n)}
            onPress={() => setDue(opt.n)}
            style={[styles.chip, due === opt.n && styles.chipOn]}
          >
            <Text style={[styles.chipText, due === opt.n && styles.chipTextOn]}>{opt.l}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable disabled={busy} onPress={() => void onSave()} style={styles.save}>
        <Text style={styles.saveText}>{busy ? "Saving…" : "Add to roadmap"}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800" },
  sub: { color: colors.muted, marginBottom: 16, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.raised,
    color: colors.ink,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  label: { color: colors.dim, fontSize: 12, marginBottom: 8, marginTop: 4 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipOn: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  chipText: { color: colors.muted, textTransform: "capitalize" },
  chipTextOn: { color: "#041018", fontWeight: "800" },
  save: {
    backgroundColor: colors.cyan,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveText: { color: "#041018", fontWeight: "800", fontSize: 16 },
});
