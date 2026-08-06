import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";
import { ArchitectureFlow } from "@/components/elah-roadmap/architecture-flow";
import { FirstRoundPlan } from "@/components/elah-roadmap/first-round-plan";
import { IntentTaxonomy } from "@/components/elah-roadmap/intent-taxonomy";
import { ProductDefinitionCard } from "@/components/elah-roadmap/product-definition-card";
import { RoadmapHero } from "@/components/elah-roadmap/roadmap-hero";
import { RoadmapTimeline } from "@/components/elah-roadmap/roadmap-timeline";
import { TwelveMonthGoals } from "@/components/elah-roadmap/twelve-month-goals";
import { ScoringContractCard } from "@/components/elah-roadmap/scoring-contract-card";
import { TaskBoard } from "@/components/elah-roadmap/task-board";
import { ThresholdSimulator } from "@/components/elah-roadmap/threshold-simulator";

export const metadata = {
  title: "ELAH Model Roadmap · ELAH Analytics",
  description:
    "Internal roadmap and task list for building the ELAH Banking Intention Model.",
};

export default function ElahModelRoadmapPage() {
  return (
    <div className="min-h-screen bg-surface-base text-ink">
      <header className="border-b border-surface-border bg-surface-raised/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image src="/elah-logo.png" alt="ELAH" width={36} height={36} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-cyan">
                ELAH Analytics · Internal
              </p>
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                <Map className="size-5 text-accent-cyan" />
                ELAH Model Roadmap
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/banking/intent-matrix"
              className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              Intent Matrix
            </Link>
            <Link
              href="/banking/training-dataset"
              className="rounded-lg border border-accent-emerald/30 bg-accent-emerald/10 px-3 py-1.5 text-xs font-medium text-accent-emerald hover:bg-accent-emerald/15"
            >
              Training Dataset
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-lg border border-surface-border px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              <ArrowLeft className="size-3.5" />
              Overview
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <RoadmapHero />
        <ProductDefinitionCard />
        <ArchitectureFlow />
        <ScoringContractCard />
        <IntentTaxonomy />
        <FirstRoundPlan />
        <TwelveMonthGoals />
        <RoadmapTimeline />
        <TaskBoard />
        <ThresholdSimulator />

        <footer className="border-t border-surface-border pt-6 text-center text-xs text-ink-dim">
          ELAH Banking Intention Model · Internal program page · Banking-only MVP
        </footer>
      </main>
    </div>
  );
}
