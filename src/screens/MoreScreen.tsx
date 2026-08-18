import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { OutreachScreen } from "./OutreachScreen";
import { CaptureScreen } from "./CaptureScreen";
import { SettingsScreen } from "./SettingsScreen";
import { useState } from "react";

export function MoreScreen({
  onCreated,
}: {
  onCreated: (id: string) => void;
}) {
  const [page, setPage] = useState<"menu" | "outreach" | "capture" | "settings">("menu");

  if (page === "outreach") {
    return (
      <View style={{ flex: 1 }}>
        <Pressable onPress={() => setPage("menu")} style={styles.backWrap}>
          <Text style={styles.back}>← More</Text>
        </Pressable>
        <OutreachScreen />
      </View>
    );
  }
  if (page === "capture") {
    return (
      <View style={{ flex: 1 }}>
        <Pressable onPress={() => setPage("menu")} style={styles.backWrap}>
          <Text style={styles.back}>← More</Text>
        </Pressable>
        <CaptureScreen onCreated={onCreated} />
      </View>
    );
  }
  if (page === "settings") {
    return (
      <View style={{ flex: 1 }}>
        <Pressable onPress={() => setPage("menu")} style={styles.backWrap}>
          <Text style={styles.back}>← More</Text>
        </Pressable>
        <SettingsScreen />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>More</Text>
      <Item label="Outreach" hint="Follow-ups and WhatsApp" onPress={() => setPage("outreach")} />
      <Item label="Capture" hint="Add a task from the phone" onPress={() => setPage("capture")} />
      <Item label="Settings" hint="Notifications, API host, sign out" onPress={() => setPage("settings")} />
    </View>
  );
}

function Item({
  label,
  hint,
  onPress,
}: {
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginBottom: 16 },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  label: { color: colors.ink, fontWeight: "700", fontSize: 16 },
  hint: { color: colors.muted, marginTop: 4 },
  backWrap: { backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 8 },
  back: { color: colors.cyan, fontWeight: "700" },
});
