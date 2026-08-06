import Image from "next/image";
import Link from "next/link";
import { Building2, Briefcase } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-base text-ink">
      <header className="border-b border-surface-border bg-surface-raised/80 px-6 py-5">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Image src="/elah-logo.png" alt="ELAH" width={40} height={40} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-cyan">
              ELAH Platform
            </p>
            <h1 className="text-xl font-semibold">Choose your workspace</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-6 px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/banking/dashboard"
            className="group rounded-2xl border border-accent-cyan/25 bg-surface-raised p-6 transition hover:border-accent-cyan/50 hover:bg-accent-cyan/5"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-accent-cyan/30 bg-accent-cyan/10">
              <Building2 className="size-6 text-accent-cyan" />
            </div>
            <h2 className="text-lg font-semibold text-ink group-hover:text-accent-cyan">
              Banking System
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Demo banking environment, AI assistant activity, intent matrix, and agent
              analytics.
            </p>
          </Link>

          <Link
            href="/founder/overview"
            className="group rounded-2xl border border-accent-gold/25 bg-surface-raised p-6 transition hover:border-accent-gold/50 hover:bg-accent-gold/5"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl border border-accent-gold/30 bg-accent-gold/10">
              <Briefcase className="size-6 text-accent-gold" />
            </div>
            <h2 className="text-lg font-semibold text-ink group-hover:text-accent-gold">
              Founder &amp; Manager Admin
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Company roadmap, model roadmap, fundraising, and content automation.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
