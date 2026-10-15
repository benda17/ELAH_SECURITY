import { ContentDailyChart } from "@/components/founder/content-daily-chart";
import {
  ConnectFacebookButton,
  ConnectLinkedInButton,
  ContentEraSwitch,
  GenerateDraftButton,
  PostCard,
  PostLandingThreadButton,
} from "@/components/founder/content-engine-panel";
import { NewsletterComposeForm } from "@/components/founder/newsletter-compose";
import { NewsletterMailStatus } from "@/components/founder/newsletter-mail-status";
import { countNewsletterSubscribers } from "@/lib/newsletter/repository";
import { getGmailSendStatus } from "@/lib/newsletter/gmail";
import {
  facebookOAuthConfigured,
  getFacebookPublishStatus,
} from "@/lib/founder/content-engine/facebook";
import {
  getElahCompanyAdminPostsUrl,
  getLinkedInConnectionStatus,
  linkedInOAuthConfigured,
} from "@/lib/founder/content-engine/linkedin";
import { getLandingThreadStatus } from "@/lib/founder/content-engine/landing-thread";
import { readContentEngineCache } from "@/lib/founder/content-engine/page-cache";
import { parseTwitterPublishNote } from "@/lib/founder/content-engine/twitter";
import {
  countLinkedInPostsByStatus,
  getDailyPostSeries,
  listContentEngineRuns,
  listLinkedInDrafts,
  listSourceEvents,
  type ContentEra,
} from "@/lib/founder/content-engine/repository";

export const dynamic = "force-dynamic";

function contentEngineHref(status: string, era: ContentEra) {
  const params = new URLSearchParams();
  if (era === "v1") params.set("era", "v1");
  if (status !== "queue") params.set("status", status);
  const query = params.toString();
  return query ? `/founder/content-engine?${query}` : "/founder/content-engine";
}

function sourceEraLabel(metadata: string): string | null {
  try {
    const parsed = JSON.parse(metadata) as { era?: string };
    return parsed.era === "v2" ? "v2" : null;
  } catch {
    return null;
  }
}

