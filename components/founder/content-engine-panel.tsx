"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateDraftButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/founder/content-engine/generate", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      setMessage(data.ok ? "Draft generated." : data.error ?? "Generation failed");
      router.refresh();
    } catch {
      setMessage("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-surface-base disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate Now"}
      </button>
      {message && <p className="mt-2 text-xs text-ink-muted">{message}</p>}
    </div>
  );
}

export function DraftActions({
  draftId,
  body,
  status,
}: {
  draftId: string;
  body: string;
  status: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(body);
  const [busy, setBusy] = useState(false);

  async function patch(action: "approve" | "reject" | "edit") {
    setBusy(true);
    await fetch(`/api/founder/content-engine/drafts/${draftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        action === "edit" ? { action, text } : { action },
      ),
    });
    setBusy(false);
    router.refresh();
  }

  if (status === "published") {
    return <span className="text-xs text-accent-emerald">Published</span>;
  }

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-surface-border bg-surface-subtle px-2 py-1.5 text-xs text-ink"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => patch("edit")}
          className="rounded border border-surface-border px-2 py-1 text-xs"
        >
          Save edit
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => patch("approve")}
          className="rounded border border-accent-emerald/40 px-2 py-1 text-xs text-accent-emerald"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => patch("reject")}
          className="rounded border border-accent-rose/40 px-2 py-1 text-xs text-accent-rose"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
