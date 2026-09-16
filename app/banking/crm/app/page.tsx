import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { CRM_APP_URL } from "@/lib/crm/config";

export const metadata = { title: "ELAH · CRM App" };

export default function BankingCrmAppPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">ELAH CRM Simulation</h1>
      <p className="mt-2 text-sm text-ink-muted">
        The B2B helpdesk + CRM demo runs as a separate Next.js app (customer portal,
        support chat, analyst events). This dashboard reads CRM logs read-only
        (local SQLite or CRM Neon <code>elah_crm</code>). It never writes to that
        database and never uses the banking Neon.
      </p>
      <Link
        href={CRM_APP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent-cyan px-4 py-2.5 text-sm font-medium text-surface-base"
      >
        Open CRM Demo
        <ExternalLink className="size-4" />
      </Link>
      <p className="mt-4 text-xs text-ink-dim">
        URL: <code>{CRM_APP_URL}</code>
      </p>
    </div>
  );
}
