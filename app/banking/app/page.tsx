import Link from "next/link";
import { ExternalLink } from "lucide-react";

const BANKING_APP_URL =
  process.env.BANKING_APP_URL ?? process.env.NEXT_PUBLIC_BANKING_APP_URL ?? "http://localhost:3002";

export default function BankingAppPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">ELAH Banking App</h1>
      <p className="mt-2 text-sm text-ink-muted">
        The interactive banking demo runs as a separate Next.js application with customer
        portal, AI assistant, and admin security views.
      </p>
      <Link
        href={BANKING_APP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-cyan px-4 py-2.5 text-sm font-medium text-surface-base"
      >
        Open Banking Demo
        <ExternalLink className="size-4" />
      </Link>
      <p className="mt-4 text-xs text-ink-dim">
        URL: <code>{BANKING_APP_URL}</code>
      </p>
    </div>
  );
}
