import { getContentEngineConfig } from "@/lib/founder/content-engine/config";
import { getPublishCredentials, linkedInOAuthConfigured } from "@/lib/founder/content-engine/linkedin";
import {
  countLinkedInPostsByStatus,
  getLinkedInIntegration,
  listContentEngineRuns,
  listLinkedInDrafts,
  listSourceEvents,
} from "@/lib/founder/content-engine/repository";
import {
  ConnectLinkedInButton,
  GenerateDraftButton,
  PostCard,
} from "@/components/founder/content-engine-panel";

export const dynamic = "force-dynamic";

export default async function ContentEnginePage({
  searchParams,
}: {
  searchParams?: { linkedin?: string; status?: string };
}) {
  const config = getContentEngineConfig();
  const statusFilter = searchParams?.status?.trim() || "all";

  const [posts, counts, runs, sources, integration, publishCreds] = await Promise.all([
    listLinkedInDrafts(80),
    countLinkedInPostsByStatus(),
    listContentEngineRuns(),
    listSourceEvents(),
    getLinkedInIntegration(),
    getPublishCredentials(),
  ]);

  const canPublish = Boolean(publishCreds);
  const linkedinFlash = searchParams?.linkedin;
  const filtered =
    statusFilter === "all" ? posts : posts.filter((p) => p.status === statusFilter);

  const filters: Array<{ key: string; label: string; count: number }> = [
    { key: "all", label: "All", count: posts.length },
    { key: "published", label: "Published", count: counts.published ?? 0 },
    { key: "draft", label: "Drafts", count: counts.draft ?? 0 },
    { key: "approved", label: "Approved", count: counts.approved ?? 0 },
    { key: "rejected", label: "Rejected", count: counts.rejected ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="panel-title">Content automation</p>
          <h1 className="text-2xl font-semibold">Content Engine</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Generate, review, and publish LinkedIn posts. Free Groq/Gemini drafting + LinkedIn
            publish.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <GenerateDraftButton />
          <ConnectLinkedInButton oauthConfigured={linkedInOAuthConfigured()} />
        </div>
      </header>

      {linkedinFlash === "connected" && (
        <p className="rounded-lg border border-accent-emerald/40 bg-accent-emerald/10 px-3 py-2 text-sm text-accent-emerald">
          LinkedIn connected. You can publish drafts.
        </p>
      )}
      {linkedinFlash?.startsWith("error:") && (
        <p className="rounded-lg border border-accent-rose/40 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
          LinkedIn connect failed: {decodeURIComponent(linkedinFlash.slice(6))}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {filters
          .filter((f) => f.key !== "all")
          .map((f) => (
            <div key={f.key} className="panel py-4">
              <p className="panel-title">{f.label}</p>
              <p className="stat-value mt-1 text-2xl">{f.count}</p>
            </div>
          ))}
      </section>

      <section className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Posts</h2>
            <p className="text-xs text-ink-dim">
              LinkedIn ready: {canPublish ? "yes" : "no"} · Auto-publish:{" "}
              {config.autoPublish ? "on" : "off"}
              {integration?.authorUrn ? ` · ${integration.authorUrn}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => {
              const active = statusFilter === f.key;
              const href =
                f.key === "all"
                  ? "/founder/content-engine"
                  : `/founder/content-engine?status=${f.key}`;
              return (
                <a
                  key={f.key}
                  href={href}
                  className={
                    active
                      ? "rounded-full border border-accent-cyan/40 bg-accent-cyan/15 px-3 py-1 text-xs text-accent-cyan"
                      : "rounded-full border border-surface-border px-3 py-1 text-xs text-ink-muted hover:text-ink"
                  }
                >
                  {f.label} ({f.count})
                </a>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No posts in this view yet. Click <strong>Generate Now</strong> to create one.
            </p>
          ) : (
            filtered.map((d) => (
              <PostCard
                key={d.id}
                draftId={d.id}
                title={d.title}
                body={d.body}
                status={d.status}
                hashtags={d.hashtags}
                createdAt={d.createdAt.toISOString()}
                publishedAt={d.publishedAt?.toISOString() ?? null}
                externalPostId={d.externalPostId}
                canPublish={canPublish}
              />
            ))
          )}
        </div>
      </section>

      <details className="panel">
        <summary className="cursor-pointer text-sm font-semibold">Setup &amp; operations</summary>
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">
              Environment
            </h3>
            <ul className="space-y-2 text-sm">
              {config.envVars.map((v) => (
                <li key={v.key} className="flex items-start justify-between gap-4">
                  <div>
                    <code className="text-accent-cyan">{v.key}</code>
                    <p className="text-xs text-ink-dim">{v.description}</p>
                  </div>
                  <span
                    className={
                      v.configured
                        ? "text-xs text-accent-emerald"
                        : v.required
                          ? "text-xs text-accent-rose"
                          : "text-xs text-ink-dim"
                    }
                  >
                    {v.configured ? (v.displayValue ?? "Set") : v.required ? "Missing" : "Optional"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-muted">
              LLM ready: {config.llmReady ? "yes" : "no"} · Engine enabled:{" "}
              {config.enabled ? "yes" : "no"}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 panel-title">Source events</h3>
              <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                {sources.map((s) => (
                  <li key={s.id} className="rounded border border-surface-border px-2 py-1.5">
                    <p className="font-medium text-ink">{s.title}</p>
                    <p className="text-ink-dim">
                      {s.sourceType} · {s.processed ? "processed" : "new"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 panel-title">Run logs</h3>
              <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
                {runs.map((r) => (
                  <li key={r.id} className="rounded border border-surface-border px-2 py-1.5">
                    <p className="text-ink">
                      {r.trigger} · <span className="capitalize">{r.status}</span>
                    </p>
                    <p className="text-ink-dim">
                      {r.startedAt.toISOString()} · {r.draftCount} draft(s)
                    </p>
                    {r.errorMessage && <p className="text-accent-rose">{r.errorMessage}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
