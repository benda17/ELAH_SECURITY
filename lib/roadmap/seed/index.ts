import { prisma } from "@/lib/prisma";
import { CRITICAL_PATH_FRAGMENTS } from "../constants";
import type { TaskPriority, TaskStatus } from "../types";
import { MILESTONE_SPECS, PHASE_SPECS } from "./phases";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

/** Repository evidence — do not mark done without proof. */
function inferStatus(phase: string, title: string): {
  status: TaskStatus;
  progress: number;
  notes?: string;
} {
  const t = title.toLowerCase();

  const donePatterns: { match: string; note: string }[] = [
    {
      match: "validate that existing banking functionality remains intact",
      note: "Banking simulator runs with customer/manager/admin flows in ELAH_SECURITY---Banking-System.",
    },
  ];

  for (const d of donePatterns) {
    if (t.includes(d.match)) {
      return { status: "done", progress: 100, notes: d.note };
    }
  }

  const inProgressPatterns: { phases?: string[]; match: string; note: string }[] = [
    {
      phases: ["Phase 1"],
      match: "audit the existing banking simulator",
      note: "Next.js banking app with Prisma users, accounts, transactions exists.",
    },
    {
      phases: ["Phase 1"],
      match: "verify the simulated user",
      note: "~20 seeded users in prisma/seed.ts.",
    },
    {
      phases: ["Phase 2"],
      match: "capture assistant messages",
      note: "AgentMessage model and orchestrator persist turns.",
    },
    {
      phases: ["Phase 2"],
      match: "capture tool-call",
      note: "AgentActionLog and tool execution in lib/agent/.",
    },
    {
      phases: ["Phase 2"],
      match: "audit the integrated ai banking agent",
      note: "Assistant at /assistant with OpenAI orchestrator.",
    },
    {
      phases: ["Phase 4"],
      match: "convert existing simulator logs",
      note: "ElahTrainingEvent model and backfill scripts exist.",
    },
    {
      phases: ["Phase 4"],
      match: "define the label taxonomy",
      note: "Banking intents defined in lib/elah/types.ts and roadmap data.",
    },
    {
      phases: ["Phase 5"],
      match: "build a deterministic rules-based baseline",
      note: "calculateInitialElahScore in lib/elah/helpers.ts.",
    },
    {
      phases: ["Phase 5"],
      match: "display baseline outputs in the dashboard",
      note: "Training dataset and analytics pages show scores.",
    },
    {
      phases: ["Phase 7"],
      match: "create a three-layer intention visualization",
      note: "/intent-matrix page with 3D visualization.",
    },
    {
      phases: ["Phase 7"],
      match: "finalize the dimensions of the intention graph",
      note: "Human Agency, Financial Risk, Emotional Urgency in schema.",
    },
    {
      phases: ["Phase 9"],
      match: "build the elah operational dashboard",
      note: "Analytics dashboard at port 3001 with overview + training dataset.",
    },
    {
      phases: ["Phase 9"],
      match: "add event list",
      note: "Training dataset page lists ElahTrainingEvent rows.",
    },
    {
      phases: ["Phase 0"],
      match: "define the output contract for elah",
      note: "Scoring contract documented in elah-roadmap-data.ts.",
    },
    {
      phases: ["Phase 0"],
      match: "document the system architecture",
      note: "Partial — ARCHITECTURE_STEPS in static roadmap + README.",
    },
    {
      phases: ["Phase 8"],
      match: "complete the elah threat model",
      note: "Partial — agent policy and prompt injection catalog seeded.",
    },
    {
      phases: ["Phase 3"],
      match: "create a mock scoring implementation",
      note: "calculateInitialElahScore acts as mock; separate service not deployed.",
    },
  ];

  for (const p of inProgressPatterns) {
    if (p.phases && !p.phases.includes(phase)) continue;
    if (t.includes(p.match) || p.match.split(" ").every((w) => t.includes(w))) {
      return { status: "in_progress", progress: 35, notes: p.note };
    }
  }

  // Phase-level defaults for early engineering work
  if (phase.startsWith("Phase 1") || phase.startsWith("Phase 2")) {
    return {
      status: "backlog",
      progress: 5,
      notes: "Needs verification against live simulator.",
    };
  }

  if (phase.startsWith("Phase 11") || phase.startsWith("Phase 12") || phase.startsWith("Phase 13")) {
    return { status: "backlog", progress: 0, notes: "No outreach recorded yet." };
  }

  return { status: "backlog", progress: 0 };
}

function inferPriority(title: string, isCritical: boolean): TaskPriority {
  if (isCritical) return "critical";
  if (/define|finalize|audit|create the separate|mock scoring|baseline|evaluation metrics/i.test(title)) {
    return "high";
  }
  return "medium";
}

