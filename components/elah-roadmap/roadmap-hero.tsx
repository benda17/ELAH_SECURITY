import { Beaker, KeyRound, Shield } from "lucide-react";
import { HERO_HIGHLIGHTS } from "@/lib/elah-roadmap-data";

const ICONS = {
  shield: Shield,
  key: KeyRound,
  beaker: Beaker,
} as const;

export function RoadmapHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-surface-border bg-surface-raised p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-accent-cyan/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-accent-violet/10 blur-3xl"
        aria-hidden
      />

      <div className="relative">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-cyan">
          Internal · APACT protocol
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          APACT protocol roadmap
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
          What is specified, what the local thin slice proved, and what is not
          built. ELAH V2 is a CAPTCHA for agents. It is not a hosted product yet.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {HERO_HIGHLIGHTS.map(({ title, description, icon }) => {
            const Icon = ICONS[icon];
            return (
              <div
                key={title}
                className="rounded-xl border border-surface-border bg-surface-subtle/50 p-4"
              >
                <div className="mb-2 flex size-9 items-center justify-center rounded-lg border border-accent-cyan/20 bg-accent-cyan/10">
                  <Icon className="size-4 text-accent-cyan" />
                </div>
                <h2 className="text-sm font-semibold text-ink">{title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
