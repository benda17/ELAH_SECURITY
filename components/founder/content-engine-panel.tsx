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

export function ConnectLinkedInButton({ oauthConfigured }: { oauthConfigured: boolean }) {
  if (!oauthConfigured) {
    return (
      <p className="text-xs text-ink-dim">
        Set <code>LINKEDIN_CLIENT_ID</code> and <code>LINKEDIN_CLIENT_SECRET</code> in Vercel,
        then reconnect.
      </p>
    );
  }

  return (
    <a
      href="/api/linkedin/connect"
      className="inline-flex rounded-lg border border-accent-gold/40 bg-accent-gold/10 px-4 py-2 text-sm font-medium text-accent-gold hover:bg-accent-gold/20"
    >
      Connect LinkedIn
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald",
    approved: "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan",
    rejected: "border-accent-rose/40 bg-accent-rose/10 text-accent-rose",
    draft: "border-surface-border bg-surface-subtle text-ink-muted",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        styles[status] ?? styles.draft
      }`}
    >
      {status}
    </span>
  );
}

function parseHashtags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function PostCard({
  draftId,
  title,
  body,
  status,
  hashtags,
  createdAt,
  publishedAt,
  externalPostId,
  canPublish,
}: {
  draftId: string;
  title: string | null;
  body: string;
  status: string;
  hashtags: string;
  createdAt: string;
  publishedAt: string | null;
  externalPostId: string | null;
  canPublish: boolean;
}) {
  const tags = parseHashtags(hashtags);
  const isPublished = status === "published";

  return (
    <article className="rounded-xl border border-surface-border bg-surface-subtle/40 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title ?? "Untitled post"}</h3>
          <p className="mt-0.5 text-[11px] text-ink-dim">
            Created {new Date(createdAt).toLocaleString()}
            {publishedAt ? ` · Published ${new Date(publishedAt).toLocaleString()}` : ""}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="whitespace-pre-wrap rounded-lg border border-surface-border/80 bg-surface-base/60 px-3 py-3 text-sm leading-relaxed text-ink">
        {body}
      </div>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-surface-border px-2 py-0.5 text-[10px] text-ink-muted"
            >
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}

      {isPublished ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-accent-emerald">
          <span>Live on LinkedIn</span>
          {externalPostId && (
            <span className="text-ink-dim">Post id: {externalPostId}</span>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <DraftActions draftId={draftId} body={body} status={status} canPublish={canPublish} />
        </div>
      )}
    </article>
  );
}

export function DraftActions({
  draftId,
  body,
  status,
  canPublish,
}: {
  draftId: string;
  body: string;
  status: string;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState(body);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function patch(action: "approve" | "reject" | "edit" | "publish") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/founder/content-engine/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "edit" ? { action, text } : { action }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setMessage(data.error ?? "Action failed");
      } else if (action === "publish") {
        setMessage("Published to LinkedIn.");
      }
      router.refresh();
    } catch {
      setMessage("Request failed");
    } finally {
      setBusy(false);
    }
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
        <button
          type="button"
          disabled={busy || !canPublish}
          onClick={() => patch("publish")}
          className="rounded border border-accent-cyan/40 px-2 py-1 text-xs text-accent-cyan disabled:cursor-not-allowed disabled:opacity-40"
          title={canPublish ? "Publish this draft to LinkedIn" : "Connect LinkedIn first"}
        >
          Publish to LinkedIn
        </button>
      </div>
      {message && <p className="text-xs text-ink-muted">{message}</p>}
    </div>
  );
}
