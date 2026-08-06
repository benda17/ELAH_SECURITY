import { getContentEngineConfig } from "@/lib/founder/content-engine/config";
import {
  getLinkedInIntegration,
  listContentEngineRuns,
  listLinkedInDrafts,
  listSourceEvents,
} from "@/lib/founder/content-engine/repository";
import {
  DraftActions,
  GenerateDraftButton,
} from "@/components/founder/content-engine-panel";

export const dynamic = "force-dynamic";

export default async function ContentEnginePage() {
  const config = getContentEngineConfig();
  const [drafts, runs, sources, integration] = await Promise.all([
    listLinkedInDrafts(),
    listContentEngineRuns(),
    listSourceEvents(),
    getLinkedInIntegration(),
  ]);

  const publishDisabled = !config.linkedInReady || !config.autoPublish;

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Content automation</p>
        <h1 className="text-2xl font-semibold">Content Engine</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          LinkedIn draft generation for founder posts. Configure secrets in Vercel — never
          paste production keys into this UI.
        </p>
      </header>

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
        {config.missingRequired.length > 0 && (
          <p className="mt-3 text-xs text-accent-amber">
            Missing required: {config.missingRequired.join(", ")}
          </p>
        )}
      </section>

      <section className="panel grid gap-4 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold">Generate draft</h2>
          <GenerateDraftButton />
          <p className="mt-2 text-xs text-ink-dim">
            Engine enabled: {config.enabled ? "yes" : "no (set CONTENT_ENGINE_ENABLED=true)"}
          </p>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">Publish</h2>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg border border-surface-border px-4 py-2 text-sm text-ink-dim"
            title={
              publishDisabled
                ? "Configure LinkedIn + CONTENT_AUTO_PUBLISH in Vercel first"
                : undefined
            }
          >
            Publish to LinkedIn (disabled)
          </button>
          <p className="mt-2 text-xs text-ink-dim">
            LinkedIn configured: {config.linkedInReady ? "yes" : "no"} · Auto-publish:{" "}
            {config.autoPublish ? "on" : "off (recommended)"}
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
          <li>Endpoint: <code>/api/cron/generate-linkedin-draft</code></li>
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel">
          <h2 className="mb-3 panel-title">Source events</h2>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-xs">
            {sources.map((s) => (
              <li key={s.id} className="rounded border border-surface-border px-2 py-1.5">
                <p className="font-medium text-ink">{s.title}</p>
                <p className="text-ink-dim">{s.sourceType} · {s.processed ? "processed" : "new"}</p>
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
                {r.errorMessage && (
                  <p className="text-accent-rose">{r.errorMessage}</p>
                )}
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
                <DraftActions draftId={d.id} body={d.body} status={d.status} />
              </div>
            ))
          )}
        </div>
      </section>

      {integration && (
        <p className="text-xs text-ink-dim">
          LinkedIn integration record present · publish enabled:{" "}
          {integration.publishEnabled ? "yes" : "no"}
        </p>
      )}
    </div>
  );
}
