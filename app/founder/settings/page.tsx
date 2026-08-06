import { getContentEngineConfig } from "@/lib/founder/content-engine/config";
import { getPublishCredentials, linkedInOAuthConfigured } from "@/lib/founder/content-engine/linkedin";
import { getLinkedInIntegration } from "@/lib/founder/content-engine/repository";
import { ConnectLinkedInButton } from "@/components/founder/content-engine-panel";

export const metadata = { title: "ELAH · Founder Settings" };
export const dynamic = "force-dynamic";

export default async function FounderSettingsPage() {
  const config = getContentEngineConfig();
  const [integration, publishCreds] = await Promise.all([
    getLinkedInIntegration(),
    getPublishCredentials(),
  ]);
  const canPublish = Boolean(publishCreds);

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Configuration</p>
        <h1 className="text-2xl font-semibold">Founder Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Setup checklist and environment status. Add values in Vercel — not in this UI.
        </p>
      </header>

      <section className="panel grid gap-4 sm:grid-cols-3">
        <div>
          <p className="panel-title">LLM</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {config.llmReady ? "Ready" : "Not configured"}
          </p>
        </div>
        <div>
          <p className="panel-title">Content engine</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {config.enabled ? "Enabled" : "Disabled"}
          </p>
        </div>
        <div>
          <p className="panel-title">LinkedIn publish</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {canPublish ? "Ready" : "Not connected"}
          </p>
          {integration?.authorUrn && (
            <p className="mt-1 truncate text-[11px] text-ink-dim">{integration.authorUrn}</p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Setup checklist</h2>
            <p className="text-xs text-ink-dim">
              Required missing:{" "}
              {config.missingRequired.length > 0
                ? config.missingRequired.join(", ")
                : "none"}
            </p>
          </div>
          <ConnectLinkedInButton oauthConfigured={linkedInOAuthConfigured()} />
        </div>
        <ul className="space-y-2 text-sm">
          {config.envVars.map((v) => (
            <li
              key={v.key}
              className="flex items-start justify-between gap-4 border-b border-surface-border/40 py-2 last:border-0"
            >
              <div>
                <code className="text-accent-cyan">{v.key}</code>
                <p className="text-xs text-ink-dim">{v.description}</p>
              </div>
              <span
                className={
                  v.configured
                    ? "shrink-0 text-xs text-accent-emerald"
                    : v.required
                      ? "shrink-0 text-xs text-accent-rose"
                      : "shrink-0 text-xs text-ink-dim"
                }
              >
                {v.configured
                  ? (v.displayValue ?? "Set")
                  : v.required
                    ? "Missing"
                    : "Optional"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="mb-3 text-sm font-semibold">Vercel notes</h2>
        <ul className="list-inside list-disc space-y-1 text-xs text-ink-muted">
          {config.vercelNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
          <li>
            Daily cron: <code>0 15 * * *</code> UTC → <code>/api/cron/generate-linkedin-draft</code>
          </li>
          <li>
            OAuth callback: <code>/api/linkedin/callback</code>
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="mb-2 text-sm font-semibold">Banking app URL</h2>
        <p className="text-sm text-ink-muted">
          <code>BANKING_APP_URL</code> / <code>NEXT_PUBLIC_BANKING_APP_URL</code> — links Banking
          System sidebar to the live demo (default <code>http://localhost:3002</code>).
        </p>
      </section>
    </div>
  );
}
