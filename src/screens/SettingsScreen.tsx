import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { DEFAULT_API_URL, getApiUrl, setApiUrl } from "../api";
import { colors as theme } from "../theme";
import { useStore } from "../store";
import { ensureNotificationPermission } from "../notifications";

export function SettingsScreen() {
  const { logout, reminders } = useStore();
  const [url, setUrl] = useState(DEFAULT_API_URL);
  const [perm, setPerm] = useState<string>("checking");

  useEffect(() => {
    void getApiUrl().then(setUrl);
    void ensureNotificationPermission().then((ok) =>
      setPerm(ok ? "enabled" : "denied — enable in iOS Settings"),
    );
  }, []);

  async function saveUrl() {
    await setApiUrl(url);
    Alert.alert("Saved", "API host updated. Sign in again if needed.");
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.label}>Notifications</Text>
      <Text style={styles.body}>{perm}</Text>
      <Text style={styles.hint}>
        Morning brief 8:00 · Evening wrap 18:30 · per-task reminders when you tap them.
      </Text>
      {reminders && (
        <Text style={styles.body}>
          Badge: {reminders.summary.tasksOverdue + reminders.summary.tasksDueToday + reminders.summary.contactsNeedingFollowUp}{" "}
          open loops
        </Text>
      )}

      <Text style={styles.label}>API host</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
      <Pressable onPress={() => void saveUrl()} style={styles.ghost}>
        <Text style={styles.ghostText}>Save host</Text>
      </Pressable>
      <Text style={styles.hint}>
        Production is elahfounderplatform.vercel.app. For a local API, use your Mac’s LAN IP
        (http://192.168.x.x:3001) — localhost will not work from the phone.
      </Text>

      <Pressable
        onPress={() => void logout()}
        style={[styles.ghost, { marginTop: 28, borderColor: theme.rose }]}
      >
        <Text style={[styles.ghostText, { color: theme.rose }]}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg, padding: 20 },
  title: { color: theme.ink, fontSize: 28, fontWeight: "800", marginBottom: 16 },
  label: {
    color: theme.cyan,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 6,
  },
  body: { color: theme.ink },
  hint: { color: theme.dim, marginTop: 8, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.raised,
    color: theme.ink,
    borderRadius: 12,
    padding: 12,
  },
  ghost: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  ghostText: { color: theme.ink, fontWeight: "700" },
});
