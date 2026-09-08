"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  buildLinkedInClipboardText,
  buildTwitterClipboardText,
  TWITTER_COMPOSE_URL,
} from "@/lib/founder/content-engine/format-post";
import { LANDING_PAGE_TWEETS } from "@/lib/founder/content-engine/landing-copy";

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

export function ConnectLinkedInButton({
  oauthConfigured,
  reconnectForCompany = false,
}: {
  oauthConfigured: boolean;
  reconnectForCompany?: boolean;
}) {
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
      {reconnectForCompany ? "Reconnect LinkedIn (company scopes)" : "Connect LinkedIn"}
    </a>
  );
}

export function ConnectFacebookButton({ oauthConfigured }: { oauthConfigured: boolean }) {
  if (!oauthConfigured) {
    return (
      <p className="text-xs text-ink-dim">
        Set <code>FACEBOOK_APP_ID</code> and <code>FACEBOOK_APP_SECRET</code>, then connect.
      </p>
    );
  }

  return (
    <a
      href="/api/facebook/connect"
      className="inline-flex rounded-lg border border-[#1877F2]/50 bg-[#1877F2]/15 px-4 py-2 text-sm font-medium text-[#60a5fa] hover:bg-[#1877F2]/25"
    >
      Connect Facebook
    </a>
  );
}

