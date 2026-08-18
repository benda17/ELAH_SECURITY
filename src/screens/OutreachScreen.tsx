import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { useStore } from "../store";
import { shareToWhatsApp } from "../whatsapp";
import { api } from "../api";
import type { RoadmapContact } from "../types";

export function OutreachScreen() {
  const { data, reminders, refresh } = useStore();
  const overdue = reminders?.contacts.overdueFollowUp?.length
    ? reminders.contacts.overdueFollowUp
    : data?.metrics.overdueFollowUps ?? [];
  const today = reminders?.contacts.followUpToday ?? [];
  const contacts = data?.contacts ?? [];

  const byId = new Map(contacts.map((c) => [c.id, c]));

  async function markContacted(id: string) {
    await api("/api/founder/roadmap/contacts", {
      method: "PATCH",
      body: JSON.stringify({
        id,
        outreachStatus: "contacted",
        lastContactDate: new Date().toISOString(),
      }),
    });
    await refresh();
  }

  async function whatsapp(c: RoadmapContact) {
    const text = [
      `Hi${c.name ? ` ${c.name.split(" ")[0]}` : ""},`,
      "",
      "Following up from ELAH Security — reasoning-level security for banking AI assistants.",
      c.organization ? `Re: ${c.organization}` : "",
      "",
      "Open to a 20-minute walkthrough of the banking simulator this week?",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await shareToWhatsApp(text);
    } catch {
      Alert.alert("WhatsApp", "Could not open WhatsApp.");
    }
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text style={styles.title}>Outreach</Text>
      <Text style={styles.sub}>Follow-ups that should not slip.</Text>

      <Text style={styles.section}>Overdue</Text>
      {overdue.length === 0 ? (
        <Text style={styles.empty}>No overdue follow-ups.</Text>
      ) : (
        overdue.map((c) => {
          const full = byId.get(c.id) ?? (c as RoadmapContact);
          return (
            <Card
              key={c.id}
              contact={full}
              onWhatsApp={() => void whatsapp(full)}
              onDone={() => void markContacted(c.id)}
            />
          );
        })
      )}

      <Text style={styles.section}>Today</Text>
      {today.length === 0 ? (
        <Text style={styles.empty}>Nothing scheduled today.</Text>
      ) : (
        today.map((c) => {
          const full = byId.get(c.id) ?? (c as RoadmapContact);
          return (
            <Card
              key={c.id}
              contact={full}
              onWhatsApp={() => void whatsapp(full)}
              onDone={() => void markContacted(c.id)}
            />
          );
        })
      )}
    </ScrollView>
  );
}

function Card({
  contact,
  onWhatsApp,
  onDone,
}: {
  contact: RoadmapContact;
  onWhatsApp: () => void;
  onDone: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{contact.name}</Text>
      <Text style={styles.meta}>
        {contact.organization ?? "—"} · {contact.outreachStatus.replace(/_/g, " ")}
      </Text>
      <View style={styles.row}>
        <Pressable onPress={onWhatsApp} style={styles.btn}>
          <Text style={styles.btnText}>WhatsApp</Text>
        </Pressable>
        <Pressable onPress={onDone} style={styles.ghost}>
          <Text style={styles.ghostText}>Marked contacted</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800" },
  sub: { color: colors.muted, marginTop: 4, marginBottom: 8 },
  section: {
    color: colors.cyan,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
  },
  empty: { color: colors.dim },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  name: { color: colors.ink, fontWeight: "700", fontSize: 16 },
  meta: { color: colors.muted, marginTop: 4 },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  btn: {
    backgroundColor: colors.emerald,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  btnText: { color: "#04210f", fontWeight: "800" },
  ghost: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostText: { color: colors.ink, fontWeight: "600" },
});
