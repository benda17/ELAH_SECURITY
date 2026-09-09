import {
  ConnectFacebookButton,
  ConnectLinkedInButton,
} from "@/components/founder/content-engine-panel";
import { getContentEngineConfig } from "@/lib/founder/content-engine/config";
import {
  facebookOAuthConfigured,
  getFacebookOAuthDebug,
  getFacebookPublishStatus,
} from "@/lib/founder/content-engine/facebook";
import {
  getLinkedInOAuthDebug,
  getPublishCredentials,
  linkedInOAuthConfigured,
} from "@/lib/founder/content-engine/linkedin";
import { getLinkedInIntegration } from "@/lib/founder/content-engine/repository";
import { NewsletterMailStatus } from "@/components/founder/newsletter-mail-status";
import { resendConfigured } from "@/lib/newsletter/send";

export const metadata = { title: "ELAH · Founder Settings" };
export const dynamic = "force-dynamic";

export default async function FounderSettingsPage() {
  const oauthDebug = getLinkedInOAuthDebug();
  const fbOauth = getFacebookOAuthDebug();
  const [config, facebook, integration, publishCreds] = await Promise.all([
    getContentEngineConfig(),
    getFacebookPublishStatus(),
    getLinkedInIntegration(),
    getPublishCredentials(),
  ]);
  const canPublish = Boolean(publishCreds);
  const resend = resendConfigured();

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Configuration</p>
        <h1 className="text-2xl font-semibold">Founder Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Setup checklist and environment status. Add values in Vercel — not in this UI.
        </p>
      </header>

      <section className="panel grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div>
          <p className="panel-title">Facebook publish</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {facebook.configured ? "Ready" : "Not configured"}
          </p>
          <p className="mt-1 text-[11px] text-ink-dim">
            Auto-publish: {facebook.autoPublish ? "on" : "off"}
            {facebook.pageName ? ` · ${facebook.pageName}` : ""}
          </p>
        </div>
        <div>
          <p className="panel-title">X / Twitter publish</p>
          <p className="mt-1 text-sm font-medium text-ink">Copy & paste</p>
          <p className="mt-1 text-[11px] text-ink-dim">
            Opens x.com compose. No paid posting API.
          </p>
        </div>
        <div>
          <p className="panel-title">Weekly Newsletter</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {resend.apiKey ? "Ready" : "Not connected"}
          </p>
          <p className="mt-1 text-[11px] text-ink-dim">
            {resend.apiKey ? `From ${resend.fromValue}` : "Needs a Resend API key"}
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">LinkedIn Connect</h2>
            <p className="mt-1 text-xs text-ink-dim">
              redirect: <code>{oauthDebug.redirectUri}</code>
              <br />
              scopes: <code>{oauthDebug.scopes}</code> · client id:{" "}
              {oauthDebug.clientIdSet ? "set" : "missing"} · secret:{" "}
              {oauthDebug.clientSecretSet ? "set" : "missing"}
            </p>
          </div>
          <ConnectLinkedInButton oauthConfigured={linkedInOAuthConfigured()} />
        </div>
      </section>

      <section className="panel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Facebook Connect</h2>
            <p className="mt-1 text-xs text-ink-dim">
              redirect: <code>{fbOauth.redirectUri}</code>
              <br />
              scopes: <code>{fbOauth.scopes}</code> · app id:{" "}
              {fbOauth.appIdSet ? "set" : "missing"} · secret:{" "}
              {fbOauth.appSecretSet ? "set" : "missing"}
            </p>
          </div>
          <ConnectFacebookButton oauthConfigured={facebookOAuthConfigured()} />
        </div>
        {!facebook.oauthConfigured ? (
          <ol className="list-decimal space-y-1 pl-5 text-xs text-ink-muted">
            <li>
              Create/open an app at{" "}
              <a
                className="text-accent-cyan underline"
                href="https://developers.facebook.com/apps/"
                target="_blank"
                rel="noreferrer"
              >
                Meta for Developers
              </a>
              .
            </li>
            <li>
              Set <code>FACEBOOK_APP_ID</code> and <code>FACEBOOK_APP_SECRET</code> in{" "}
              <code>.env.local</code>, restart, then Connect.
            </li>
          </ol>
        ) : (
          <p className="text-xs text-ink-muted">
            Connect once as a Page admin. Posts always auto-publish to{" "}
            <strong>ELAH Security</strong>. Redirect URI: <code>{fbOauth.redirectUri}</code>
          </p>
        )}
      </section>

      <section className="panel">
        <div className="mb-4">
          <h2 className="text-sm font-semibold">Weekly Newsletter</h2>
          <p className="mt-1 text-xs text-ink-dim">
            Content Engine writes the weekly newsletter. Resend delivers it to subscribers.
            Keys are not pasted in this UI — they live in <code>.env.local</code> or Vercel.
          </p>
        </div>
        <NewsletterMailStatus />
      </section>

      <section className="panel">
        <div className="mb-4">
          <h2 className="text-sm font-semibold">X / Twitter (copy & paste)</h2>
          <p className="mt-1 text-xs text-ink-dim">
            Same flow as LinkedIn. No developer keys and no paid posting API.
          </p>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-xs text-ink-muted">
          <li>
            Content Engine → <strong>Post to X</strong> copies the same full post as LinkedIn /
            Facebook and opens{" "}
            <a
              className="text-accent-cyan underline"
              href="https://x.com/compose/post"
              target="_blank"
              rel="noreferrer"
            >
              x.com/compose/post
            </a>
            .
          </li>
          <li>Paste, post as the ELAH account, then click <strong>Mark as posted on X</strong>.</li>
          <li>
            For the landing-page thread, each click copies the next tweet so you can paste it as a
            reply.
          </li>
        </ol>
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
            Content cron (3× daily UTC): <code>0 6,12,18 * * *</code> →{" "}
            <code>/api/cron/generate-linkedin-draft</code>
          </li>
          <li>
            OAuth callbacks: <code>/api/linkedin/callback</code>,{" "}
            <code>/api/facebook/callback</code>
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
