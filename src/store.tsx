import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { api, ApiError, getToken, setToken } from "./api";
import { login as loginRequest, logout as logoutRequest } from "./auth";
import { scheduleDigestNotifications } from "./notifications";
import type {
  Bootstrap,
  ContentDraft,
  ContentPublishStatus,
  ReminderDigest,
  RoadmapTask,
  TaskStatus,
} from "./types";

type RefreshOpts = { silent?: boolean };

type Store = {
  ready: boolean;
  authed: boolean;
  loading: boolean;
  error: string | null;
  data: Bootstrap | null;
  reminders: ReminderDigest | null;
  drafts: ContentDraft[];
  draftCounts: Record<string, number>;
  draftsError: string | null;
  publishStatus: ContentPublishStatus | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: (opts?: RefreshOpts) => Promise<void>;
  touch: () => void;
  refreshDrafts: () => Promise<void>;
  generateDraft: () => Promise<void>;
  draftAction: (
    id: string,
    action: string,
    extra?: Record<string, string>,
  ) => Promise<{ ok: boolean; error?: string; postId?: string }>;
  patchTask: (id: string, patch: Record<string, unknown>) => Promise<RoadmapTask>;
  completeTask: (id: string) => Promise<RoadmapTask>;
  setStatus: (id: string, status: TaskStatus) => Promise<RoadmapTask>;
  createTask: (input: {
    title: string;
    notes?: string;
    priority?: string;
    dueDate?: string | null;
  }) => Promise<RoadmapTask>;
};

const Ctx = createContext<Store | null>(null);

const STALE_MS = 12_000;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Bootstrap | null>(null);
  const [reminders, setReminders] = useState<ReminderDigest | null>(null);

  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [draftCounts, setDraftCounts] = useState<Record<string, number>>({});
  const [draftsError, setDraftsError] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<ContentPublishStatus | null>(null);

  const lastFetch = useRef(0);
  const authedRef = useRef(false);
  authedRef.current = authed;

  const refreshDrafts = useCallback(async () => {
    try {
      const result = await api<{
        drafts: ContentDraft[];
        counts: Record<string, number>;
        publish?: ContentPublishStatus;
      }>("/api/founder/content-engine/drafts");
      setDrafts(result.drafts ?? []);
      setDraftCounts(result.counts ?? {});
      if (result.publish) setPublishStatus(result.publish);
      setDraftsError(null);
    } catch (err) {
      setDraftsError(err instanceof Error ? err.message : "Could not load drafts.");
    }
  }, []);

  const refresh = useCallback(
    async (opts?: RefreshOpts) => {
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const [boot, digest] = await Promise.all([
          api<Bootstrap>("/api/founder/roadmap/bootstrap"),
          api<ReminderDigest>("/api/founder/reminders"),
        ]);
        setData(boot);
        setReminders(digest);
        setAuthed(true);
        lastFetch.current = Date.now();
        void scheduleDigestNotifications(digest);
        void refreshDrafts();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await setToken(null);
          setAuthed(false);
          setData(null);
        } else {
          setError(err instanceof Error ? err.message : "Could not load ELAH.");
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [refreshDrafts],
  );

  const touch = useCallback(() => {
    if (!authedRef.current) return;
    if (Date.now() - lastFetch.current < STALE_MS) return;
    void refresh({ silent: true });
  }, [refresh]);

  useEffect(() => {
    void (async () => {
      const token = await getToken();
      if (token) {
        setAuthed(true);
        await refresh();
      }
      setReady(true);
    })();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") touch();
    });
    return () => sub.remove();
  }, [touch]);

  const login = useCallback(
    async (username: string, password: string) => {
      await loginRequest(username, password);
      setAuthed(true);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setAuthed(false);
    setData(null);
    setReminders(null);
    setDrafts([]);
    setDraftsError(null);
    setPublishStatus(null);
  }, []);

  const patchTask = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const result = await api<{ task: RoadmapTask }>(`/api/founder/roadmap/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === id ? result.task : t)),
        };
      });
      void refresh({ silent: true });
      return result.task;
    },
    [refresh],
  );

  const completeTask = useCallback(
    (id: string) => patchTask(id, { status: "done" }),
    [patchTask],
  );

  const setStatus = useCallback(
    (id: string, status: TaskStatus) => patchTask(id, { status }),
    [patchTask],
  );

  const createTask = useCallback(
    async (input: {
      title: string;
      notes?: string;
      priority?: string;
      dueDate?: string | null;
    }) => {
      const result = await api<{ task: RoadmapTask }>("/api/founder/roadmap/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: input.title,
          notes: input.notes ?? null,
          description: input.notes ?? null,
          priority: input.priority ?? "high",
          status: "backlog",
          dueDate: input.dueDate ?? null,
          workstream: "Operations",
          category: "Mobile capture",
          phase: "Phase 15 — Team and operations",
        }),
      });
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, tasks: [result.task, ...prev.tasks] };
      });
      void refresh({ silent: true });
      return result.task;
    },
    [refresh],
  );

  const generateDraft = useCallback(async () => {
    await api("/api/founder/content-engine/generate", { method: "POST" });
    await refreshDrafts();
  }, [refreshDrafts]);

  const draftAction = useCallback(
    async (id: string, action: string, extra?: Record<string, string>) => {
      try {
        const result = await api<{ ok?: boolean; error?: string; postId?: string }>(
          `/api/founder/content-engine/drafts/${id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ action, ...extra }),
          },
        );
        await refreshDrafts();
        return { ok: result.ok !== false, error: result.error, postId: result.postId };
      } catch (err) {
        await refreshDrafts();
        return {
          ok: false,
          error: err instanceof Error ? err.message : "Publish failed.",
        };
      }
    },
    [refreshDrafts],
  );

  const value = useMemo(
    () => ({
      ready,
      authed,
      loading,
      error,
      data,
      reminders,
      drafts,
      draftCounts,
      draftsError,
      publishStatus,
      login,
      logout,
      refresh,
      touch,
      refreshDrafts,
      generateDraft,
      draftAction,
      patchTask,
      completeTask,
      setStatus,
      createTask,
    }),
    [
      ready,
      authed,
      loading,
      error,
      data,
      reminders,
      drafts,
      draftCounts,
      draftsError,
      publishStatus,
      login,
      logout,
      refresh,
      touch,
      refreshDrafts,
      generateDraft,
      draftAction,
      patchTask,
      completeTask,
      setStatus,
      createTask,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