function isCriticalPath(title: string): boolean {
  const lower = title.toLowerCase();
  return CRITICAL_PATH_FRAGMENTS.some((f) => lower.includes(f.toLowerCase()));
}

function milestoneIdForPhase(phaseIndex: number, milestoneIds: string[]): string | null {
  const map: Record<number, number> = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 9,
    11: 10,
    12: 11,
    13: 14,
    14: 14,
    15: 15,
  };
  const idx = map[phaseIndex];
  return idx !== undefined ? milestoneIds[idx] ?? null : null;
}

export async function seedRoadmapIfEmpty(): Promise<{ seeded: boolean; counts: Record<string, number> }> {
  await migrateRetiredTaskStatusesToBacklog();
  const existing = await prisma.roadmapTask.count();
  if (existing > 0) {
    return {
      seeded: false,
      counts: {
        tasks: existing,
        milestones: await prisma.roadmapMilestone.count(),
        contacts: await prisma.roadmapContact.count(),
      },
    };
  }

  const now = new Date();
  const milestoneIds: string[] = [];

  for (const spec of MILESTONE_SPECS) {
    const target = new Date(now);
    target.setMonth(target.getMonth() + spec.targetMonthsFromNow);
    const m = await prisma.roadmapMilestone.create({
      data: {
        title: spec.title,
        description: spec.title,
        targetDate: target,
        status: "not_started",
        completionPercentage: 0,
        exitCriteria: spec.exitCriteria,
        owner: "Founder",
        order: spec.order,
      },
    });
    milestoneIds.push(m.id);
  }

  let order = 0;
  for (let phaseIndex = 0; phaseIndex < PHASE_SPECS.length; phaseIndex++) {
    const spec = PHASE_SPECS[phaseIndex];
    for (const title of spec.tasks) {
      order += 1;
      const critical = isCriticalPath(title);
      const inferred = inferStatus(spec.phase, title);
      const id = `task-${phaseIndex}-${slugify(title)}`.slice(0, 64);

      await prisma.roadmapTask.create({
        data: {
          id,
          title,
          category: spec.category,
          workstream: spec.workstream,
          phase: spec.phase,
          status: inferred.status,
          priority: inferPriority(title, critical),
          owner: critical ? "Founder" : null,
          progressPercentage: inferred.progress,
          milestoneId: milestoneIdForPhase(phaseIndex, milestoneIds),
          isCriticalPath: critical,
          order,
          notes: inferred.notes ?? null,
          tags: JSON.stringify(critical ? ["critical-path"] : []),
        },
      });
    }
  }

  // Key dependencies
  const depPairs: [string, string][] = [
    ["task-6-train-on-simulator-data", "task-4-convert-existing-simulator-logs-into-the-normalized"],
    ["task-6-establish-a-simple-baseline-model", "task-5-build-a-deterministic-rules-based-baseline"],
    ["task-7-finalize-the-dimensions-of-the-intention-graph", "task-0-define-the-coordinate-system-for-the-intention"],
    ["task-3-connect-the-existing-banking-simulator-to-the-mock-elah", "task-3-create-a-mock-scoring-implementation"],
    ["task-12-execute-the-pilot", "task-10-produce-an-mvp-readiness-report"],
  ];

  for (const [childPrefix, parentPrefix] of depPairs) {
    const child = await prisma.roadmapTask.findFirst({
      where: { id: { startsWith: childPrefix.slice(0, 20) } },
    });
    const parent = await prisma.roadmapTask.findFirst({
      where: { id: { startsWith: parentPrefix.slice(0, 20) } },
    });
    if (child && parent) {
      await prisma.roadmapTask.update({
        where: { id: child.id },
        data: { dependencyIds: JSON.stringify([parent.id]) },
      });
    }
  }

  // Decisions
  const decisions = [
    {
      question: "Where should the ELAH scoring service run?",
      context: "Separate microservice vs embedded module in banking app.",
      options: ["Separate service (recommended)", "Embedded module", "Serverless functions"],
      status: "under_investigation",
      owner: "Founder",
    },
    {
      question: "What is the MVP intention score semantics?",
      context: "Probability of genuine banking intent vs risk score.",
      options: ["P(genuine intent)", "P(malicious intent)", "Dual scores"],
      status: "open",
      owner: "Founder",
    },
    {
      question: "Distribution model for v1?",
      context: "Internal pilot vs unlisted App Store vs ad-hoc.",
      options: ["Design partner pilot only", "Unlisted app", "Ad-hoc internal"],
      status: "open",
      owner: "Founder",
    },
  ];

  for (const d of decisions) {
    await prisma.roadmapDecision.create({
      data: {
        ...d,
        options: JSON.stringify(d.options),
      },
    });
  }

  // Risks
  const risks = [
    {
      description: "No separate ELAH service yet — scoring embedded in banking app helpers.",
      riskType: "technical",
      probability: "high",
      impact: "high",
      severity: "high",
      mitigationPlan: "Extract mock scoring API per Phase 3 tasks.",
      owner: "Founder",
      status: "open",
    },
    {
      description: "Limited labeled dataset for model training.",
      riskType: "data",
      probability: "high",
      impact: "high",
      severity: "high",
      mitigationPlan: "Execute Phase 4 synthetic scenario generation and labeling UI.",
      owner: "Founder",
      status: "open",
    },
    {
      description: "No banking customer validation interviews recorded.",
      riskType: "market",
      probability: "medium",
      impact: "high",
      severity: "medium",
      mitigationPlan: "Begin Phase 11 outreach to Israeli banks and fintech design partners.",
      owner: "Founder",
      status: "open",
    },
  ];

  for (const r of risks) {
    await prisma.roadmapRisk.create({ data: { ...r, relatedTaskIds: "[]" } });
  }

  // Experiments placeholders
  const experiments = [
    {
      title: "Baseline rules vs initial ElahTrainingEvent labels",
      hypothesis: "Rule-based score correlates with human labels on transfer intents.",
      testMethod: "Compare calculateInitialElahScore to ElahTrainingEvent.elahScoreLabel.",
      dataset: "ElahTrainingEvent table",
      successMetric: "Pearson r > 0.7 on holdout",
      status: "planned",
    },
    {
      title: "Intent matrix clustering sanity check",
      hypothesis: "Legitimate and malicious intents separate in 3D space.",
      testMethod: "Visual inspection + cluster metrics on AgentIntentEvent.",
      dataset: "AgentIntentEvent / IntentMatrixSeed",
      successMetric: "Visible separation in pilot scenarios",
      status: "planned",
    },
  ];

  for (const e of experiments) {
    await prisma.roadmapExperiment.create({ data: e });
  }

  // Contacts — placeholders only, no fabricated emails
  const contacts = [
    {
      name: "Fusion VC",
      organization: "Fusion VC",
      contactType: "investor",
      sector: "Venture Capital",
      relevance: "Israeli pre-seed/seed fund — AI, cybersecurity, fintech.",
      outreachStatus: "identified",
      priority: "high",
      notes: "Initial relevant lead per founder brief. Do not invent contact details.",
    },
    {
      name: "Israeli retail bank (placeholder)",
      organization: "TBD",
      contactType: "potential_banking_customer",
      sector: "Banking",
      relevance: "Primary MVP vertical — design partner candidate.",
      outreachStatus: "research",
      priority: "high",
      notes: "Replace with real contact after Phase 11 research.",
    },
    {
      name: "Banking fraud leader (placeholder)",
      organization: "TBD",
      contactType: "banking_domain_expert",
      sector: "Banking",
      relevance: "Validate intention scoring value and false-positive tolerance.",
      outreachStatus: "research",
      priority: "medium",
      notes: "Recruit via Phase 11 interview script.",
    },
  ];

  for (const c of contacts) {
    await prisma.roadmapContact.create({
      data: { ...c, associatedTasks: "[]" },
    });
  }

  return {
    seeded: true,
    counts: {
      tasks: await prisma.roadmapTask.count(),
      milestones: await prisma.roadmapMilestone.count(),
      contacts: await prisma.roadmapContact.count(),
      decisions: await prisma.roadmapDecision.count(),
      risks: await prisma.roadmapRisk.count(),
      experiments: await prisma.roadmapExperiment.count(),
    },
  };
}

/** Retired columns: Planned and Ready both collapse into Backlog. */
export async function migrateRetiredTaskStatusesToBacklog(): Promise<number> {
  const result = await prisma.roadmapTask.updateMany({
    where: { status: { in: ["planned", "ready"] } },
    data: { status: "backlog" },
  });
  return result.count;
}

export async function recomputeMilestoneProgress(): Promise<void> {
  const milestones = await prisma.roadmapMilestone.findMany();
  const tasks = await prisma.roadmapTask.findMany();
  for (const m of milestones) {
    const linked = tasks.filter((t) => t.milestoneId === m.id);
    if (linked.length === 0) continue;
    const avg = Math.round(
      linked.reduce((s, t) => s + t.progressPercentage, 0) / linked.length,
    );
    const status =
      avg >= 100 ? "complete" : avg > 0 ? "in_progress" : "not_started";
    await prisma.roadmapMilestone.update({
      where: { id: m.id },
      data: { completionPercentage: avg, status },
    });
  }
}