export function PostLandingThreadButton({ alreadyPosted }: { alreadyPosted: boolean }) {
  const [busy, setBusy] = useState(false);
  const [threadIndex, setThreadIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function copyNextTweet() {
    setBusy(true);
    setMessage(null);
    try {
      const tweet = LANDING_PAGE_TWEETS[threadIndex] ?? LANDING_PAGE_TWEETS[0];
      const win = window.open(TWITTER_COMPOSE_URL, "_blank", "noopener,noreferrer");
      await navigator.clipboard.writeText(tweet);
      const n = threadIndex + 1;
      const total = LANDING_PAGE_TWEETS.length;
      setThreadIndex(n >= total ? 0 : n);
      setMessage(
        win
          ? `Copied tweet ${n}/${total}. Paste on X${threadIndex === 0 ? "" : " as a reply"}. Click again for the next tweet.`
          : `Copied tweet ${n}/${total}. Popup blocked — open x.com/compose/post and paste.`,
      );
    } catch {
      setMessage("Could not copy/open X. Copy the tweet manually, then open x.com/compose/post.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={copyNextTweet}
        disabled={busy || alreadyPosted}
        className="rounded-lg border border-ink/30 bg-ink/5 px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
        title={
          alreadyPosted
            ? "This landing thread is already marked posted"
            : "Copy the next landing tweet and open X compose"
        }
      >
        {alreadyPosted
          ? "Landing thread posted"
          : busy
            ? "Opening X…"
            : `Copy landing tweet ${threadIndex + 1}/${LANDING_PAGE_TWEETS.length}`}
      </button>
      {message && <p className="mt-2 text-xs text-ink-muted">{message}</p>}
    </div>
  );
}

export function AuthorUrnForm({ initialUrn }: { initialUrn?: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(initialUrn ?? "urn:li:organization:");
  const [busy, setBusy] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Array<{ urn: string; name: string; vanityName?: string }>>(
    [],
  );

  async function loadOrgs() {
    setLoadingOrgs(true);
    setMessage(null);
    try {
      const res = await fetch("/api/linkedin/organizations");
      const data = (await res.json()) as {
        ok: boolean;
        organizations?: Array<{ urn: string; name: string; vanityName?: string }>;
        error?: string;
      };
      if (!data.ok) {
        setMessage(data.error ?? "Could not load company pages");
        return;
      }
      const list = data.organizations ?? [];
      setOrgs(list);
      if (list.length === 0) {
        setMessage(
          "No admin company pages found. Reconnect LinkedIn with organization scopes, and confirm you are a page admin.",
        );
      } else {
        const elah = list.find((o) => o.name.toLowerCase().includes("elah"));
        if (elah) setValue(elah.urn);
      }
    } catch {
      setMessage("Failed to load company pages");
    } finally {
      setLoadingOrgs(false);
    }
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/linkedin/author-urn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorUrn: value }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setMessage(data.error ?? "Failed to save");
      } else {
        setMessage("Company page author saved. Publish will post as Elah Security.");
        router.refresh();
      }
    } catch {
      setMessage("Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-accent-amber/40 bg-accent-amber/10 p-4">
      <p className="text-sm font-medium text-ink">
        Set Elah Security company page URN to publish as the business
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Use <code>urn:li:organization:XXXX</code> (not person). Load admin pages, or paste the
        company id. App needs <code>w_organization_social</code>.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loadingOrgs}
          onClick={loadOrgs}
          className="rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-xs font-medium text-ink disabled:opacity-50"
        >
          {loadingOrgs ? "Loading pages…" : "Load my company pages"}
        </button>
        {orgs.length > 0 && (
          <select
            value={orgs.some((o) => o.urn === value) ? value : ""}
            onChange={(e) => setValue(e.target.value)}
            className="min-w-[240px] flex-1 rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-xs text-ink"
          >
            <option value="" disabled>
              Select company page…
            </option>
            {orgs.map((o) => (
              <option key={o.urn} value={o.urn}>
                {o.name}
                {o.vanityName ? ` (/${o.vanityName})` : ""} — {o.urn}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="min-w-[280px] flex-1 rounded-lg border border-surface-border bg-surface-base px-3 py-2 text-xs text-ink"
          placeholder="urn:li:organization:XXXX"
        />
        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="rounded-lg bg-accent-gold px-3 py-2 text-xs font-semibold text-surface-base disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save company URN"}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-ink-muted">{message}</p>}
    </div>
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
  facebookPostId,
  facebookPublishedAt,
  twitterPostId,
  twitterPublishedAt,
  canPublish,
  canPublishFacebook,
  companyAdminUrl,
}: {
  draftId: string;
  title: string | null;
  body: string;
  status: string;
  hashtags: string;
  createdAt: string;
  publishedAt: string | null;
  externalPostId: string | null;
  facebookPostId: string | null;
  facebookPublishedAt: string | null;
  twitterPostId: string | null;
  twitterPublishedAt: string | null;
  canPublish: boolean;
  canPublishFacebook: boolean;
  companyAdminUrl: string;
}) {
  const tags = parseHashtags(hashtags);
  const isPublished = status === "published";
  const showActions = !isPublished || !facebookPostId || !twitterPostId;

  return (
    <article className="rounded-xl border border-surface-border bg-surface-subtle/40 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title ?? "Untitled post"}</h3>
          <p className="mt-0.5 text-[11px] text-ink-dim">
            Created {new Date(createdAt).toLocaleString()}
            {publishedAt ? ` · Published ${new Date(publishedAt).toLocaleString()}` : ""}
            {facebookPublishedAt
              ? ` · Facebook ${new Date(facebookPublishedAt).toLocaleString()}`
              : ""}
            {twitterPublishedAt
              ? ` · X ${new Date(twitterPublishedAt).toLocaleString()}`
              : ""}
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

      {(isPublished || facebookPostId || twitterPostId) && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-accent-emerald">
          {isPublished && (
            <span>
              {externalPostId?.startsWith("manual-company:")
                ? "Posted on Elah Security page (manual)"
                : "Published"}
            </span>
          )}
          {facebookPostId && <span>Facebook: {facebookPostId}</span>}
          {twitterPostId && (
            <span>
              {twitterPostId.startsWith("manual-compose:")
                ? "Posted on X (paste)"
                : `X: ${twitterPostId}`}
            </span>
          )}
          {externalPostId && !externalPostId.startsWith("manual-company:") && (
            <span className="text-ink-dim">LI: {externalPostId}</span>
          )}
        </div>
      )}

      {showActions ? (
        <div className="mt-3">
          <DraftActions
            draftId={draftId}
            body={body}
            hashtags={tags}
            canPublish={canPublish}
            canPublishFacebook={canPublishFacebook && !facebookPostId}
            alreadyOnTwitter={Boolean(twitterPostId)}
            companyAdminUrl={companyAdminUrl}
            showLinkedInActions={!isPublished}
          />
        </div>
      ) : null}
    </article>
  );
}

export function DraftActions({
  draftId,
  body,
  hashtags,
  canPublish,
  canPublishFacebook,
  alreadyOnTwitter,
  companyAdminUrl,
  showLinkedInActions = true,
}: {
  draftId: string;
  body: string;
  hashtags: string[];
  canPublish: boolean;
  canPublishFacebook: boolean;
  alreadyOnTwitter: boolean;
  companyAdminUrl: string;
  showLinkedInActions?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState(body);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function persistEdits() {
    await fetch(`/api/founder/content-engine/drafts/${draftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", text }),
    });
  }

  async function patch(
    action: "approve" | "reject" | "edit" | "publish" | "mark_published" | "publish_facebook" | "mark_twitter_posted",
  ) {
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
        setMessage("Published to LinkedIn via API.");
      } else if (action === "publish_facebook") {
        setMessage("Published to Facebook Page.");
      } else if (action === "mark_twitter_posted") {
        setMessage("Marked as posted on X.");
      } else if (action === "mark_published") {
        setMessage("Marked as published on the Elah Security page.");
      }
      router.refresh();
    } catch {
      setMessage("Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function postToElahPage() {
    setBusy(true);
    setMessage(null);
    try {
      await persistEdits();
      const clipboard = buildLinkedInClipboardText(text, hashtags);
      await navigator.clipboard.writeText(clipboard);
      window.open(companyAdminUrl, "_blank", "noopener,noreferrer");
      setMessage(
        "Copied. On LinkedIn: Start a post as Elah Security → paste → Post. Then click Mark as published.",
      );
      router.refresh();
    } catch {
      setMessage("Could not copy/open LinkedIn. Copy the text manually, then open the company admin page.");
    } finally {
      setBusy(false);
    }
  }

  async function postToX() {
    setBusy(true);
    setMessage(null);
    try {
      const win = window.open(TWITTER_COMPOSE_URL, "_blank", "noopener,noreferrer");
      await persistEdits();
      const clipboard = buildTwitterClipboardText(text, hashtags);
      await navigator.clipboard.writeText(clipboard);
      setMessage(
        win
          ? "Copied. On X: paste → Post. Then click Mark as posted on X."
          : "Copied. Popup blocked — open x.com/compose/post and paste, then Mark as posted on X.",
      );
      router.refresh();
    } catch {
      setMessage("Could not copy/open X. Copy the text manually, then open x.com/compose/post.");
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
        {showLinkedInActions && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={postToElahPage}
              className="min-h-11 rounded bg-accent-gold px-3 py-2 text-xs font-semibold text-surface-base disabled:opacity-50"
              title="Copy formatted post and open Elah Security admin (post as Page)"
            >
              Post to Elah page
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => patch("mark_published")}
              className="rounded border border-accent-emerald/40 px-2 py-1 text-xs text-accent-emerald"
            >
              Mark as published
            </button>
          </>
        )}
        <button
          type="button"
          disabled={busy || !canPublishFacebook}
          onClick={() => patch("publish_facebook")}
          className="min-h-11 rounded border border-[#1877F2]/50 bg-[#1877F2]/15 px-3 py-2 text-xs font-semibold text-[#60a5fa] disabled:cursor-not-allowed disabled:opacity-40"
          title={
            canPublishFacebook
              ? "Publish this draft to the Facebook Page"
              : "Set FACEBOOK_PAGE_ID + FACEBOOK_PAGE_ACCESS_TOKEN in env"
          }
        >
          Publish to Facebook
        </button>
        {!alreadyOnTwitter && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={postToX}
              className="min-h-11 rounded border border-ink/30 bg-ink/5 px-3 py-2 text-xs font-semibold text-ink disabled:opacity-40"
              title="Copy a 280-character version and open X compose"
            >
              Post to X
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => patch("mark_twitter_posted")}
              className="rounded border border-ink/30 px-2 py-1 text-xs text-ink"
            >
              Mark as posted on X
            </button>
          </>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => patch("edit")}
          className="rounded border border-surface-border px-2 py-1 text-xs"
        >
          Save edit
        </button>
        {showLinkedInActions && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => patch("approve")}
              className="rounded border border-accent-cyan/40 px-2 py-1 text-xs text-accent-cyan"
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
            {canPublish && (
              <button
                type="button"
                disabled={busy}
                onClick={() => patch("publish")}
                className="rounded border border-surface-border px-2 py-1 text-xs text-ink-muted"
                title="API publish (requires Community Management / w_organization_social)"
              >
                API publish
              </button>
            )}
          </>
        )}
      </div>
      {message && <p className="text-xs text-ink-muted">{message}</p>}
    </div>
  );
}
