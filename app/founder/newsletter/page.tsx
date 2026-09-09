import { NewsletterComposeForm } from "@/components/founder/newsletter-compose";
import { NewsletterMailStatus } from "@/components/founder/newsletter-mail-status";
import {
  countNewsletterSubscribers,
  listNewsletterSubscribers,
} from "@/lib/newsletter/repository";
import { getGmailSendStatus } from "@/lib/newsletter/gmail";

export const metadata = { title: "ELAH · Weekly Newsletter" };
export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const gmail = await getGmailSendStatus();
  const mailReady = gmail.ready;

  let count = 0;
  let subscribers: Awaited<ReturnType<typeof listNewsletterSubscribers>> = [];
  let loadError: string | null = null;

  try {
    [count, subscribers] = await Promise.all([
      countNewsletterSubscribers(),
      listNewsletterSubscribers(),
    ]);
  } catch {
    loadError =
      "Could not read NewsletterSubscriber rows. Run a local Prisma migrate against this schema, then npx prisma generate.";
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Content manager</p>
        <h1 className="text-2xl font-semibold">Weekly Newsletter</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Compose the weekly newsletter and send it to every address that opted
          in on the marketing hero. Subscribers are stored here — the webpage
          only POSTs the form.
        </p>
      </header>

      <NewsletterMailStatus />

      {loadError ? (
        <p className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 px-3 py-2 text-sm text-accent-amber">
          {loadError}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="panel py-4">
          <p className="panel-title">Subscribers</p>
          <p className="stat-value mt-1 text-2xl">{loadError ? "—" : count}</p>
          <p className="mt-1 text-xs text-ink-dim">From the database, not a placeholder</p>
        </div>
        <div className="panel py-4">
          <p className="panel-title">Email sending</p>
          <p className="stat-value mt-1 text-2xl">{mailReady ? "Ready" : "Off"}</p>
          <p className="mt-1 text-xs text-ink-dim">
            {gmail.ready
              ? `Gmail · ${gmail.fromValue}`
              : "Connect Gmail in Settings to publish"}
          </p>
        </div>
      </section>

      <section className="panel">
        <h2 className="mb-3 text-sm font-semibold">Compose</h2>
        <NewsletterComposeForm
          subscriberCount={count}
          resendReady={mailReady}
          fromValue={gmail.fromValue}
        />
      </section>

      <section className="panel">
        <h2 className="mb-3 text-sm font-semibold">Subscriber list</h2>
        {loadError ? (
          <p className="text-sm text-ink-muted">List unavailable until the table exists.</p>
        ) : subscribers.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No subscribers yet. The marketing hero form writes here after consent.
          </p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
            {subscribers.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded border border-surface-border px-2 py-1.5"
              >
                <span className="text-ink">{s.email}</span>
                <span className="text-[11px] text-ink-dim">
                  {s.source} · {s.createdAt.toISOString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
