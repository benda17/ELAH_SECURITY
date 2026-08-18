import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../theme";
import { useStore } from "../store";
import { shareToWhatsApp } from "../whatsapp";
import type { ContentDraft } from "../types";

const FILTERS = ["queue", "draft", "approved", "published", "rejected", "all"] as const;
const CONTENT_ENGINE_URL = "https://elahfounderplatform.vercel.app/founder/content-engine";

export function ContentScreen({
  onOpen,
}: {
  onOpen: (id: string) => void;
}) {
  const { drafts, draftCounts, draftsError, generateDraft, refreshDrafts, publishStatus, touch } =
    useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("queue");
  const [busy, setBusy] = useState(false);
  const [pulling, setPulling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      touch();
      void refreshDrafts();
    }, [touch, refreshDrafts]),
  );

  const shown = useMemo(() => {
    if (filter === "all") return drafts;
    if (filter === "queue") return drafts.filter((d) => d.status !== "published");
    return drafts.filter((d) => d.status === filter);
  }, [drafts, filter]);

  async function onGenerate() {
    setBusy(true);
    try {
      await generateDraft();
    } catch (err) {
      Alert.alert("Generate failed", err instanceof Error ? err.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={styles.wrap}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => {
            setPulling(true);
            void refreshDrafts().finally(() => setPulling(false));
          }}
          tintColor={colors.cyan}
        />
      }
    >
      <Text style={styles.kicker}>Content engine</Text>
      <Text style={styles.title}>Posts</Text>
      <Text style={styles.ready}>
        LinkedIn {publishStatus?.linkedin ? "ready" : "not connected"} · Facebook{" "}
        {publishStatus?.facebook ? publishStatus.facebookPage || "ready" : "not connected"}
      </Text>
      <Pressable disabled={busy} onPress={() => void onGenerate()} style={styles.gen}>
        {busy ? (
          <ActivityIndicator color="#041018" />
        ) : (
          <Text style={styles.genText}>Generate content</Text>
        )}
      </Pressable>

      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            hitSlop={4}
            style={[styles.chip, filter === f && styles.chipOn]}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>
              {f === "queue" ? "To post" : f}
              {f === "queue"
                ? ` ${drafts.filter((d) => d.status !== "published").length}`
                : f === "all"
                  ? ` ${drafts.length}`
                  : draftCounts[f] != null
                    ? ` ${draftCounts[f]}`
                    : ""}
            </Text>
          </Pressable>
        ))}
      </View>

      {draftsError ? <Text style={styles.error}>{draftsError}</Text> : null}

      {shown.length === 0 ? (
        <Text style={styles.empty}>
          {draftsError ? "Pull to retry loading drafts." : "No posts in this view."}
        </Text>
      ) : (
        shown.map((d) => (
          <Pressable key={d.id} onPress={() => onOpen(d.id)} style={styles.card}>
            <Text style={styles.status}>{d.status}</Text>
            <Text style={styles.cardTitle}>{d.title || "Untitled draft"}</Text>
            <Text style={styles.body} numberOfLines={4}>
              {d.body}
            </Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

export function ContentDetailScreen({
  draftId,
  onBack,
}: {
  draftId: string;
  onBack: () => void;
}) {
  const { drafts, draftAction, publishStatus } = useStore();
  const draft = drafts.find((d) => d.id === draftId) as ContentDraft | undefined;
  const [busy, setBusy] = useState(false);

  if (!draft) {
    return (
      <View style={styles.wrap}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>← Content</Text>
        </Pressable>
        <Text style={styles.empty}>Draft not found. Pull the list to refresh.</Text>
      </View>
    );
  }

  const current = draft;
  const engineUrl = publishStatus?.contentEngineUrl || CONTENT_ENGINE_URL;

  async function run(action: string, label: string) {
    setBusy(true);
    try {
      const result = await draftAction(current.id, action);
      if (!result.ok) {
        Alert.alert(label, result.error || "Action failed.", [
          { text: "OK" },
          {
            text: "Open Content Engine",
            onPress: () => void Linking.openURL(engineUrl),
          },
        ]);
        return;
      }
      Alert.alert(label, result.postId ? `Posted (${result.postId})` : "Done.");
    } catch (err) {
      Alert.alert(label, err instanceof Error ? err.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function publishLinkedIn() {
    if (publishStatus && !publishStatus.linkedin) {
      Alert.alert(
        "LinkedIn not connected",
        publishStatus.linkedinNotes ||
          "Connect LinkedIn in the Founder Content Engine, then try again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Connect in browser", onPress: () => void Linking.openURL(engineUrl) },
          {
            text: "Share instead",
            onPress: () => void Share.share({ message: `${current.title ?? "ELAH"}\n\n${current.body}` }),
          },
        ],
      );
      return;
    }
    await run("publish", "LinkedIn");
  }

  async function publishFacebook() {
    if (publishStatus && !publishStatus.facebook) {
      Alert.alert(
        "Facebook not connected",
        publishStatus.facebookNotes ||
          "Connect the ELAH Security Facebook Page in the Founder Content Engine, then try again.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Connect in browser", onPress: () => void Linking.openURL(engineUrl) },
          {
            text: "Share instead",
            onPress: () => void Share.share({ message: `${current.title ?? "ELAH"}\n\n${current.body}` }),
          },
        ],
      );
      return;
    }
    await run("publish_facebook", "Facebook");
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 48 }}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>← Content</Text>
      </Pressable>
      <Text style={[styles.status, { paddingHorizontal: 20 }]}>{current.status}</Text>
      <Text style={styles.detailTitle}>{current.title || "Untitled draft"}</Text>
      <Text style={styles.fullBody}>{current.body}</Text>
      {current.facebookPostId ? (
        <Text style={styles.posted}>Facebook: {current.facebookPostId}</Text>
      ) : null}

      <View style={styles.actions}>
        {current.status !== "published" && (
          <Btn label="Approve" onPress={() => void run("approve", "Approve")} disabled={busy} />
        )}
        {current.status !== "published" && (
          <Btn label="Reject" onPress={() => void run("reject", "Reject")} disabled={busy} tone="rose" />
        )}
        <Btn
          label="WhatsApp"
          onPress={() => void shareToWhatsApp(`${current.title ?? "ELAH post"}\n\n${current.body}`)}
        />
        {!current.facebookPostId && (
          <Btn
            label="Publish Facebook"
            onPress={() => void publishFacebook()}
            disabled={busy}
            tone="facebook"
          />
        )}
        {(!current.externalPostId || current.externalPostId.startsWith("manual-company:")) && (
          <Btn label="Publish LinkedIn" onPress={() => void publishLinkedIn()} disabled={busy} />
        )}
        {current.status !== "published" && (
          <Btn
            label="Mark published"
            onPress={() => void run("mark_published", "Marked published")}
            disabled={busy}
          />
        )}
        <Btn
          label="Open Content Engine"
          onPress={() => void Linking.openURL(engineUrl)}
        />
      </View>
    </ScrollView>
  );
}

function Btn({
  label,
  onPress,
  disabled,
  tone,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "rose" | "facebook";
}) {
  const bg =
    tone === "rose" ? colors.rose : tone === "facebook" ? "#1877F2" : colors.emerald;
  const fg = tone === "facebook" ? "#fff" : tone === "rose" ? "#fff" : "#04210f";
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
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
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", marginTop: 4, marginBottom: 4 },
  ready: { color: colors.muted, fontSize: 12, marginBottom: 12 },
  gen: {
    backgroundColor: colors.cyan,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  genText: { color: "#041018", fontWeight: "800" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: colors.cyan, borderColor: colors.cyan },
  chipText: { color: colors.muted, fontSize: 11, textTransform: "capitalize" },
  chipTextOn: { color: "#041018", fontWeight: "800" },
  empty: { color: colors.dim, marginTop: 20, paddingHorizontal: 20 },
  error: { color: colors.rose, marginBottom: 8, fontSize: 13 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  status: {
    color: colors.cyan,
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 4,
  },
  cardTitle: { color: colors.ink, fontWeight: "700", marginBottom: 6 },
  body: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  back: { color: colors.cyan, fontWeight: "700", marginBottom: 12, paddingHorizontal: 20, paddingTop: 16 },
  detailTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  fullBody: { color: colors.ink, fontSize: 15, lineHeight: 22, paddingHorizontal: 20 },
  posted: { color: colors.emerald, paddingHorizontal: 20, marginTop: 10, fontSize: 12 },
  actions: { padding: 20, gap: 10 },
  btn: {
    backgroundColor: colors.emerald,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#04210f", fontWeight: "800" },
});
