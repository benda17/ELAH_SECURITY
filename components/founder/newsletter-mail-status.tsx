import { resendConfigured } from "@/lib/newsletter/send";

export function NewsletterMailStatus({ compact = false }: { compact?: boolean }) {
  const resend = resendConfigured();

  if (resend.apiKey) return null;

  return (
    <div className="rounded-xl border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-sm text-ink">
      <p className="font-medium text-accent-amber">Email sending is not connected yet</p>
      <p className="mt-1.5 text-ink-muted">
        This page writes the newsletter. A mail service called{" "}
        <a
          href="https://resend.com"
          target="_blank"
          rel="noreferrer"
          className="text-accent-cyan hover:underline"
        >
          Resend
        </a>{" "}
        is what actually delivers it, the same way LinkedIn delivers LinkedIn posts.
        Until a Resend API key is in the environment, Publish stays off so we never
        pretend an email went out.
      </p>
      {compact ? (
        <p className="mt-2 text-xs text-ink-dim">
          Setup steps are on{" "}
          <a href="/founder/settings" className="text-accent-cyan hover:underline">
            Settings
          </a>
          . You can still write and preview here.
        </p>
      ) : (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-ink-muted">
          <li>
            Create a free API key at{" "}
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-accent-cyan hover:underline"
            >
              resend.com/api-keys
            </a>
            .
          </li>
          <li>
            Add it as <code className="text-ink">RESEND_API_KEY</code> in{" "}
            <code>.env.local</code> on this machine, or in Vercel → Environment
            Variables for production.
          </li>
          <li>Restart the Founder app, then publish.</li>
        </ol>
      )}
    </div>
  );
}
