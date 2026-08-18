import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "../theme";
import { useStore } from "../store";

export function LoginScreen() {
  const { login } = useStore();
  const [username, setUsername] = useState("bnd");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setBusy(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.kicker}>ELAH Security</Text>
        <Text style={styles.title}>Founder</Text>
        <Text style={styles.sub}>
          Tasks, reminders, and WhatsApp follow-ups — on your phone.
        </Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          placeholderTextColor={colors.dim}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => void onSubmit()}
          style={styles.input}
          placeholderTextColor={colors.dim}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable
          onPress={() => void onSubmit()}
          disabled={busy}
          style={[styles.btn, busy && { opacity: 0.6 }]}
        >
          <Text style={styles.btnText}>{busy ? "Signing in…" : "Sign in"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: 24,
  },
  card: { gap: 10 },
  kicker: {
    color: colors.cyan,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  title: { color: colors.ink, fontSize: 40, fontWeight: "700" },
  sub: { color: colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 12 },
  label: { color: colors.dim, fontSize: 12, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.raised,
    color: colors.ink,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { color: colors.rose, marginTop: 4 },
  btn: {
    marginTop: 16,
    backgroundColor: colors.cyan,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#041018", fontWeight: "800", fontSize: 16 },
});
