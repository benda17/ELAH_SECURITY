import { ContentDailyChart } from "@/components/founder/content-daily-chart";
import {
  ConnectFacebookButton,
  ConnectLinkedInButton,
  GenerateDraftButton,
  PostCard,
} from "@/components/founder/content-engine-panel";
import { getContentEngineConfig } from "@/lib/founder/content-engine/config";
import {
  facebookOAuthConfigured,
  getFacebookPublishStatus,
} from "@/lib/founder/content-engine/facebook";
import {
  getElahCompanyAdminPostsUrl,
  getLinkedInConnectionStatus,
  linkedInOAuthConfigured,
} from "@/lib/founder/content-engine/linkedin";
import {
  countLinkedInPostsByStatus,
  getDailyPostSeries,
  listContentEngineRuns,
  listLinkedInDrafts,
  listSourceEvents,
} from "@/lib/founder/content-engine/repository";

export const dynamic = "force-dynamic";

export default async function ContentEnginePage({
  searchParams,
}: {
  searchParams?: { linkedin?: string; facebook?: string; status?: string };
}) {
  const statusFilter = searchParams?.status?.trim() || "all";

  const [config, facebook, posts, counts, runs, sources, connection, dailySeries] =
    await Promise.all([
      getContentEngineConfig(),
      getFacebookPublishStatus(),
      listLinkedInDrafts(80),
      countLinkedInPostsByStatus(),
      listContentEngineRuns(),
      listSourceEvents(),
      getLinkedInConnectionStatus(),
      getDailyPostSeries(30),
    ]);

  const canPublish = connection.canPublish;
  const companyAdminUrl = getElahCompanyAdminPostsUrl();
  const linkedinFlash = searchParams?.linkedin;
  const facebookFlash = searchParams?.facebook;
  const filtered =
    statusFilter === "all" ? posts : posts.filter((p) => p.status === statusFilter);

  const filters: Array<{ key: string; label: string; count: number }> = [
    { key: "all", label: "All", count: posts.length },
    { key: "published", label: "Published", count: counts.published ?? 0 },
    { key: "draft", label: "Drafts", count: counts.draft ?? 0 },
    { key: "approved", label: "Approved", count: counts.approved ?? 0 },
    { key: "rejected", label: "Rejected", count: counts.rejected ?? 0 },
  ];

  const createdTotal = dailySeries.reduce((n, d) => n + d.created, 0);
  const publishedTotal = dailySeries.reduce((n, d) => n + d.published, 0);
  const facebookTotal = dailySeries.reduce((n, d) => n + d.facebook, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="panel-title">Content automation</p>
          <h1 className="text-2xl font-semibold">Content Engine</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            Generate, review, and publish LinkedIn + Facebook posts. Configure secrets under{" "}
            <a href="/founder/settings" className="text-accent-cyan hover:underline">
              Settings
            </a>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <GenerateDraftButton />
          <ConnectLinkedInButton
            oauthConfigured={linkedInOAuthConfigured()}
            reconnectForCompany={connection.missingOrgPermission || connection.tokenSaved}
          />
          <ConnectFacebookButton oauthConfigured={facebookOAuthConfigured()} />
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
      {facebookFlash === "connected" && (
        <p className="rounded-lg border border-accent-emerald/40 bg-accent-emerald/10 px-3 py-2 text-sm text-accent-emerald">
          Facebook connected — auto-publishing to ELAH Security.
        </p>
      )}
      {facebookFlash === "connected_no_page" && (
        <p className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-sm text-accent-amber">
          Facebook connected, but the ELAH Security page was not found for this account.
        </p>
      )}
      {facebookFlash?.startsWith("error:") && (
        <p className="rounded-lg border border-accent-rose/40 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
          Facebook connect failed: {decodeURIComponent(facebookFlash.slice(6))}
        </p>
      )}

      {facebook.configured && (
        <p className="rounded-lg border border-[#1877F2]/40 bg-[#1877F2]/10 px-3 py-2 text-sm text-[#60a5fa]">
          Facebook auto-publish: ELAH Security
          {facebook.autoPublish ? " · on" : " · off"}
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
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Content graph</h2>
            <p className="text-xs text-ink-dim">
              Daily activity · last 30 days · created {createdTotal} · published{" "}
              {publishedTotal} · Facebook {facebookTotal}
            </p>
          </div>
          <p className="text-[11px] text-ink-dim">
            Facebook: {facebook.configured ? "ELAH Security ready" : "not configured"}
            {facebook.autoPublish ? " · auto-publish on" : " · auto-publish off"}
            {" · cron 3×/day"}
          </p>
        </div>
        <ContentDailyChart data={dailySeries} />
      </section>

      <section className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Posts</h2>
            <p className="text-xs text-ink-dim">
              LinkedIn ready: {canPublish ? "yes" : "no"} · Token:{" "}
              {connection.tokenSaved ? "saved" : "missing"} · LI auto-publish:{" "}
              {config.autoPublish ? "on" : "off"} · FB auto-publish:{" "}
              {facebook.autoPublish ? "on" : "off"}
              {connection.authorUrn ? ` · ${connection.authorUrn}` : ""}
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
                facebookPostId={d.facebookPostId}
                facebookPublishedAt={d.facebookPublishedAt?.toISOString() ?? null}
                canPublish={canPublish}
                canPublishFacebook={facebook.configured}
                companyAdminUrl={companyAdminUrl}
              />
            ))
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel">
          <h2 className="mb-3 panel-title">Source events</h2>
          <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
            {sources.length === 0 ? (
              <li className="text-ink-muted">No source events yet.</li>
            ) : (
              sources.map((s) => (
                <li key={s.id} className="rounded border border-surface-border px-2 py-1.5">
                  <p className="font-medium text-ink">{s.title}</p>
                  <p className="text-ink-dim">
                    {s.sourceType} · {s.processed ? "processed" : "new"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="panel">
          <h2 className="mb-3 panel-title">Run logs</h2>
          <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
            {runs.length === 0 ? (
              <li className="text-ink-muted">No runs yet.</li>
            ) : (
              runs.map((r) => (
                <li key={r.id} className="rounded border border-surface-border px-2 py-1.5">
                  <p className="text-ink">
                    {r.trigger} · <span className="capitalize">{r.status}</span>
                  </p>
                  <p className="text-ink-dim">
                    {r.startedAt.toISOString()} · {r.draftCount} draft(s)
                  </p>
                  {r.errorMessage && <p className="text-accent-rose">{r.errorMessage}</p>}
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