export default async function ContentEnginePage({
  searchParams,
}: {
  searchParams?: { linkedin?: string; facebook?: string; status?: string; era?: string };
}) {
  const statusFilter = searchParams?.status?.trim() || "queue";
  const era: ContentEra = searchParams?.era === "v1" ? "v1" : "v2";

  const {
    facebook,
    posts,
    counts,
    runs,
    sources,
    connection,
    dailySeries,
    landingThread,
    gmail,
    subscriberCount,
    subscriberLoadError,
  } = await readContentEngineCache(era, async () => {
    const [facebook, posts, counts, runs, sources, connection, dailySeries, landingThread, gmail] =
      await Promise.all([
        getFacebookPublishStatus(),
        listLinkedInDrafts(200, era),
        countLinkedInPostsByStatus(era),
        listContentEngineRuns(),
        listSourceEvents(),
        getLinkedInConnectionStatus(),
        getDailyPostSeries(30, era),
        getLandingThreadStatus(),
        getGmailSendStatus(),
      ]);

    let subscriberCount = 0;
    let subscriberLoadError: string | null = null;
    try {
      subscriberCount = await countNewsletterSubscribers();
    } catch {
      subscriberLoadError =
        "Could not read newsletter subscribers. Run a Prisma migrate against this schema, then npx prisma generate.";
    }

    return {
      facebook,
      posts,
      counts,
      runs,
      sources,
      connection,
      dailySeries,
      landingThread,
      gmail,
      subscriberCount,
      subscriberLoadError,
    };
  });

  const mailReady = gmail.ready;

  const canPublish = connection.canPublish;
  const companyAdminUrl = getElahCompanyAdminPostsUrl();
  const linkedinFlash = searchParams?.linkedin;
  const facebookFlash = searchParams?.facebook;
  const queuePosts = posts.filter((p) => p.status !== "published");
  const filtered =
    statusFilter === "all"
      ? posts
      : statusFilter === "queue"
        ? queuePosts
        : posts.filter((p) => p.status === statusFilter);

  const filters: Array<{ key: string; label: string; count: number }> = [
    { key: "queue", label: "To post", count: queuePosts.length },
    { key: "draft", label: "Drafts", count: counts.draft ?? 0 },
    { key: "approved", label: "Approved", count: counts.approved ?? 0 },
    { key: "published", label: "Published", count: counts.published ?? 0 },
    { key: "rejected", label: "Rejected", count: counts.rejected ?? 0 },
    { key: "all", label: "All", count: posts.length },
  ];

  const createdTotal = dailySeries.reduce((n, d) => n + d.created, 0);
  const publishedTotal = dailySeries.reduce((n, d) => n + d.published, 0);
  const facebookTotal = dailySeries.reduce((n, d) => n + d.facebook, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <img
            src="/dave/dave-hero.jpg"
            alt="Dave, the ELAH mascot"
            width={112}
            height={112}
            className="h-28 w-28 shrink-0 rounded-2xl bg-white object-cover"
          />
          <div>
          <p className="panel-title">Content automation</p>
          <h1 className="text-2xl font-semibold">Content Engine</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">
            {era === "v2"
              ? "Current drafts are company posts for ELAH V2: verified, limited access for AI agents. Generate Now writes a new post from a research angle. ELAH V1 banking drafts stay in the archive."
              : "Archive of pre-pivot drafts from the banking and CS-CRM intention-scoring product. These rows are kept. New drafts are written to ELAH V2."}
          </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <GenerateDraftButton era={era} />
          <ConnectLinkedInButton
            oauthConfigured={linkedInOAuthConfigured()}
            reconnectForCompany={connection.missingOrgPermission || connection.tokenSaved}
          />
          <ConnectFacebookButton oauthConfigured={facebookOAuthConfigured()} />
          <PostLandingThreadButton alreadyPosted={landingThread.posted} />
        </div>
      </header>

      <ContentEraSwitch era={era} status={statusFilter} />

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
          Facebook connected — ready to publish drafts to ELAH Security.
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
          Facebook ready: ELAH Security · publish from each draft
        </p>
      )}
      <p className="rounded-lg border border-ink/20 bg-ink/5 px-3 py-2 text-sm text-ink">
        X posting is copy-and-paste. Each draft is automatically shortened to at most 280
        characters, including the ELAH link when shortening is needed, then X compose opens.
        Landing-page thread:{" "}
        {landingThread.posted
          ? "already marked posted."
          : "use the button above — each click copies the next tweet."}
      </p>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {filters
          .filter((f) => f.key !== "all" && f.key !== "queue")
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
            <p className="panel-title">Email</p>
            <h2 className="text-sm font-semibold">Weekly Newsletter</h2>
            <p className="mt-1 text-xs text-ink-dim">
              Write the weekly newsletter and publish it to every opt-in address.
              Subscriber list lives under{" "}
              <a href="/founder/newsletter" className="text-accent-cyan hover:underline">
                Weekly Newsletter
              </a>
              .
            </p>
          </div>
          <div className="text-right">
            <p className="stat-value text-2xl">{subscriberLoadError ? "—" : subscriberCount}</p>
            <p className="text-[11px] text-ink-dim">
              Recipients · {mailReady ? "Gmail connected" : "Gmail not connected"}
            </p>
          </div>
        </div>

        <NewsletterMailStatus compact />

        {subscriberLoadError ? (
          <p className="mb-4 rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-sm text-accent-amber">
            {subscriberLoadError}
          </p>
        ) : null}

        <NewsletterComposeForm
          subscriberCount={subscriberCount}
          resendReady={mailReady}
          fromValue={gmail.fromValue}
        />
      </section>

      <section className="panel">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Content graph</h2>
            <p className="text-xs text-ink-dim">
              Daily activity for {era === "v2" ? "ELAH V2" : "ELAH V1"} · last 30 days · created{" "}
              {createdTotal} · published {publishedTotal} · Facebook {facebookTotal}
            </p>
          </div>
          <p className="text-[11px] text-ink-dim">
            Facebook: {facebook.configured ? "ELAH Security ready" : "not configured"}
            {" · cron 3×/day · generate creates drafts only"}
          </p>
        </div>
        <ContentDailyChart data={dailySeries} />
      </section>

      <section className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Posts</h2>
            <p className="text-xs text-ink-dim">
              {era === "v2" ? "ELAH V2 — Agentic AI CAPTCHA" : "ELAH V1 — archive"} · Generate
              leaves V2 drafts for review · LinkedIn ready: {canPublish ? "yes" : "no"} · Facebook:{" "}
              {facebook.configured ? "ready" : "off"} · X: copy & paste
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => {
              const active = statusFilter === f.key;
              const href = contentEngineHref(f.key, era);
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
              {era === "v1"
                ? "No ELAH V1 drafts in this view."
                : statusFilter === "queue"
                  ? "No ELAH V2 drafts left to post. Switch to Published / All, or click Generate Now."
                  : "No ELAH V2 drafts in this view yet. Click Generate Now to create one."}
            </p>
          ) : (
            filtered.map((d) => {
              const twitter = parseTwitterPublishNote(d.reviewerNotes);
              return (
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
                twitterPostId={twitter.twitterPostId}
                twitterPublishedAt={twitter.twitterPublishedAt}
                canPublish={canPublish}
                canPublishFacebook={facebook.configured}
                companyAdminUrl={companyAdminUrl}
              />
              );
            })
          )}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel">
          <h2 className="mb-3 panel-title">Source events</h2>
          <p className="mb-2 text-[11px] text-ink-dim">
            New drafts are written from these research angles. Earlier events stay in the list and
            are not used for generation.
          </p>
          <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
            {sources.length === 0 ? (
              <li className="text-ink-muted">No source events yet.</li>
            ) : (
              sources.map((s) => {
                const eraLabel = sourceEraLabel(s.metadata);
                return (
                  <li key={s.id} className="rounded border border-surface-border px-2 py-1.5">
                    <p className="font-medium text-ink">{s.title}</p>
                    <p className="text-ink-dim">
                      {s.sourceType}
                      {eraLabel ? ` · ${eraLabel}` : ""} · {s.processed ? "processed" : "new"}
                    </p>
                  </li>
                );
              })
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
