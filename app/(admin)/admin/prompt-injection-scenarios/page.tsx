import { Bug, ShieldOff } from "lucide-react";
import { requireSecurity } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/logging/logger";
import { PageShell, SectionHeader } from "@/components/layout/page-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UntrustedContent } from "@/components/ui/untrusted";

export const dynamic = "force-dynamic";

export default async function PromptInjectionScenariosPage() {
  await requireSecurity();

  const scenarios = await prisma.promptInjectionScenario.findMany({
    orderBy: { createdAt: "asc" },
  });

  await writeAuditLog({
    actionType: "prompt_injection_scenarios_viewed",
    page: "/admin/prompt-injection-scenarios",
    toolOrFeatureUsed: "scenario_catalog",
    riskLevel: "low",
    actionOutcome: "viewed",
    inputDataSummary: { catalogSize: scenarios.length },
  });

  return (
    <PageShell>
      <SectionHeader
        title="Prompt-injection scenarios"
        description="Catalogued, controlled test cases. Scenario text is always marked as untrusted simulation content."
      />

      <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/5 p-4 text-sm text-accent-rose">
        <div className="inline-flex items-center gap-2 font-semibold">
          <ShieldOff className="size-4" /> Simulation only
        </div>
        <p className="mt-1 text-xs text-ink">
          These scenarios are test fixtures. The application never executes
          their instructions and never performs real exploits.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {scenarios.map((s) => (
          <Card key={s.id}>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-2">
                  <Bug className="size-4 text-accent-gold" />
                  {s.name}
                </span>
              }
              description={`Location: ${s.injectionLocation.replaceAll("_", " ")}`}
              action={<Badge variant="warning">{s.status}</Badge>}
            />
            <UntrustedContent variant="danger" label="Malicious sample (test fixture)">
              {s.maliciousTextSample}
            </UntrustedContent>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
              <KV k="Expected unsafe behavior" v={s.expectedUnsafeBehavior} />
              <KV k="Expected ELAH detection" v={s.expectedElahDetection} />
              <KV
                k="Relevant log fields"
                v={safeParse(s.relatedLogFields).join(", ")}
              />
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
        {k}
      </div>
      <div className="text-ink">{v}</div>
    </div>
  );
}

function safeParse(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}
