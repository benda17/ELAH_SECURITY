import { getContentEngineConfig } from "@/lib/founder/content-engine/config";
import { getPublishCredentials, linkedInOAuthConfigured } from "@/lib/founder/content-engine/linkedin";
import {
  getLinkedInIntegration,
  listContentEngineRuns,
  listLinkedInDrafts,
  listSourceEvents,
} from "@/lib/founder/content-engine/repository";
import {
  ConnectLinkedInButton,
  DraftActions,
  GenerateDraftButton,
} from "@/components/founder/content-engine-panel";

export const dynamic = "force-dynamic";

export default async function ContentEnginePage({
  searchParams,
}: {
  searchParams?: { linkedin?: string };
}) {
  const config = getContentEngineConfig();
  const [drafts, runs, sources, integration, publishCreds] = await Promise.all([
    listLinkedInDrafts(),
    listContentEngineRuns(),
    listSourceEvents(),
    getLinkedInIntegration(),
    getPublishCredentials(),
  ]);

  const canPublish = Boolean(publishCreds);
  const linkedinFlash = searchParams?.linkedin;

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Content automation</p>
        <h1 className="text-2xl font-semibold">Content Engine</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Free Groq (or Gemini) draft generation + LinkedIn publishing. Configure secrets in
          Vercel — never paste production keys into this UI.
        </p>
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

      <section className="panel">
        <h2 className="mb-3 text-sm font-semibold">Setup checklist</h2>
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
          LLM ready: {config.llmReady ? "yes" : "no"} · LinkedIn publish ready:{" "}
          {canPublish ? "yes" : "no"}
        </p>
      </section>

      <section className="panel grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold">Generate draft</h2>
          <GenerateDraftButton />
          <p className="mt-2 text-xs text-ink-dim">
            Engine enabled: {config.enabled ? "yes" : "no (set CONTENT_ENGINE_ENABLED=true for cron)"}
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">LinkedIn</h2>
          <ConnectLinkedInButton oauthConfigured={linkedInOAuthConfigured()} />
          <p className="mt-2 text-xs text-ink-dim">
            Connected: {canPublish ? "yes" : "no"} · Auto-publish:{" "}
            {config.autoPublish ? "on" : "off"}
            {integration?.authorUrn ? ` · ${integration.authorUrn}` : ""}
          </p>
        </div>
      </section>

      <section className="panel">
        <h2 className="mb-3 text-sm font-semibold">Vercel deployment</h2>
        <ul className="list-inside list-disc space-y-1 text-xs text-ink-muted">
          {config.vercelNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
          <li>
            Daily cron: <code>0 15 * * *</code> UTC (≈ 18:00 Israel Daylight Time)
          </li>
          <li>
            Endpoint: <code>/api/cron/generate-linkedin-draft</code>
          </li>
          <li>
            OAuth callback: <code>/api/linkedin/callback</code>
          </li>
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel">
          <h2 className="mb-3 panel-title">Source events</h2>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
            {sources.map((s) => (
              <li key={s.id} className="rounded border border-surface-border px-2 py-1.5">
                <p className="font-medium text-ink">{s.title}</p>
                <p className="text-ink-dim">
                  {s.sourceType} · {s.processed ? "processed" : "new"}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2 className="mb-3 panel-title">Run logs</h2>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
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
        </section>
      </div>

      <section className="panel">
        <h2 className="mb-3 panel-title">LinkedIn post drafts</h2>
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <p className="text-sm text-ink-muted">No drafts yet. Click Generate Now.</p>
          ) : (
            drafts.map((d) => (
              <div key={d.id} className="rounded-xl border border-surface-border p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{d.title ?? "Untitled draft"}</p>
                  <span className="text-xs capitalize text-ink-dim">{d.status}</span>
                </div>
                <DraftActions
                  draftId={d.id}
                  body={d.body}
                  status={d.status}
                  canPublish={canPublish}
                />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
