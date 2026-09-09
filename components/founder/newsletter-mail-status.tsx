import { getGmailSendStatus, gmailOAuthConfigured } from "@/lib/newsletter/gmail";

export async function NewsletterMailStatus({ compact = false }: { compact?: boolean }) {
  const status = await getGmailSendStatus();
  if (status.ready) return null;

  return (
    <div className="rounded-xl border border-accent-amber/40 bg-accent-amber/10 px-4 py-3 text-sm text-ink">
      <p className="font-medium text-accent-amber">Gmail is not connected yet</p>
      <p className="mt-1.5 text-ink-muted">
        Newsletters send through your Gmail inbox ({status.fromValue}), the same way LinkedIn
        posts go through LinkedIn. Until you connect that account, Publish stays off so we never
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
      ) : gmailOAuthConfigured() ? (
        <p className="mt-3">
          <a
            href="/api/gmail/connect"
            className="inline-flex rounded-lg border border-accent-gold/40 bg-accent-gold/10 px-4 py-2 text-sm font-medium text-accent-gold hover:bg-accent-gold/20"
          >
            Connect Gmail
          </a>
        </p>
      ) : (
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-ink-muted">
          <li>
            Create a Google Cloud OAuth client (Web application) and enable the Gmail API.
          </li>
          <li>
            Add <code className="text-ink">GOOGLE_CLIENT_ID</code> and{" "}
            <code className="text-ink">GOOGLE_CLIENT_SECRET</code> in{" "}
            <code>.env.local</code> or Vercel.
          </li>
          <li>Restart, then Connect Gmail as elahsecurity@gmail.com.</li>
        </ol>
      )}
    </div>
  );
}
