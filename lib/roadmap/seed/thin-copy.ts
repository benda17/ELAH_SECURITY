/**
 * Per-phase markdown map for thin Kanban cards (Phases 0–6, 8–15).
 * Phase 7 is owned by phase07.ts. Phase 16 is already in the full template — skip.
 * TODAY lines use evidence on disk; they do not invent interviews, customers, ARR,
 * or banking holdout as CS/CRM accuracy.
 */
import { PHASE_11_12_PIVOT_BANNER } from "./phase16";
import {
  OUT_COMMON,
  PRODUCT_FREEZE,
  PIVOT_SENTENCE,
  card,
} from "./card";
import { PHASE_SPECS } from "./phases";

export type ThinCopy = {
  description: string;
  successCriteria: string;
  deliverables: string;
  notes: string;
};

type Row = {
  title: string;
  doThis: string;
  inn: string;
  file: string;
  body?: string;
  today?: string;
  out?: string;
  sc?: string;
  notes?: string;
};

type PhaseMeta = {
  folder: string;
  today: string;
  audience: string;
  out?: string;
};

const P0 = "docs/Phase 0 - Product Definition";
const P0T = `${P0}/Tasks 10-22 performed 17 Aug 2026`;
const P1 = "docs/Phase 1 - Banking Simulator Stabilization";
const P2 = "docs/Phase 2 - Agent observability and event collection";
const P3 = "docs/Phase 3 - ELAH service foundation";
const P4 = "docs/Phase 4 - Dataset and labeling system";
const P5 = "docs/Phase 5 - Baseline scoring system";
const P6 = "docs/Phase 6 - ELAH model development";
const P8 = "docs/Phase 8 - Security architecture and red teaming";
const P9 = "docs/Phase 9 - Product dashboard and analyst experience";
const P10 = "docs/Phase 10 - Evaluation and MVP readiness";
const P11 = "docs/Phase 11 - User discovery and customer validation";
const P12 = "docs/Phase 12 - Pilot acquisition";
const P13 = "docs/Phase 13 - Fundraising and investor outreach";
const P14 = "docs/Phase 14 - Company, legal, privacy, and compliance";
const P15 = "docs/Phase 15 - Team and operations";

const META: Record<string, PhaseMeta> = {
  "Phase 0": {
    folder: P0,
    audience: "Founder / product",
    today: `Phase 0 pack written 17 Aug 2026 under ${P0}/ (Proposed/written). First-client motion is CS/CRM (Phase 16); this pack still freezes the banking-demo product. Founder Approve still required where specs say Proposed.`,
  },
  "Phase 1": {
    folder: P1,
    audience: "Engineering (banking simulator)",
    today: `Simulator docs dated 18 Aug 2026 in ${P1}/. Live ELAH Banking Simulation is the scoring demo, not the first sales motion. No ATM / beneficiary-write / device_change product.`,
  },
  "Phase 2": {
    folder: P2,
    audience: "Engineering (observability)",
    today: `Capture pack dated 25 Aug 2026 in ${P2}/. ElahEvent 1.0 mapper exists. Scores are not envelope fields. Phase 2 does not own POST /v1/score.`,
  },
  "Phase 3": {
    folder: P3,
    audience: "Engineering (ELAH service)",
    today: `${P3}/ pack exists. POST /v1/score is colocated in the banking Next.js app (rules_v0). Fail-open 250 ms. ELAH never executes tools. CRM has its own scorer and Neon — do not prisma db push CRM onto this DB.`,
  },
  "Phase 4": {
    folder: P4,
    audience: "Data / labeling",
    today: `Gold v1.0 (seed 20260826) and ${P4}/ pack exist. Labeling UI /admin/elah-labeling. This is banking gold — CS/CRM gold is Phase 16 and must not overwrite v1.0.`,
  },
  "Phase 5": {
    folder: P5,
    audience: "Model / baseline",
    today: `${P5}/ pack exists. Live scorer is uncalibrated rules_v0. Banking holdout n=100 is banking-gold only — not CS/CRM accuracy.`,
  },
  "Phase 6": {
    folder: P6,
    audience: "Model development",
    today: `Offline catboost_v0 trained 30 Aug 2026 in /Users/benda/elah-model. Live POST /v1/score is still rules_v0. Holdout numbers are banking-gold, not CS/CRM. ${P6}/ pack exists.`,
  },
  "Phase 8": {
    folder: P8,
    audience: "Security",
    today: `Phase 0 threat-model draft exists. No completed external red-team report. Pack home is ${P8}/ (docs agent may be writing in parallel). Simulator/gold only — no live customer data.`,
  },
  "Phase 9": {
    folder: P9,
    audience: "Dashboard (CS/CRM ops analyst first)",
    today: `Founder analytics, /admin/elah-events, and /banking/intent-matrix exist. Customer/support UI must not show elahScore. Pack home ${P9}/. First analyst going forward is CS/CRM ops; banking dashboard is the existing demo.`,
  },
  "Phase 10": {
    folder: P10,
    audience: "Product / eval",
    today: `Banking holdout n=100 / rules_v0 metrics are in the Phase 5 eval pack. No CS/CRM production claim. No interviews. Pack home ${P10}/.`,
  },
  "Phase 11": {
    folder: P11,
    audience: "Business (later banking vertical)",
    today: `No interviews logged. First-buyer ICP is Phase 16 CS/CRM. This phase is later banking discovery. Interview guide may exist as docs/ELAH_BANKING_DOMAIN_INTERVIEW_GUIDE.md — not completed notes. Agents do not email.`,
  },
  "Phase 12": {
    folder: P12,
    audience: "Business (later banking pilot)",
    today: `No design partner, no signed pilot, no testimonial. First paid/pilot motion is Phase 16 CS/CRM. This phase stays later banking vertical. Agents do not send mail.`,
  },
  "Phase 13": {
    folder: P13,
    audience: "Fundraising",
    today: `$400K founder-approved working ask (not closed). One-pager v0.2 is CS/CRM-first Proposed. Public investor list with blank emails. Agents do not send mail. No ARR, no invented meetings.`,
  },
  "Phase 14": {
    folder: P14,
    audience: "Legal / compliance (drafts only)",
    today: `No counsel-signed entity/privacy/DPA pack on disk. Generated checklists are drafts. Pack home ${P14}/. Do not present generated content as legal advice.`,
  },
  "Phase 15": {
    folder: P15,
    audience: "Operations",
    today: `Hiring priorities live in ${P13}/ELAH_HIRING_PRIORITIES.md. Founder-only ops. No invented headcount, burn, or runway beyond the $400K/12-month working ask. Pack home ${P15}/.`,
  },
};

function phaseKey(phase: string): string {
  const m = phase.match(/^Phase \d+/);
  return m ? m[0] : phase;
}

function bare(title: string): string {
  return title.replace(/\.$/, "");
}

function bullets(inn: string, extra?: string): string {
  return [
    `- Deliverable exists: ${inn}`,
    `- ${PRODUCT_FREEZE}`,
    `- ${PIVOT_SENTENCE}`,
    "- Customer UI must not show elahScore.",
    "- No fake metrics, interviews, customers, ARR, CoT, or live customer data.",
    extra ? `- ${extra}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildBody(meta: PhaseMeta, title: string, inn: string, custom?: string): string {
  if (custom) {
    return custom.includes(PRODUCT_FREEZE)
      ? custom
      : `${custom} ${PRODUCT_FREEZE} ${PIVOT_SENTENCE}`;
  }
  return `${meta.audience} owns “${bare(title)}.” ${PRODUCT_FREEZE} ${PIVOT_SENTENCE} Done looks like: ${inn}.`;
}

function materialize(phase: string, row: Row): ThinCopy {
  const meta = META[phaseKey(phase)];
  if (!meta) {
    throw new Error(`No thin-copy meta for ${phase}`);
  }
  const today = row.today ?? meta.today;
  const out = row.out ?? meta.out ?? OUT_COMMON;
  const body = buildBody(meta, row.title, row.inn, row.body);
  let description = card(body, today, row.doThis, row.inn, out);
  if (phase.startsWith("Phase 11") || phase.startsWith("Phase 12")) {
    description = `${PHASE_11_12_PIVOT_BANNER}${description}`;
  }
  return {
    description,
    successCriteria: row.sc ?? bullets(row.inn),
    deliverables: row.file,
    notes: row.notes ?? `Thin-copy enrich. Do not mark Done without the file (or equivalent evidence) in ${meta.folder}/.`,
  };
}

function r(
  title: string,
  doThis: string,
  inn: string,
  file: string,
  extra?: Partial<Omit<Row, "title" | "doThis" | "inn" | "file">>,
): Row {
  return { title, doThis, inn, file, ...extra };
}

const PHASE_ROWS: Record<string, Row[]> = {
  "Phase 0": [
    r("Finalize the exact ELAH banking MVP scope.", "Keep ELAH_MVP_SCOPE.md honest: banking-demo MVP IN/OUT, CS/CRM first-client motion lives in Phase 16. Founder Approve if still Proposed.", "Signed MVP IN/OUT checklist for the banking demo.", `${P0}/ELAH_MVP_SCOPE.md`),
    r("Define the primary banking use cases.", "Re-read ELAH_BANKING_USE_CASES.md against live simulator tools. Do not add ATM or beneficiary-write.", "Named P0/P1 banking-demo use cases.", `${P0}/ELAH_BANKING_USE_CASES.md`),
    r("Define the event schema.", "Keep ElahEvent 1.0: no score fields on the envelope. Point CS/CRM at the same envelope, new domain labels in Phase 16.", "ElahEvent 1.0 schema memo.", `${P0}/ELAH_EVENT_SCHEMA.md`),
    r("Define the input contract for ELAH.", "Keep input contract: utterance → plan → tenant policy → POST /v1/score. Do not add allow/deny to the request.", "Input contract + OpenAPI pointer.", `${P0}/ELAH_INPUT_CONTRACT.md`),
    r("Define the output contract for ELAH.", "Keep ScoreResponse 1.0. No enforcement fields. No elahScore on customer UI.", "Output contract memo.", `${P0}/ELAH_OUTPUT_CONTRACT.md`),
    r("Define the human-intention score semantics.", "Keep genuine-intent semantics (not a fraud TM score). Do not quote CS/CRM holdout that was not measured.", "Score-semantics memo.", `${P0}/ELAH_SCORE_SEMANTICS.md`),
    r("Define confidence and uncertainty semantics.", "Keep abstain / scoring_unavailable / fail-open. Confidence is not a block.", "Confidence semantics memo.", `${P0}/ELAH_CONFIDENCE_SEMANTICS.md`),
    r("Define the coordinate system for the intention graph.", "Axes stay HA/FR/EU. Phase 7 restates for CS/CRM analysts; do not add a fourth axis here.", "Coordinate-system memo (unit cube).", `${P0}/ELAH_COORDINATE_SYSTEM.md`),
    r("Define explainability requirements.", "Keep no-CoT, analyst-only evidence fields. Customer chat shows nothing from the explanation table.", "Explainability checklist.", `${P0}/ELAH_EXPLAINABILITY.md`),
    r("Define the boundary between ELAH and the bank's policy engine.", "Restate: tenant policy allow/deny/confirm; ELAH never allows, blocks, or executes. Same freeze on CS/CRM tools.", "Policy-boundary memo.", `${P0T}/ELAH_POLICY_BOUNDARY.md`),
    r("Define the threshold configuration model.", "Thresholds are tenant policy, not a change to elahScore. Customer UI still score-free.", "Threshold-config memo.", `${P0T}/ELAH_THRESHOLD_CONFIG.md`),
    r("Define service-level requirements.", "Keep SLO memo; 250 ms fail-open ceiling unchanged without a separate decision.", "SLO memo.", `${P0T}/ELAH_SLOS.md`),
    r("Define latency targets.", "Keep p50/p95 + client fail-open 250 ms. Do not raise the ceiling here.", "Latency-target memo.", `${P0T}/ELAH_LATENCY.md`),
    r("Define throughput targets.", "Keep throughput memo as demo/MVP planning, not a production SLA claim.", "Throughput-target memo.", `${P0T}/ELAH_THROUGHPUT.md`),
    r("Define data-retention requirements.", "Simulator/gold retention only. No live customer tickets.", "Retention memo.", `${P0T}/ELAH_RETENTION.md`),
    r("Define privacy requirements.", "No real PII in gold or demos. DemoPass123! accounts only.", "Privacy memo.", `${P0T}/ELAH_PRIVACY.md`),
    r("Document the system architecture.", "Keep colocation-vs-extract note. CRM is a sibling app + Neon, not a schema merge.", "Architecture memo.", `${P0T}/ELAH_ARCHITECTURE.md`),
    r("Document the threat model.", "Keep scoring-service trust boundary. Full red team is Phase 8.", "Threat-model memo.", `${P0T}/ELAH_THREAT_MODEL.md`),
    r("Document assumptions and non-goals.", "Non-goals stay: App Store, real-bank production, ELAH-as-policy, ATM product.", "Assumptions / non-goals memo.", `${P0T}/ELAH_ASSUMPTIONS.md`),
    r("Decide which components belong in the current Next.js application.", "Ownership table: simulator + colocated /v1/* for MVP. Do not move CRM onto banking Neon.", "Component-ownership table (Next.js column).", `${P0T}/ELAH_COMPONENT_OWNERSHIP.md`),
    r("Decide which components belong in the separate ELAH service.", "Same ownership table, ELAH-service column. Logical split frozen even while colocated.", "Component-ownership table (service column).", `${P0T}/ELAH_COMPONENT_OWNERSHIP.md`),
    r("Define the MVP success metrics.", "Banking-demo metrics only. Do not paste holdout 0.79 as CS/CRM accuracy. No invented ARR.", "MVP success-metrics memo.", `${P0T}/ELAH_MVP_SUCCESS_METRICS.md`),
  ],
  "Phase 1": [
    r("Audit the existing banking simulator.", "Keep the gap table honest vs ElahEvent 1.0. Do not invent ATM events.", "Written simulator audit.", `${P1}/ELAH_SIMULATOR_AUDIT.md`),
    r("Document all existing banking flows.", "Keep customer/manager/admin/assistant flow doc aligned with live routes.", "Banking-flows memo.", `${P1}/ELAH_BANKING_FLOWS.md`),
    r("Verify authentication and authorization behavior.", "Re-check demo roles (Jane / manager / security.admin). Password DemoPass123!.", "Authz verification memo.", `${P1}/ELAH_AUTHZ_VERIFICATION.md`),
    r("Verify the simulated user and account database.", "Inventory seed users/accounts. Synthetic only.", "Data inventory.", `${P1}/ELAH_SIMULATOR_DATA_INVENTORY.md`),
    r("Verify user tiers and permissions.", "Tiers vs live checks. No new entitlements that ELAH would “allow.”", "Tier-permissions memo.", `${P1}/ELAH_TIER_PERMISSIONS.md`),
    r("Standardize banking action names.", "Glossary: actionType vs toolName vs intentLabel. Closed 22-label freeze.", "Action-name glossary.", `${P1}/ELAH_ACTION_NAME_GLOSSARY.md`),
    r("Add or validate login events.", "Confirm login emits a lifecycle/audit hop. Not a score field.", "Login event coverage note.", `${P1}/ELAH_SIMULATOR_AUDIT.md`),
    r("Add or validate logout events.", "Confirm logout coverage or mark N/A with evidence. Do not fake events.", "Logout coverage note.", `${P1}/ELAH_SIMULATOR_AUDIT.md`),
    r("Add or validate transfer events.", "Jane internal/external transfer remains the banking demo. Score before tool on the live path (Phase 3).", "Transfer event coverage.", `${P1}/ELAH_BANKING_FLOWS.md`),
    r("Add or validate withdrawal events.", "If no ATM/withdrawal product, document N/A — do not invent the flow.", "Withdrawal N/A or coverage note.", `${P1}/ELAH_NONFLOWS_AND_HIGH_RISK.md`),
    r("Add or validate account-data download events.", "Statement/download path only. High data-risk, still genuine possible.", "Download event coverage.", `${P1}/ELAH_NONFLOWS_AND_HIGH_RISK.md`),
    r("Add or validate profile-change events.", "Profile tools that exist only. Do not add beneficiary-write.", "Profile-change coverage.", `${P1}/ELAH_BANKING_FLOWS.md`),
    r("Add or validate beneficiary-management events.", "Product non-goal if missing. Document N/A rather than stubbing a write API.", "Beneficiary N/A note.", `${P1}/ELAH_NONFLOWS_AND_HIGH_RISK.md`),
    r("Add or validate device-change events.", "device_change is not a product. Mark N/A.", "Device-change N/A note.", `${P1}/ELAH_NONFLOWS_AND_HIGH_RISK.md`),
    r("Add or validate password-reset events.", "If no in-product reset flow, mark N/A.", "Password-reset N/A note.", `${P1}/ELAH_NONFLOWS_AND_HIGH_RISK.md`),
    r("Add or validate high-risk banking actions.", "Map freeze_card, transfers, statement to high-risk coverage. Policy still allow/deny/confirm.", "High-risk coverage memo.", `${P1}/ELAH_NONFLOWS_AND_HIGH_RISK.md`),
    r("Ensure every action has a unique event ID.", "eventId uniqueness on ingestible envelopes. Duplicates are quality failures, not silent merges.", "Unique eventId rule.", `${P2}/ELAH_EVENT_QUALITY.md`),
    r("Ensure every action includes timestamps.", "ISO timestamps on envelope + ordering. No backdated fake live-customer logs.", "Timestamp rule.", `${P2}/ELAH_EVENT_ENVELOPE.md`),
    r("Ensure events include user, session, device, source, and action context.", "Required context fields on ElahEvent 1.0. No scores on the envelope.", "Context-field checklist.", `${P0}/ELAH_EVENT_SCHEMA.md`),
    r("Ensure agent-triggered actions can be distinguished from directly triggered actions.", "UI vs agent twins. Independent scoring if both exist.", "Source/actor distinction.", `${P2}/ELAH_AGENT_CAPTURE.md`),
    r("Add repeatable simulation scenarios.", "Keep ELAH_PHASE1_SCENARIOS.md runnable on DemoPass123! accounts.", "Repeatable scenario list.", `${P1}/ELAH_PHASE1_SCENARIOS.md`),
    r("Add abnormal and suspicious user scenarios.", "Simulator packs only. Not live fraud cases.", "Abnormal scenario notes.", `${P1}/ELAH_PHASE1_SCENARIOS.md`),
    r("Add legitimate edge-case scenarios.", "Genuine high-Y transfers stay legitimate. Do not auto-block.", "Legitimate-edge scenarios.", `${P1}/ELAH_PHASE1_SCENARIOS.md`),
    r("Create simulator reset functionality.", "Document reset/seed path. Never reset CRM Neon via banking scripts.", "Reset/seed note.", `${P1}/README.md`),
    r("Create simulator seed scripts.", "prisma/seed.ts demo users. Password DemoPass123!. No live customer imports.", "Seed script evidence.", "ELAH_SECURITY---Banking-System/prisma/seed.ts"),
    r("Validate that existing banking functionality remains intact.", "Click Jane transfer + injection demo. Customer UI still has no elahScore.", "Regression note that banking demo still runs.", `${P1}/ELAH_BANKING_FLOWS.md`),
  ],
  "Phase 2": [
    r("Audit the integrated AI banking agent.", "Keep ELAH_AGENT_AUDIT.md vs live orchestrator. Scoring-unit ≠ lifecycle hop.", "Agent audit memo.", `${P2}/ELAH_AGENT_AUDIT.md`),
    r("Map all agent tools.", "13 allow-listed tools. Do not invent ATM tools.", "Tool map.", `${P2}/ELAH_AGENT_TOOL_MAP.md`),
    r("Document all agent capabilities.", "Can/cannot per tier. ELAH score is not an agent capability.", "Capabilities memo.", `${P2}/ELAH_AGENT_CAPABILITIES.md`),
    r("Capture the original user request.", "Persist utterance on the envelope. Redact PII in exports.", "Request-capture hop.", `${P2}/ELAH_AGENT_CAPTURE.md`),
    r("Capture assistant messages.", "AgentMessage / lifecycle hops. Not a score field.", "Assistant-message capture.", `${P2}/ELAH_AGENT_CAPTURE.md`),
    r("Capture model outputs.", "Structured plan/modelOutput. No CoT dump to Jane.", "Model-output capture.", `${P2}/ELAH_AGENT_CAPTURE.md`),
    r("Capture tool-call requests.", "Tool name before executeTool. This is the scoring hook point (Phase 3).", "Tool-request capture.", `${P2}/ELAH_AGENT_CAPTURE.md`),
    r("Capture tool-call arguments.", "Arguments on the hop. No live customer payloads.", "Tool-argument capture.", `${P2}/ELAH_AGENT_CAPTURE.md`),
    r("Capture tool-call results.", "Result/error on the hop. Failures are not ELAH blocks.", "Tool-result capture.", `${P2}/ELAH_AGENT_CAPTURE.md`),
    r("Capture the resulting banking action.", "Ledger/audit alias after policy allows. ELAH did not execute it.", "Resulting-action capture.", `${P2}/ELAH_AGENT_CAPTURE.md`),
    r("Capture errors and retries.", "Degrade-not-retry as documented. Do not infinite-loop tools.", "Error/retry capture.", `${P2}/ELAH_AGENT_CAPTURE.md`),
    r("Capture session and conversation identifiers.", "sessionId/conversationId for Phase 7 trajectories later.", "Session identifiers.", `${P2}/ELAH_EVENT_ENVELOPE.md`),
    r("Capture action chains.", "Turn ordering. Sequence is explanation, not policy.", "Action-chain capture.", `${P2}/ELAH_AGENT_CAPTURE.md`),
    r("Create a normalized event envelope.", "ElahEvent 1.0 mapper. Page views excluded. No scores on the event.", "Envelope mapper + memo.", `${P2}/ELAH_EVENT_ENVELOPE.md`),
    r("Preserve ordering between events.", "sequence/turnId monotonic per session.", "Ordering rule.", `${P2}/ELAH_EVENT_ENVELOPE.md`),
    r("Correlate user intent with agent execution.", "Join utterance → plan → tool. Do not put elahScore on the join record.", "Correlation note.", `${P2}/ELAH_AGENT_CAPTURE.md`),
    r("Add data-quality checks.", "Named quality rules. Dashboard alerts for missing fields.", "Quality-rules memo.", `${P2}/ELAH_EVENT_QUALITY.md`),
    r("Add missing-field alerts.", "Analyst/founder alerts, not customer toasts.", "Missing-field alerts.", `${P2}/ELAH_EVENT_QUALITY.md`),
    r("Add duplicate-event detection.", "Duplicate eventId on ingest rows.", "Duplicate detection.", `${P2}/ELAH_EVENT_QUALITY.md`),
    r("Add schema-version support.", "schemaVersion on envelope. Bump is a spec change.", "Schema-version field.", `${P2}/ELAH_EVENT_ENVELOPE.md`),
    r("Ensure logs can be exported for training.", "npm run export:elah-events JSONL. Unlabeled ≠ gold. No live Zendesk.", "Training export memo.", `${P2}/ELAH_TRAINING_EXPORT.md`),
    r("Add a live event viewer.", "security.admin /admin/elah-events. Jane never sees this.", "Event viewer.", `${P2}/ELAH_EVENT_VIEWER.md`),
    r("Add an event-detail view.", "Detail includes snapshot when present; envelope still score-free.", "Event-detail view.", `${P2}/ELAH_EVENT_VIEWER.md`),
    r("Add filtering by user, session, action, tool, and result.", "Filters on the admin viewer only.", "Filter set on event viewer.", `${P2}/ELAH_EVENT_VIEWER.md`),
  ],
  "Phase 3": [
    r("Create the separate ELAH service.", "Keep logical /v1/* boundary. Do not extract to a second Vercel project unless founder decides.", "Logical ELAH service + HTTP boundary.", `${P3}/ELAH_SERVICE.md`),
    r("Choose and document the service language and framework.", "TypeScript / Next.js 14 as documented. No surprise rewrite.", "Language/framework ADR.", `${P3}/ELAH_SERVICE.md`),
    r("Define the scoring API.", "Implement-to-contract POST /v1/score. No allow/deny fields.", "Scoring API memo.", `${P3}/ELAH_SCORING_API.md`),
    r("Add health-check endpoints.", "GET /v1/health stays up even if scorer degrades.", "Health endpoint.", `${P3}/ELAH_SERVICE_OPS.md`),
    r("Add versioning.", "GET /v1/version + modelVersion on snapshots.", "Version endpoint.", `${P3}/ELAH_SERVICE_OPS.md`),
    r("Add authentication between the banking application and ELAH.", "Bearer service token. Founder pastes ELAH_SERVICE_TOKEN. Not a customer login.", "Service auth.", `${P3}/ELAH_SERVICE_OPS.md`),
    r("Add input validation.", "Reject malformed ScoreRequest before the scorer. Do not execute tools on invalid input.", "Input validation.", `${P3}/ELAH_SERVICE_OPS.md`),
    r("Add structured error responses.", "ErrorResponse shape. Timeouts become scoring_unavailable, not block.", "Structured errors.", `${P3}/ELAH_SERVICE_OPS.md`),
    r("Add request logging.", "Correlation ids; no PII in logs; no CoT.", "Request logging.", `${P3}/ELAH_SERVICE_OPS.md`),
    r("Add tracing and correlation IDs.", "Trace requestId across simulator → /v1/score → snapshot.", "Correlation ids.", `${P3}/ELAH_SERVICE_OPS.md`),
    r("Add latency measurements.", "Measure inside 250 ms fail-open. Do not raise the ceiling here.", "Latency measurement.", `${P3}/ELAH_SERVICE_OPS.md`),
    r("Add local development configuration.", "In-process when ELAH_SERVICE_URL unset. Do not point local at CRM Neon.", "Local config.", `${P3}/ELAH_SERVICE_CONFIG.md`),
    r("Add test configuration.", "Vitest token + tests/elah. No db push.", "Test config.", `${P3}/ELAH_SERVICE_CONFIG.md`),
    r("Add production configuration.", "Banking Vercel env only. CRM has its own project.", "Production config.", `${P3}/ELAH_SERVICE_CONFIG.md`),
    r("Add Docker support if appropriate.", "Local-only Docker as documented. Not a production k8s claim.", "Docker note.", `${P3}/ELAH_SERVICE_CONFIG.md`),
    r("Add CI checks.", "GitHub Actions + tests/elah.", "CI memo.", `${P3}/ELAH_SERVICE_CI.md`),
    r("Add unit tests.", "Scorer unit tests. Identical input → identical ElahScore for rules_v0.", "Unit tests.", `${P3}/ELAH_SERVICE_CI.md`),
    r("Add integration tests.", "Simulator hook tests. Fail-open path covered.", "Integration tests.", `${P3}/ELAH_SERVICE_CI.md`),
    r("Add API contract tests.", "OpenAPI / ScoreResponse 1.0 contract tests.", "Contract tests.", `${P3}/ELAH_SCORING_API.md`),
    r("Create a mock scoring implementation.", "rules_v0 table scorer. Not a trained model. Uncalibrated badge.", "Mock scorer memo + code.", `${P3}/ELAH_MOCK_SCORER.md`),
    r("Connect the existing banking simulator to the mock ELAH service.", "Score after policy, before executeTool. Jane UI score-free.", "Simulator wire memo.", `${P3}/ELAH_SIMULATOR_WIRE.md`),
    r("Store ELAH responses alongside events.", "ElahScoreSnapshot (or equivalent), not envelope fields.", "Snapshot storage.", `${P3}/ELAH_SIMULATOR_WIRE.md`),
    r("Handle ELAH service timeouts safely.", "Fail-open: scoring_unavailable, tool may still run if policy allows.", "Timeout matrix.", `${P3}/ELAH_SIMULATOR_WIRE.md`),
    r("Define fallback behavior.", "Same fail-open matrix. Fallback is not an ELAH deny.", "Fallback matrix.", `${P3}/ELAH_SIMULATOR_WIRE.md`),
    r("Ensure ELAH cannot directly execute banking actions.", "Service must not import executeTool or write the ledger. Freeze test.", "Non-execution guarantee.", `${P3}/ELAH_SERVICE.md`),
  ],
  "Phase 4": [
    r("Define the training-data schema.", "Gold JSONL ≠ Prisma ElahTrainingEvent. Scores are labels, not envelope fields.", "Training schema memo.", `${P4}/ELAH_TRAINING_SCHEMA.md`),
    r("Define the evaluation-data schema.", "Eval schema + holdout rules. Banking gold only on this card.", "Eval schema memo.", `${P4}/ELAH_EVALUATION_SCHEMA.md`),
    r("Define the label taxonomy.", "Closed 22 banking labels. Do not add a 23rd for refunds — that is Phase 16 CS/CRM taxonomy.", "Taxonomy memo.", `${P4}/ELAH_LABEL_TAXONOMY.md`),
    r("Define human-intention dimensions.", "HA/FR/EU as labels on gold rows. Independent of elahScore.", "Intention dimensions.", `${P4}/ELAH_INTENTION_DIMENSIONS.md`),
    r("Define malicious-intent dimensions.", "Same memo; injection/exfil still in the 22. Not CS/CRM refund-abuse.", "Malicious dimensions.", `${P4}/ELAH_INTENTION_DIMENSIONS.md`),
    r("Define accidental-error dimensions.", "Mistaken user vs hostile. Do not collapse into malicious.", "Accidental-error dimensions.", `${P4}/ELAH_INTENTION_DIMENSIONS.md`),
    r("Define ambiguity labels.", "ambiguous_banking_request pack. reviewNotes required.", "Ambiguity labels.", `${P4}/ELAH_AMBIGUITY_LABELS.md`),
    r("Define confidence labels.", "Annotator confidence ≠ model confidence.", "Annotator confidence labels.", `${P4}/ELAH_CONFIDENCE_LABELS.md`),
    r("Define contextual-risk labels.", "Tags, not a fourth axis.", "Contextual-risk labels.", `${P4}/ELAH_CONTEXTUAL_RISK_LABELS.md`),
    r("Create a scenario-template format.", "Deterministic template → JSONL compiler.", "Scenario template.", `${P4}/ELAH_SCENARIO_TEMPLATE.md`),
    r("Convert existing simulator logs into the normalized schema.", "Unlabeled JSONL from live simulator logs. Not gold. Not CRM tickets.", "Log normalization memo.", `${P4}/ELAH_LOG_NORMALIZATION.md`),
    r("Clean existing logs.", "Cleaning rules in the same memo. No live customer text.", "Cleaned unlabeled JSONL.", `${P4}/ELAH_LOG_NORMALIZATION.md`),
    r("Remove duplicate records.", "Duplicate keys documented.", "Dedupe rule.", `${P4}/ELAH_LOG_NORMALIZATION.md`),
    r("Validate timestamps and ordering.", "Ordering checks on unlabeled + gold.", "Timestamp validation.", `${P4}/ELAH_LOG_NORMALIZATION.md`),
    r("Detect incomplete examples.", "Incomplete rows quarantined, not silently labeled.", "Incomplete-example rule.", `${P4}/ELAH_LOG_NORMALIZATION.md`),
    r("Create synthetic legitimate banking scenarios.", "legitimate.jsonl false-positive controls. Genuine high-Y allowed.", "legitimate.jsonl", `${P4}/ELAH_SYNTHETIC_SCENARIOS.md`),
    r("Create synthetic suspicious banking scenarios.", "suspicious.jsonl. Not a production rate.", "suspicious.jsonl", `${P4}/ELAH_SYNTHETIC_SCENARIOS.md`),
    r("Create synthetic malicious banking scenarios.", "malicious.jsonl. Simulator/synthetic only.", "malicious.jsonl", `${P4}/ELAH_SYNTHETIC_SCENARIOS.md`),
    r("Create synthetic ambiguous scenarios.", "≥20 ambiguous_banking_request rows; no forced external_transfer.", "ambiguous.jsonl", "data/phase4/v1.0/packs/ambiguous.jsonl"),
    r("Create multi-step agent scenarios.", "multi_step.jsonl. Sequence ≠ ELAH execute.", "multi_step.jsonl", `${P4}/ELAH_SYNTHETIC_SCENARIOS.md`),
    r("Create prompt-injection scenarios.", "prompt_injection.jsonl. Negative signals, not a block by ELAH.", "prompt_injection.jsonl", `${P4}/ELAH_SYNTHETIC_SCENARIOS.md`),
    r("Create indirect prompt-injection scenarios.", "indirect_injection.jsonl (tool/ticket text).", "indirect_injection.jsonl", `${P4}/ELAH_SYNTHETIC_SCENARIOS.md`),
    r("Create compromised-tool scenarios.", "compromised_tool.jsonl.", "compromised_tool.jsonl", `${P4}/ELAH_SYNTHETIC_SCENARIOS.md`),
    r("Create excessive-permission scenarios.", "excessive_permission.jsonl.", "excessive_permission.jsonl", `${P4}/ELAH_SYNTHETIC_SCENARIOS.md`),
    r("Create mistaken-user scenarios.", "mistaken_user.jsonl — accidental, not hostile. Distinct from injection.", "mistaken_user.jsonl", "data/phase4/v1.0/packs/mistaken_user.jsonl"),
    r("Create conflicting-instruction scenarios.", "conflicting_instruction.jsonl. reviewNotes required.", "conflicting_instruction.jsonl", "data/phase4/v1.0/packs/conflicting_instruction.jsonl"),
    r("Create authorization-boundary scenarios.", "authorization_boundary.jsonl.", "authorization_boundary.jsonl", `${P4}/ELAH_SYNTHETIC_SCENARIOS.md`),
    r("Create data-exfiltration scenarios.", "data_exfiltration.jsonl. Synthetic PII only.", "data_exfiltration.jsonl", `${P4}/ELAH_SYNTHETIC_SCENARIOS.md`),
    r("Create high-value transfer scenarios.", "high_value_transfer.jsonl — genuine high-Y is allowed.", "high_value_transfer.jsonl", `${P4}/ELAH_SYNTHETIC_SCENARIOS.md`),
    r("Create unusual-device scenarios.", "unusual_device.jsonl as gold tags, not a required live envelope field.", "unusual_device.jsonl", "data/phase4/v1.0/packs/unusual_device.jsonl"),
    r("Create unusual-location scenarios.", "unusual_location.jsonl as gold tags, not live geo surveillance.", "unusual_location.jsonl", "data/phase4/v1.0/packs/unusual_location.jsonl"),
    r("Create behavior-drift scenarios.", "behavior_drift.jsonl. Synthetic sequences only.", "behavior_drift.jsonl", "data/phase4/v1.0/packs/behavior_drift.jsonl"),
    r("Create a manual labeling interface.", "security.admin /admin/elah-labeling. Not a customer page.", "Labeling UI memo.", `${P4}/ELAH_LABELING_INTERFACE.md`),
    r("Add reviewer notes.", "reviewNotes on gold rows.", "Reviewer notes on labeling UI.", `${P4}/ELAH_LABELING_INTERFACE.md`),
    r("Add labeling guidelines.", "Closed-set guidelines. CS/CRM labels are a different domain pack.", "Labeling guidelines.", `${P4}/ELAH_LABELING_GUIDELINES.md`),
    r("Add inter-reviewer agreement tracking.", "IAA packet / overlap. Do not invent kappa from one annotator.", "IAA overlap packet.", `${P4}/ELAH_IAA_OVERLAP_PACKET.md`),
    r("Add dataset versioning.", "datasetVersion gold v1.0. Do not overwrite with CS/CRM rows.", "Versioning memo.", `${P4}/ELAH_DATASET_VERSIONING.md`),
    r("Split data into training, validation, and holdout test sets.", "train/val/holdout JSONL. Holdout blinded. Banking only.", "Split files + memo.", `${P4}/ELAH_DATASET_VERSIONING.md`),
    r("Prevent scenario leakage between splits.", "Leakage keys documented. Same scenario must not straddle holdout.", "Leakage rule.", `${P4}/ELAH_DATASET_VERSIONING.md`),
    r("Track data provenance.", "synthetic vs simulator vs unlabeled. No live customer source.", "Provenance tracking.", `${P4}/ELAH_DATASET_VERSIONING.md`),
    r("Review privacy and anonymization requirements.", "No real ticket text, no customer emails in gold.", "Privacy memo.", `${P4}/ELAH_DATASET_PRIVACY.md`),
  ],
  "Phase 5": [
    r("Build a deterministic rules-based baseline.", "Keep rules_v0 as live baseline. Uncalibrated. Not CS/CRM production.", "rules_v0 memo.", `${P5}/ELAH_RULES_BASELINE.md`),
    r("Define baseline risk features.", "Feature families from one ElahEvent.", "Risk features.", `${P5}/ELAH_BASELINE_FEATURES.md`),
    r("Define behavioral features.", "Same features memo, behavioral family.", "Behavioral features.", `${P5}/ELAH_BASELINE_FEATURES.md`),
    r("Define agent-behavior features.", "Agent/tool family. Not CoT.", "Agent-behavior features.", `${P5}/ELAH_BASELINE_FEATURES.md`),
    r("Define banking-context features.", "Banking-context family. Unusual device/location are gold tags if missing live.", "Banking-context features.", `${P5}/ELAH_BASELINE_FEATURES.md`),
    r("Define action-chain features.", "Chain family from one event (no silent session surveillance claim).", "Action-chain features.", `${P5}/ELAH_BASELINE_FEATURES.md`),
    r("Implement feature extraction.", "lib/elah/baseline/features.ts. Keep Python port in sync for Phase 6.", "Feature extraction code.", `${P5}/ELAH_BASELINE_FEATURES.md`),
    r("Produce a baseline human-intention score.", "rules_v0 elahScore. Not enforcement.", "Baseline score.", `${P5}/ELAH_RULES_BASELINE.md`),
    r("Produce baseline coordinates.", "HA/FR/EU from rules_v0. Independent of score.", "Baseline coordinates.", `${P5}/ELAH_RULES_BASELINE.md`),
    r("Produce baseline explanations.", "Signal lists + short summary. No CoT.", "Baseline explanations.", `${P5}/ELAH_RULES_BASELINE.md`),
    r("Add reason codes.", "RC_* on policyHook.reasons. Never allow/deny as ELAH actions.", "Reason-code catalog.", `${P5}/ELAH_REASON_CODES.md`),
    r("Add uncertainty handling.", "Abstain / uncalibrated badge.", "Uncertainty handling.", `${P5}/ELAH_RULES_BASELINE.md`),
    r("Add score normalization.", "Documented normalization. Not calibration.", "Score normalization.", `${P5}/ELAH_RULES_BASELINE.md`),
    r("Add test fixtures.", "Deterministic fixtures in tests/elah.", "Fixtures.", `${P5}/ELAH_RULES_BASELINE.md`),
    r("Evaluate the baseline against labeled scenarios.", "Holdout n=100 banking-gold. Do not quote as CS/CRM.", "Eval report.", `${P5}/ELAH_BASELINE_EVAL.md`),
    r("Measure false positives.", "FP on banking holdout only.", "FP section in eval.", `${P5}/ELAH_BASELINE_EVAL.md`),
    r("Measure false negatives.", "FN on banking holdout only.", "FN section in eval.", `${P5}/ELAH_BASELINE_EVAL.md`),
    r("Measure precision and recall.", "P/R on banking holdout only.", "P/R section in eval.", `${P5}/ELAH_BASELINE_EVAL.md`),
    r("Measure calibration.", "ECE measured; rules_v0 remains uncalibrated.", "Calibration section.", `${P5}/ELAH_BASELINE_EVAL.md`),
    r("Measure latency.", "In-path latency vs 250 ms fail-open.", "Latency section.", `${P5}/ELAH_BASELINE_EVAL.md`),
    r("Document baseline limitations.", "Honest gaps before Phase 6. No production claim.", "Limitations memo.", `${P5}/ELAH_BASELINE_LIMITATIONS.md`),
    r("Display baseline outputs in the dashboard.", "/admin/elah-events + /admin/elah-baseline. Not a customer page.", "Dashboard memo.", `${P5}/ELAH_BASELINE_DASHBOARD.md`),
  ],
  "Phase 6": [
    r("Define the initial model architecture.", "CatBoost head over Phase 5 features. Live path still rules_v0.", "Architecture memo.", `${P6}/ELAH_MODEL_ARCHITECTURE.md`),
    r("Compare rules, classical machine learning, small language models, and hybrid approaches.", "Keep comparison memo. Do not ship an SLM because it sounds like AI.", "Approach comparison.", `${P6}/ELAH_MODEL_APPROACH_COMPARISON.md`),
    r("Establish a simple baseline model.", "Live baseline remains rules_v0. First trained head is offline catboost_v0.", "Baseline vs offline head note.", `${P6}/ELAH_MODEL_TRAINING_RUN.md`, { notes: "Done 30 Aug 2026 as offline head. Not wired to POST /v1/score." }),
    r("Build the training pipeline.", "python -m elah_model.train in /Users/benda/elah-model. Holdout not used to fit.", "train.py + artifacts.", `${P6}/ELAH_MODEL_TRAINING_RUN.md`),
    r("Build the evaluation pipeline.", "evaluate_split + Phase 5-compatible metrics. Not a live monitor.", "evaluate.py / metrics.json.", `${P6}/ELAH_MODEL_TRAINING_RUN.md`),
    r("Implement feature preprocessing.", "Python port of features.ts. Strip detectedIntent for train/eval.", "elah_model/features.py.", `${P6}/ELAH_MODEL_TRAINING_RUN.md`),
    r("Implement model versioning.", "artifacts/versions/. Offline rollback only.", "Versioning memo.", `${P6}/ELAH_MODEL_VERSIONING.md`),
    r("Implement experiment tracking.", "append-only experiments.jsonl. Not MLflow.", "Experiment log.", `${P6}/ELAH_MODEL_VERSIONING.md`),
    r("Train on simulator data.", "v1.1 plan only until a labeled simulator cut exists. Do not mix unlabeled logs into gold v1.0.", "v1.1 plan memo.", `${P6}/ELAH_MODEL_DATASET_V1.1_PLAN.md`, { notes: "Backlog/plan. No v1.1 cut on disk — do not mark Done." }),
    r("Train on synthetic data.", "gold v1.0 train.jsonl (393). Banking synthetic. Not CS/CRM gold.", "Training-run record.", `${P6}/ELAH_MODEL_TRAINING_RUN.md`),
    r("Evaluate on a protected holdout set.", "Blinded holdout n=100 banking-gold. Do not quote as refund accuracy.", "Holdout metrics.", `${P6}/ELAH_MODEL_TRAINING_RUN.md`),
    r("Perform error analysis.", "Per-label misses on banking holdout. Not a red team.", "Error-analysis memo.", `${P6}/ELAH_MODEL_ERROR_ANALYSIS.md`),
    r("Analyze errors by banking action.", "Same memo § action slice.", "Action-slice errors.", `${P6}/ELAH_MODEL_ERROR_ANALYSIS.md`),
    r("Analyze errors by user-intent category.", "Same memo § intent slice.", "Intent-slice errors.", `${P6}/ELAH_MODEL_ERROR_ANALYSIS.md`),
    r("Analyze errors by agent/tool behavior.", "Same memo § tool slice.", "Tool-slice errors.", `${P6}/ELAH_MODEL_ERROR_ANALYSIS.md`),
    r("Analyze model confidence.", "ECE uncalibrated holdout documented. Not live.", "Confidence memo.", `${P6}/ELAH_MODEL_CONFIDENCE.md`),
    r("Calibrate output probabilities.", "Platt offline only. Calibrator not wired to the bank.", "Calibration memo.", `${P6}/ELAH_MODEL_CALIBRATION.md`),
    r("Compare multiple calibration methods.", "Comparison in the calibration memo. Offline.", "Calibration comparison.", `${P6}/ELAH_MODEL_CALIBRATION.md`),
    r("Define abstention behavior for uncertain cases.", "Abstention memo. Abstain ≠ ELAH block. Fail-open remains.", "Abstention memo.", `${P6}/ELAH_MODEL_ABSTENTION.md`),
    r("Test robustness to missing context.", "Unknown/missing — not an attack.", "Robustness memo § missing.", `${P6}/ELAH_MODEL_ROBUSTNESS.md`),
    r("Test robustness to noisy context.", "Same memo § noisy.", "Robustness memo § noisy.", `${P6}/ELAH_MODEL_ROBUSTNESS.md`),
    r("Test robustness to adversarial inputs.", "Synthetic gold, not a red team, not production.", "Robustness memo § adversarial.", `${P6}/ELAH_MODEL_ROBUSTNESS.md`),
    r("Test inference speed.", "In-process extract+predict. Not HTTP, not a cutover.", "Latency memo.", `${P6}/ELAH_MODEL_LATENCY.md`),
    r("Test throughput.", "In-process events/sec. Not a hosted SLA.", "Throughput section.", `${P6}/ELAH_MODEL_LATENCY.md`),
    r("Test model size.", "Artifact byte size documented. CPU-class.", "Size section.", `${P6}/ELAH_MODEL_LATENCY.md`),
    r("Evaluate whether the model is lightweight enough.", "CPU-class size + in-process p95. No live cutover.", "Lightweight-enough note.", `${P6}/ELAH_MODEL_LATENCY.md`),
    r("Create model cards.", "ELAH_MODEL_CARD.md. Honest live-vs-offline.", "Model card.", `${P6}/ELAH_MODEL_CARD.md`),
    r("Document dataset versions used.", "gold v1.0. Not CS/CRM gold 0.1.", "Dataset-versions memo.", `${P6}/ELAH_MODEL_DATASET_VERSIONS.md`),
    r("Document known limitations.", "Limitations memo. No production claim.", "Limitations memo.", `${P6}/ELAH_MODEL_LIMITATIONS.md`),
    r("Add rollback support between model versions.", "Offline --set-current. Not live rollback.", "Offline rollback.", `${P6}/ELAH_MODEL_VERSIONING.md`),
    r("Integrate the best model into the ELAH service.", "Do not wire catboost_v0 to POST /v1/score without founder decision + latency budget. Live stays rules_v0.", "Integration backlog note.", `${P6}/README.md`, { notes: "Backlog. Not wired. Do not mark Done." }),
  ],
};

const PHASE_ROWS_8_15: Record<string, Row[]> = {
  "Phase 8": [
    r("Complete the ELAH threat model.", "Expand Phase 0 threat draft into the Phase 8 pack. Scoring service, ingest, dashboard, CRM sibling. No live tenant pentest claim.", "Phase 8 threat model.", `${P8}/ELAH_THREAT_MODEL.md`),
    r("Identify ELAH trust boundaries.", "Simulator | policy | /v1/score | snapshot | analyst UI. CRM Neon is a separate boundary.", "Trust-boundary diagram.", `${P8}/ELAH_TRUST_BOUNDARIES.md`),
    r("Protect the scoring service from prompt injection.", "Scorer treats event content as data. Do not execute instructions found in tickets/prompts.", "Injection-hardening note.", `${P8}/ELAH_SCORER_INJECTION.md`),
    r("Protect the scoring service from malicious event content.", "Validation + size limits. No eval() of tool args.", "Malicious-content note.", `${P8}/ELAH_SCORER_INJECTION.md`),
    r("Prevent the monitored agent from controlling the evaluator.", "Independent twins; agent cannot set its own score.", "Evaluator-independence note.", `${P8}/ELAH_EVALUATOR_ISOLATION.md`),
    r("Isolate evaluation components where appropriate.", "Logical isolation now; do not pretend a hardware enclave exists.", "Isolation note.", `${P8}/ELAH_EVALUATOR_ISOLATION.md`),
    r("Validate all incoming data.", "ScoreRequest validation. Reject then fail-open on timeout — never block via ELAH.", "Validation note.", `${P8}/ELAH_INPUT_VALIDATION.md`),
    r("Limit tool and network permissions.", "Scorer has no executeTool, no ledger writes, no CRM prisma db push.", "Permission limit.", `${P8}/ELAH_PERMISSIONS.md`),
    r("Add rate limiting.", "Rate-limit /v1/score. Fail-open semantics unchanged.", "Rate-limit note.", `${P8}/ELAH_RATE_LIMITS.md`),
    r("Add authentication and authorization.", "Service Bearer + analyst roles. Customers never see scores.", "Authn/z note.", `${P8}/ELAH_SERVICE_AUTH.md`),
    r("Add secrets management.", "Vercel Encrypted env. No secrets in git. CRM_DATABASE_URL ≠ banking DATABASE_URL.", "Secrets note.", `${P8}/ELAH_SECRETS.md`),
    r("Add audit logging.", "Analyst access to scores is audited. Not a customer-facing audit log.", "Audit-log note.", `${P8}/ELAH_AUDIT_LOGGING.md`),
    r("Add tamper-evident event handling where practical.", "Honest about what is and is not tamper-evident. No fake HSM claim.", "Tamper-evidence note.", `${P8}/ELAH_TAMPER_EVIDENCE.md`),
    r("Test replay attacks.", "Replay fixtures on simulator events only.", "Replay-test note.", `${P8}/ELAH_REDTEAM_REPLAY.md`),
    r("Test event manipulation.", "Mutated envelopes vs quality checks.", "Manipulation-test note.", `${P8}/ELAH_REDTEAM_REPLAY.md`),
    r("Test missing-event attacks.", "Dropped hops. Fail-open, not block.", "Missing-event test.", `${P8}/ELAH_REDTEAM_REPLAY.md`),
    r("Test reordered-event attacks.", "Ordering attacks on chains.", "Reorder test.", `${P8}/ELAH_REDTEAM_REPLAY.md`),
    r("Test evaluator poisoning.", "Can the agent influence /v1/score? Must be no.", "Evaluator-poisoning test.", `${P8}/ELAH_REDTEAM_EVALUATOR.md`),
    r("Test training-data poisoning.", "Gold pipeline hygiene. No live customer poison set.", "Training-poison note.", `${P8}/ELAH_REDTEAM_DATA.md`),
    r("Test prompt injection through tool outputs.", "Indirect injection via tool results / ticket text.", "Tool-output injection test.", `${P8}/ELAH_REDTEAM_INJECTION.md`),
    r("Test indirect prompt injection.", "Same pack. Simulator/gold only.", "Indirect injection test.", `${P8}/ELAH_REDTEAM_INJECTION.md`),
    r("Test malicious user instructions.", "Ignore-previous-instructions style on banking + CRM simulators.", "Malicious-user test.", `${P8}/ELAH_REDTEAM_INJECTION.md`),
    r("Test compromised agent behavior.", "Over-eager tool spam. Policy still decides.", "Compromised-agent test.", `${P8}/ELAH_REDTEAM_AGENT.md`),
    r("Test compromised tool behavior.", "Tool returns hostile content. Scorer must not execute it.", "Compromised-tool test.", `${P8}/ELAH_REDTEAM_AGENT.md`),
    r("Test excessive autonomy.", "Multi-step without confirmation where policy requires it — policy issue, not ELAH block.", "Autonomy test.", `${P8}/ELAH_REDTEAM_AGENT.md`),
    r("Test logical drift caused by model mistakes.", "Wrong label ≠ ELAH execute. Document as limitation.", "Logical-drift test.", `${P8}/ELAH_REDTEAM_AGENT.md`),
    r("Test attacks against the ELAH evaluator itself.", "Auth bypass, prompt-in-fields, DoS. Fail-open.", "Evaluator-attack test.", `${P8}/ELAH_REDTEAM_EVALUATOR.md`),
    r("Create red-team scenarios.", "Scenario list in the Phase 8 pack. Synthetic/simulator only.", "Red-team scenario list.", `${P8}/ELAH_REDTEAM_SCENARIOS.md`),
    r("Record findings and remediation tasks.", "Findings log with severity. No invented criticals.", "Findings log.", `${P8}/ELAH_REDTEAM_FINDINGS.md`),
    r("Define severity levels.", "Severity rubric. Do not auto-page from ELAH scores.", "Severity rubric.", `${P8}/ELAH_SECURITY_SEVERITY.md`),
    r("Define security acceptance criteria for the MVP.", "MVP bar: freeze + isolation + no customer scores. Not SOC2.", "MVP security criteria.", `${P8}/ELAH_SECURITY_MVP_CRITERIA.md`),
    r("Conduct an external security review when ready.", "Do not mark Done. No review is scheduled on this card.", "Placeholder for external review.", `${P8}/ELAH_EXTERNAL_REVIEW.md`, { notes: "Not started. Do not invent a vendor or report." }),
  ],
  "Phase 9": [
    r("Build the ELAH operational dashboard.", "Founder/admin shell for CS/CRM ops analysts first; banking pages remain the demo. No elahScore on customer UI.", "Ops dashboard shell.", `${P9}/ELAH_OPS_DASHBOARD.md`),
    r("Add real-time or near-real-time updates.", "AutoRefresh already used on some pages. Document polling vs live. No fake websocket SLA.", "Near-real-time note.", `${P9}/ELAH_OPS_DASHBOARD.md`),
    r("Add event list.", "Admin/founder event list. Not Jane’s home.", "Event list.", `${P9}/ELAH_EVENT_LIST.md`),
    r("Add event details.", "Score card + envelope. Policy decision from the event.", "Event detail.", `${P9}/ELAH_EVENT_DETAIL.md`),
    r("Add score visualization.", "Analyst-only. Uncalibrated badge if rules_v0.", "Score viz.", `${P9}/ELAH_SCORE_VIZ.md`),
    r("Add confidence visualization.", "Align with Phase 7 glyphs. Not a fourth axis.", "Confidence viz.", `${P9}/ELAH_SCORE_VIZ.md`),
    r("Add intention coordinates.", "HA/FR/EU on analyst views. Link intent-matrix.", "Coordinates on ops UI.", `${P9}/ELAH_COORDINATES_UI.md`),
    r("Add action-chain visualization.", "Session chain. Explanation, not enforcement.", "Chain viz.", `${P9}/ELAH_CHAIN_VIZ.md`),
    r("Add explanation panel.", "Matched/weak/negative signals. No CoT.", "Explanation panel.", `${P9}/ELAH_EXPLANATION_PANEL.md`),
    r("Add risk indicators.", "Y-axis / discrete band. Red ≠ ELAH blocked.", "Risk indicators.", `${P9}/ELAH_RISK_INDICATORS.md`),
    r("Add filtering.", "Analyst filters. No customer score filter.", "Filters.", `${P9}/ELAH_FILTERS.md`),
    r("Add search.", "Search envelopes for authorized roles only.", "Search.", `${P9}/ELAH_FILTERS.md`),
    r("Add date ranges.", "Date range on lists.", "Date-range filter.", `${P9}/ELAH_FILTERS.md`),
    r("Add user and session filters.", "Demo users only in the simulator.", "User/session filters.", `${P9}/ELAH_FILTERS.md`),
    r("Add banking-action filters.", "Banking-demo action filters. CS/CRM tools get their own later, not a 23rd banking label.", "Action filters.", `${P9}/ELAH_FILTERS.md`),
    r("Add agent/tool filters.", "Tool-name filters.", "Tool filters.", `${P9}/ELAH_FILTERS.md`),
    r("Add model-version filters.", "rules_v0 vs later versions. Do not hide provenance.", "Model-version filter.", `${P9}/ELAH_FILTERS.md`),
    r("Add threshold visualization.", "Tenant thresholds vs score — thresholds do not change elahScore.", "Threshold viz.", `${P9}/ELAH_THRESHOLDS_UI.md`),
    r("Let the customer configure thresholds without changing the ELAH score.", "Policy config is tenant. ELAH score immutable from this UI.", "Threshold config UX.", `${P9}/ELAH_THRESHOLDS_UI.md`),
    r("Add saved views.", "Analyst saved views. Not marketing dashboards with fake KPIs.", "Saved views.", `${P9}/ELAH_SAVED_VIEWS.md`),
    r("Add analyst notes.", "Notes on events. No live customer PII.", "Analyst notes.", `${P9}/ELAH_ANALYST_NOTES.md`),
    r("Add review status.", "Review workflow for ops analysts.", "Review status.", `${P9}/ELAH_REVIEW_STATUS.md`),
    r("Add false-positive marking.", "FP marks feed future gold — simulator/gold only.", "FP marking.", `${P9}/ELAH_FEEDBACK.md`),
    r("Add false-negative marking.", "FN marks, same privacy rules.", "FN marking.", `${P9}/ELAH_FEEDBACK.md`),
    r("Add feedback collection.", "Structured feedback. Not a CSAT fake number.", "Feedback collection.", `${P9}/ELAH_FEEDBACK.md`),
    r("Add export functionality.", "Authorized export of envelopes/snapshots. No live Zendesk dump.", "Export.", `${P9}/ELAH_EXPORT.md`),
    r("Add CSV or JSON export.", "CSV/JSON of analyst views.", "CSV/JSON export.", `${P9}/ELAH_EXPORT.md`),
    r("Add role-based access.", "security.admin / founder vs customer. Support user ≠ analyst.", "RBAC note.", `${P9}/ELAH_RBAC.md`),
    r("Add audit history.", "Who viewed/exported scores.", "Audit history.", `${P9}/ELAH_RBAC.md`),
    r("Add loading, empty, and error states.", "Honest empty states. No skeleton fake metrics.", "Empty/error states.", `${P9}/ELAH_OPS_DASHBOARD.md`),
    r("Verify mobile and desktop responsiveness.", "Analyst desktop-first; check mobile doesn’t leak scores on customer chrome.", "Responsive check.", `${P9}/ELAH_OPS_DASHBOARD.md`),
    r("Run accessibility checks.", "Analyst UI a11y. Do not fail closed by hiding scores from screen readers on customer pages — scores must not be there.", "A11y note.", `${P9}/ELAH_OPS_DASHBOARD.md`),
  ],
  "Phase 10": [
    r("Define the golden evaluation set.", "Banking gold v1.0 holdout is the current yardstick. CS/CRM gold is a different datasetVersion (Phase 16). Do not mix.", "Golden-set definition.", `${P10}/ELAH_GOLDEN_SET.md`),
    r("Define minimum acceptable accuracy.", "Write a Proposed bar. Do not treat holdout 0.79 or 0.90 as a customer SLA.", "Accuracy bar (Proposed).", `${P10}/ELAH_ACCEPTANCE_METRICS.md`),
    r("Define minimum acceptable calibration.", "rules_v0 is uncalibrated. Do not claim ECE as calibrated production.", "Calibration bar (Proposed).", `${P10}/ELAH_ACCEPTANCE_METRICS.md`),
    r("Define acceptable false-positive rates.", "Proposed FP bar on banking-gold. No CS/CRM FP rate on file.", "FP bar (Proposed).", `${P10}/ELAH_ACCEPTANCE_METRICS.md`),
    r("Define acceptable false-negative rates.", "Proposed FN bar. Injection recall is not a CS/CRM refund claim.", "FN bar (Proposed).", `${P10}/ELAH_ACCEPTANCE_METRICS.md`),
    r("Define acceptable latency.", "p95 vs 250 ms fail-open. Do not raise the ceiling here.", "Latency bar.", `${P10}/ELAH_ACCEPTANCE_METRICS.md`),
    r("Define acceptable availability.", "Fail-open on scorer down. Availability of demo ≠ production SLA.", "Availability bar.", `${P10}/ELAH_ACCEPTANCE_METRICS.md`),
    r("Define explainability acceptance criteria.", "Phase 0/7 no-CoT checklist. CS/CRM ops analyst can read the panel.", "Explainability bar.", `${P10}/ELAH_EXPLAINABILITY_BAR.md`),
    r("Define banking-analyst usability criteria.", "Later banking vertical. First usability protocol is CS/CRM (Phase 7 understandability). Do not invent bank SOC interviews.", "Later-vertical usability note.", `${P10}/ELAH_ANALYST_USABILITY.md`),
    r("Run end-to-end tests.", "Jane transfer + injection + CRM refund demo. Customer UI score-free.", "E2E test note.", `${P10}/ELAH_E2E_TESTS.md`),
    r("Run load tests.", "Do not invent RPS. Measure or mark not-run.", "Load-test note.", `${P10}/ELAH_LOAD_TESTS.md`, { notes: "Not a production load test unless a report exists." }),
    r("Run failure-mode tests.", "Timeout / scoring_unavailable fail-open.", "Failure-mode tests.", `${P10}/ELAH_FAILURE_MODES.md`),
    r("Run security tests.", "Point at Phase 8. Do not mark this Done as a pentest.", "Security-test pointer.", `${P8}/ELAH_REDTEAM_SCENARIOS.md`),
    r("Run data-loss tests.", "Snapshot vs envelope: scores not lost onto the event; CRM not mixed into banking Neon.", "Data-loss tests.", `${P10}/ELAH_FAILURE_MODES.md`),
    r("Run service-timeout tests.", "250 ms fail-open fixture.", "Timeout tests.", `${P10}/ELAH_FAILURE_MODES.md`),
    r("Run model-rollback tests.", "Offline rollback only until live integration.", "Rollback tests.", `${P6}/ELAH_MODEL_VERSIONING.md`),
    r("Validate monitoring and alerting.", "Founder/admin alerts. No fake uptime %.", "Monitoring note.", `${P10}/ELAH_MONITORING.md`),
    r("Validate dashboard correctness.", "Analyst views match snapshots. Customer views have no scores.", "Dashboard correctness.", `${P10}/ELAH_DASHBOARD_QA.md`),
    r("Validate score consistency.", "rules_v0 determinism. Same envelope → same score.", "Consistency check.", `${P10}/ELAH_SCORE_CONSISTENCY.md`),
    r("Validate threshold separation.", "Changing tenant threshold does not mutate stored elahScore.", "Threshold separation.", `${P10}/ELAH_THRESHOLD_SEPARATION.md`),
    r("Document release procedures.", "Banking vs CRM vs founder deploys. No prisma db push onto the wrong DB.", "Release procedure.", `${P10}/ELAH_RELEASE.md`),
    r("Document incident procedures.", "Scorer down = fail-open. Not “ELAH blocked the bank.”", "Incident procedure.", `${P10}/ELAH_INCIDENT.md`),
    r("Document known limitations.", "Reuse Phase 5/6 limitations. No production claim.", "Limitations.", `${P10}/ELAH_MVP_LIMITATIONS.md`),
    r("Prepare the MVP demo.", "CS/CRM demo script is Phase 16; banking demo script remains encore.", "Demo readiness note.", `${P13}/ELAH_DEMO_SCRIPT.md`),
    r("Create repeatable demo scenarios.", "DemoPass123! paths. No live customer.", "Repeatable demos.", `${P1}/ELAH_PHASE1_SCENARIOS.md`),
    r("Create a technical demo script.", "Banking technical script exists; keep freeze language. CS/CRM script is Phase 16.", "Technical demo script.", `${P13}/ELAH_DEMO_SCRIPT.md`),
    r("Create a non-technical demo script.", "Non-technical path. First story is CS/CRM ops after the pivot; banking is encore.", "Non-technical script pointer.", "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_DEMO_SCRIPT.md"),
    r("Produce an MVP readiness report.", "Honest: banking demo + rules_v0 + CS/CRM venue in motion. No customers, no ARR.", "Readiness report (Proposed).", `${P10}/ELAH_MVP_READINESS.md`),
  ],
};

const PHASE_ROWS_11_15: Record<string, Row[]> = {
  "Phase 11": [
    r("Define the ideal banking customer profile.", "Later-vertical ICP only. First-buyer ICP is Phase 16 ELAH_ICP_CS_CRM.md. Do not treat this as live outreach.", "Later banking ICP memo.", `${P11}/ELAH_BANKING_ICP.md`),
    r("Identify relevant roles inside banks.", "CISO / fraud / AI governance as later-vertical roles. Do not email them from this card.", "Banking roles list.", `${P11}/ELAH_BANKING_ROLES.md`),
    r("Identify fraud leaders.", "Research public titles only. No invented emails. Not contacted.", "Fraud-leader research list.", `${P11}/ELAH_BANKING_ROLES.md`),
    r("Identify cybersecurity leaders.", "Public pages only. Status research/identified.", "Cyber leader research list.", `${P11}/ELAH_BANKING_ROLES.md`),
    r("Identify AI governance leaders.", "Public pages only. Not the CS/CRM first buyer.", "AI-gov research list.", `${P11}/ELAH_BANKING_ROLES.md`),
    r("Identify digital-banking leaders.", "Public pages only.", "Digital-banking research list.", `${P11}/ELAH_BANKING_ROLES.md`),
    r("Identify innovation leaders.", "Public pages only.", "Innovation-leader research list.", `${P11}/ELAH_BANKING_ROLES.md`),
    r("Identify risk and compliance stakeholders.", "Public pages only.", "Risk/compliance research list.", `${P11}/ELAH_BANKING_ROLES.md`),
    r("Build a list of banks and fintech companies.", "Public firms + source URLs. Email null. Not contacted.", "Bank/fintech list.", `${P11}/ELAH_BANK_LIST.md`),
    r("Prioritize Israeli banks.", "Prioritized later-vertical list. Not the CS/CRM wedge list.", "Israeli-bank priority note.", `${P11}/ELAH_BANK_LIST.md`),
    r("Prioritize fintech design partners.", "Later vertical. Phase 16 owns CS/CRM design-partner research.", "Fintech priority note.", `${P11}/ELAH_BANK_LIST.md`),
    r("Create an interview script.", "Banking-domain script for later vertical. CS/CRM script already exists in Phase 16 — do not duplicate as “done interviews.”", "Banking interview script.", `${P11}/ELAH_BANKING_INTERVIEW_SCRIPT.md`),
    r("Conduct banking-domain interviews.", "Do not invent notes. Agents do not email. Card stays backlog until founder logs a real interview.", "Interview notes (none yet).", `${P11}/ELAH_INTERVIEW_NOTES.md`, { notes: "No interviews logged. Do not mark Done." }),
    r("Conduct security-team interviews.", "Same: zero completed. No fabricated quotes.", "Security interview notes (none yet).", `${P11}/ELAH_INTERVIEW_NOTES.md`, { notes: "No interviews logged." }),
    r("Conduct AI-governance interviews.", "Same: zero completed.", "AI-gov interview notes (none yet).", `${P11}/ELAH_INTERVIEW_NOTES.md`, { notes: "No interviews logged." }),
    r("Document current workflows.", "Cannot document customer workflows without interviews. Write the empty template only.", "Workflow template (empty).", `${P11}/ELAH_WORKFLOWS.md`),
    r("Document existing agent-security concerns.", "Template only until interviews exist.", "Concerns template.", `${P11}/ELAH_AGENT_SECURITY_CONCERNS.md`),
    r("Validate whether human-intention scoring is valuable.", "Not validated with customers. Phase 16 interview script is the first-buyer path.", "Validation log (empty).", `${P11}/ELAH_VALUE_VALIDATION.md`),
    r("Validate which explanations customers need.", "No customer explanation study. Phase 7 CS/CRM understandability protocol is the sibling.", "Explanation-needs log (empty).", `${P11}/ELAH_EXPLANATION_NEEDS.md`),
    r("Validate acceptable false-positive rates.", "No customer FP tolerance. Do not reuse holdout 0.79 as a buyer quote.", "FP-tolerance log (empty).", `${P11}/ELAH_FP_TOLERANCE.md`),
    r("Validate deployment constraints.", "No customer deployment interviews.", "Deployment-constraints log (empty).", `${P11}/ELAH_DEPLOYMENT_CONSTRAINTS.md`),
    r("Validate on-premise or private-cloud needs.", "Unknown until a later-vertical interview. Do not claim on-prem.", "On-prem log (empty).", `${P11}/ELAH_DEPLOYMENT_CONSTRAINTS.md`),
    r("Validate data-residency requirements.", "Unknown. Demo data is synthetic.", "Residency log (empty).", `${P11}/ELAH_DATA_RESIDENCY.md`),
    r("Validate procurement constraints.", "Unknown. Do not invent a bank RFP.", "Procurement log (empty).", `${P11}/ELAH_PROCUREMENT.md`),
    r("Validate regulatory concerns.", "Unknown. Draft questions only.", "Regulatory log (empty).", `${P11}/ELAH_REGULATORY.md`),
    r("Record interview notes.", "Zero notes. Do not fabricate.", "Notes folder (empty).", `${P11}/ELAH_INTERVIEW_NOTES.md`),
    r("Convert insights into product tasks.", "Blocked on real interviews. Do not mint fake insights.", "Insight→task log (empty).", `${P11}/ELAH_INSIGHTS_TO_TASKS.md`),
    r("Track repeated pain points.", "Empty until ≥2 real interviews.", "Pain-point tracker (empty).", `${P11}/ELAH_PAIN_POINTS.md`),
    r("Define pilot qualification criteria.", "Later banking pilot bar. First-pilot motion is Phase 16 CS/CRM — do not qualify a bank as the first buyer.", "Later-vertical qualification.", `${P11}/ELAH_PILOT_QUALIFICATION.md`),
  ],
  "Phase 12": [
    r("Define the pilot offer.", "Later banking offer brief. First offer motion is Phase 16 CS/CRM. Do not send this as live sales.", "Later banking pilot offer.", `${P12}/ELAH_PILOT_OFFER.md`),
    r("Define pilot scope.", "Scoring + explanations + analyst UI. ELAH does not run the bank’s tools.", "Pilot scope.", `${P12}/ELAH_PILOT_SCOPE.md`),
    r("Define pilot duration.", "Proposed duration. No signed clock.", "Pilot duration.", `${P12}/ELAH_PILOT_SCOPE.md`),
    r("Define pilot success metrics.", "Do not reuse banking holdout as a customer KPI.", "Pilot metrics (Proposed).", `${P12}/ELAH_PILOT_METRICS.md`),
    r("Define technical integration requirements.", "Event envelope + POST /v1/score + fail-open. Separate DB from CRM Neon.", "Integration requirements.", `${P12}/ELAH_PILOT_INTEGRATION.md`),
    r("Define customer responsibilities.", "Tenant policy still allow/deny/confirm. Customer does not expect ELAH to block.", "Customer responsibilities.", `${P12}/ELAH_PILOT_RACI.md`),
    r("Define ELAH responsibilities.", "Score before tools. Never execute. No live-data training without a DPA (none signed).", "ELAH responsibilities.", `${P12}/ELAH_PILOT_RACI.md`),
    r("Create a pilot one-pager.", "Later-vertical one-pager. Investor one-pager is Phase 13/16 and already CS/CRM-first.", "Pilot one-pager (later vertical).", `${P12}/ELAH_PILOT_ONE_PAGER.md`),
    r("Create a pilot presentation.", "Do not invent logos. Freeze spoken once.", "Pilot deck (later vertical).", `${P12}/ELAH_PILOT_DECK.md`),
    r("Create a product demo.", "Point at CRM simulator as first venue; banking as encore. See Phase 16 script.", "Demo pointer.", "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_DEMO_SCRIPT.md"),
    r("Create an architecture overview.", "Reuse Phase 0 architecture. CRM sibling explicit.", "Architecture overview for pilots.", `${P12}/ELAH_PILOT_ARCHITECTURE.md`),
    r("Create a security overview.", "Reuse Phase 0/8 drafts. No SOC2 claim.", "Security overview.", `${P12}/ELAH_PILOT_SECURITY.md`),
    r("Create an FAQ.", "Freeze FAQ. No fake customers.", "Pilot FAQ.", `${P12}/ELAH_PILOT_FAQ.md`),
    r("Create a data-processing explanation.", "Synthetic/simulator data. No live tickets.", "Data-processing explanation.", `${P12}/ELAH_PILOT_DATA.md`),
    r("Create an initial pilot agreement checklist.", "Checklist pending counsel. Not a signed MSA.", "Agreement checklist (draft).", `${P12}/ELAH_PILOT_AGREEMENT_CHECKLIST.md`),
    r("Identify pilot candidates.", "Later banking candidates. CS/CRM buyer list is Phase 16. Email null.", "Candidate list (research).", `${P12}/ELAH_PILOT_CANDIDATES.md`),
    r("Contact potential design partners.", "Agents do not email. Founder-only. Not contacted on file.", "Outreach log (empty).", `${P12}/ELAH_PILOT_OUTREACH.md`, { notes: "No outreach sent. Do not mark contacted." }),
    r("Schedule discovery meetings.", "None scheduled. Do not invent calendars.", "Meetings log (empty).", `${P12}/ELAH_PILOT_OUTREACH.md`),
    r("Run technical workshops.", "None run.", "Workshop notes (empty).", `${P12}/ELAH_PILOT_OUTREACH.md`),
    r("Collect integration requirements.", "None collected from a partner.", "Requirements log (empty).", `${P12}/ELAH_PILOT_INTEGRATION.md`),
    r("Create a pilot implementation plan.", "Template only.", "Implementation-plan template.", `${P12}/ELAH_PILOT_IMPLEMENTATION.md`),
    r("Select the first pilot partner.", "None selected. First-client aspiration is CS/CRM (Phase 16), unnamed.", "Partner selection (none).", `${P12}/ELAH_PILOT_CANDIDATES.md`, { notes: "No named partner. Do not invent one." }),
    r("Prepare a sandbox integration.", "Simulators are the sandbox. Not a bank sandbox.", "Sandbox note.", `${P12}/ELAH_PILOT_INTEGRATION.md`),
    r("Execute the pilot.", "Not started. Do not mark Done.", "Pilot execution (not started).", `${P12}/ELAH_PILOT_EXECUTION.md`),
    r("Collect analyst feedback.", "No partner analysts. Internal CS/CRM understandability is Phase 7.", "Feedback log (empty).", `${P12}/ELAH_PILOT_FEEDBACK.md`),
    r("Measure pilot outcomes.", "No outcomes. Do not paste holdout metrics.", "Outcomes log (empty).", `${P12}/ELAH_PILOT_REPORT.md`),
    r("Produce a pilot report.", "Cannot produce without a pilot.", "Report (not started).", `${P12}/ELAH_PILOT_REPORT.md`),
    r("Obtain a testimonial or reference when appropriate.", "None. Do not write a fake quote.", "Testimonial (none).", `${P12}/ELAH_PILOT_TESTIMONIAL.md`),
  ],
  "Phase 13": [
    r("Define the fundraising target.", "Keep $400K working ask. Not closed. Do not change the ask here.", "Fundraise-ask memo.", `${P13}/ELAH_FUNDRAISE_ASK.md`),
    r("Define the expected runway.", "12 months at the working ask. Year-1 revenue $0.", "Runway section.", `${P13}/ELAH_FUNDRAISE_ASK.md`),
    r("Build the financial plan.", "Plan + CSV. Assumptions, not actuals.", "Financial plan.", `${P13}/ELAH_FINANCIAL_PLAN.md`),
    r("Define use of funds.", "Use-of-funds memo. No invented hires as hired.", "Use of funds.", `${P13}/ELAH_USE_OF_FUNDS.md`),
    r("Define hiring priorities.", "Priorities memo. CS/CRM GTM after the pivot, not bank-sales-first.", "Hiring priorities.", `${P13}/ELAH_HIRING_PRIORITIES.md`),
    r("Build the investor target list.", "Public firms, blank emails, not contacted.", "Investor list.", `${P13}/ELAH_INVESTOR_LIST.md`),
    r("Prioritize pre-seed and seed funds.", "Wave tags on the list. Do not mark contacted.", "Pre-seed/seed priority.", `${P13}/ELAH_INVESTOR_LIST.md`),
    r("Prioritize AI, cybersecurity, fintech, and enterprise investors.", "Sector tags. Wedge sentence is CS/CRM ops, banking is demo.", "Sector priority.", `${P13}/ELAH_INVESTOR_LIST.md`),
    r("Identify relevant partners at each fund.", "Public partner pages only. No fabricated people.", "Partner names on list (public).", `${P13}/ELAH_INVESTOR_LIST.md`),
    r("Track investor emails and LinkedIn profiles.", "Email stays null unless founder supplies one. LinkedIn public URLs only.", "CRM hygiene note.", `${P13}/ELAH_OUTREACH_OPS.md`),
    r("Draft a short cold email.", "Keep freeze; CS/CRM-first; no ‘we block fraud’; founder sends.", "Cold email.", `${P13}/ELAH_COLD_EMAIL.md`),
    r("Draft personalized outreach variants.", "Variants of the ask line. Agents do not send.", "Email variants.", `${P13}/ELAH_COLD_EMAIL.md`),
    r("Create the investor deck.", "Deck markdown. First wedge CS/CRM. No fake traction.", "Investor deck.", `${P13}/ELAH_INVESTOR_DECK.md`),
    r("Create a concise one-pager.", "v0.2 Proposed CS/CRM-first. Founder Approve still required.", "One-pager.", `${P13}/ELAH_ONE_PAGER.md`),
    r("Create a technical appendix.", "Honest live rules_v0 + offline catboost_v0. HA/FR/EU.", "Technical appendix.", `${P13}/ELAH_TECHNICAL_APPENDIX.md`),
    r("Create a product demo.", "Demo script. Banking encore; CS/CRM open is Phase 16.", "Demo script.", `${P13}/ELAH_DEMO_SCRIPT.md`),
    r("Create a data room.", "Git index. Company/cap-table pending counsel.", "Data-room index.", `${P13}/ELAH_DATA_ROOM.md`),
    r("Add company documents.", "Checklist only until counsel.", "Company folder README.", `${P13}/data-room/company/README.md`),
    r("Add architecture documents.", "Pointers to Phase 0 architecture.", "Architecture folder.", `${P13}/data-room/architecture/README.md`),
    r("Add roadmap documents.", "Investor roadmap. Phase 16 wedge visible. Phase 11–12 later vertical.", "Roadmap-for-investors.", `${P13}/ELAH_ROADMAP_FOR_INVESTORS.md`),
    r("Add market research.", "No invented TAM precision. CS/CRM first, banking later.", "Market memo.", `${P13}/ELAH_MARKET.md`),
    r("Add financial assumptions.", "Assumptions memo. Not actuals.", "Financial assumptions.", `${P13}/ELAH_FINANCIAL_ASSUMPTIONS.md`),
    r("Add cap-table information when available.", "Folder is a checklist. Do not invent percentages.", "Cap-table README.", `${P13}/data-room/cap-table/README.md`),
    r("Contact investors.", "Founder-only. Agents never send. Log stays empty until founder does.", "Outreach ops.", `${P13}/ELAH_OUTREACH_OPS.md`, { notes: "No outbound mail on file from agents. Do not mark contacted." }),
    r("Track replies.", "Empty until founder logs one.", "Reply tracking.", `${P13}/ELAH_OUTREACH_OPS.md`),
    r("Schedule meetings.", "None on file. Do not invent.", "Meetings log.", `${P13}/ELAH_OUTREACH_OPS.md`),
    r("Track investor questions.", "FAQ seed exists. No live Q-log from meetings.", "Investor FAQ.", `${P13}/ELAH_INVESTOR_FAQ.md`),
    r("Track follow-ups.", "Empty.", "Follow-up log.", `${P13}/ELAH_OUTREACH_OPS.md`),
    r("Track introductions.", "Empty.", "Intro log.", `${P13}/ELAH_OUTREACH_OPS.md`),
    r("Track passed investors and reasons.", "Empty. Do not invent passes.", "Passed log.", `${P13}/ELAH_OUTREACH_OPS.md`),
    r("Refine the pitch based on feedback.", "No meeting feedback yet. One-pager already CS/CRM-first Proposed.", "Pitch refine note.", `${P13}/ELAH_INVESTOR_DECK.md`),
    r("Maintain an investor pipeline.", "RoadmapContact CRM. Emails blank. Status research/identified.", "Pipeline ops.", `${P13}/ELAH_OUTREACH_OPS.md`),
  ],
  "Phase 14": [
    r("Confirm the company structure for ELAH.", "Draft questions for counsel. Do not invent an entity type as filed.", "Structure memo (draft).", `${P14}/ELAH_COMPANY_STRUCTURE.md`, { notes: "Not legal advice. Pending counsel." }),
    r("Review founder and intellectual-property ownership.", "Checklist for counsel. Do not claim assignments are signed unless they are.", "IP checklist (draft).", `${P14}/ELAH_IP_OWNERSHIP.md`),
    r("Prepare advisor or contractor agreements where required.", "Template checklist. Do not generate fake signed PDFs.", "Advisor/contractor checklist.", `${P14}/ELAH_CONTRACTOR_AGREEMENTS.md`),
    r("Review open-source licenses.", "Inventory Next/Prisma/CatBoost licenses. No copyleft surprise claim without a scan.", "OSS license notes.", `${P14}/ELAH_OSS_LICENSES.md`),
    r("Create a privacy policy.", "Demo-user draft. Not counsel-approved. No live customer processing.", "Privacy policy (draft).", `${P14}/ELAH_PRIVACY_POLICY_DRAFT.md`),
    r("Create terms for demo users.", "DemoPass123! simulator terms draft.", "Demo terms (draft).", `${P14}/ELAH_DEMO_TERMS_DRAFT.md`),
    r("Define data-processing roles.", "Controller/processor draft for a future tenant. Simulator data is ours/synthetic.", "Roles draft.", `${P14}/ELAH_DATA_PROCESSING_ROLES.md`),
    r("Define data-retention policies.", "Align with Phase 0 retention. Simulator/gold only.", "Retention draft.", `${P14}/ELAH_RETENTION_POLICY.md`),
    r("Define deletion procedures.", "How to wipe demo DBs. Never wipe the wrong Neon.", "Deletion procedure (draft).", `${P14}/ELAH_DELETION.md`),
    r("Define access-control policies.", "Roles: customer vs analyst vs founder. Scores analyst-only.", "Access-control draft.", `${P14}/ELAH_ACCESS_CONTROL.md`),
    r("Define incident-response procedures.", "Align with Phase 10 incident note. Fail-open ≠ silent hide.", "IR draft.", `${P14}/ELAH_INCIDENT_RESPONSE.md`),
    r("Map relevant banking and privacy obligations.", "Later vertical. First wedge is CS/CRM — map both, do not claim bank charter.", "Obligations map (draft).", `${P14}/ELAH_OBLIGATIONS_MAP.md`),
    r("Review Israeli privacy requirements.", "Questions for Israeli counsel. Not a legal opinion.", "Israeli privacy questions.", `${P14}/ELAH_ISRAELI_PRIVACY.md`),
    r("Review GDPR relevance.", "Demo users + future EU SaaS tenants. Draft only.", "GDPR relevance draft.", `${P14}/ELAH_GDPR.md`),
    r("Review financial-sector security expectations.", "Later banking vertical. Do not claim PCI/SOC2.", "Financial-sector expectations draft.", `${P14}/ELAH_FINANCIAL_SECTOR_SECURITY.md`),
    r("Review AI governance requirements.", "Questions only. ELAH is a scorer, not an autonomous agent.", "AI-governance questions.", `${P14}/ELAH_AI_GOVERNANCE.md`),
    r("Prepare a security questionnaire response library.", "Draft answers from freeze + architecture. No fake certifications.", "Questionnaire library (draft).", `${P14}/ELAH_SECURITY_QUESTIONNAIRE.md`),
    r("Prepare an initial data-processing agreement checklist.", "Checklist pending counsel. Not a signed DPA.", "DPA checklist.", `${P14}/ELAH_DPA_CHECKLIST.md`),
    r("Identify where professional legal advice is required.", "Entity, IP, privacy, DPA, employment. List the gaps.", "Counsel-needed list.", `${P14}/ELAH_COUNSEL_NEEDED.md`),
    r("Do not present generated content as final legal advice.", "Keep this card as a standing OUT: agents draft, counsel signs. Never mark the others Done as legal truth.", "Standing non-advice notice.", `${P14}/README.md`, { notes: "Standing rule. Generated Phase 14 files are drafts." }),
  ],
  "Phase 15": [
    r("Define required founding-team roles.", "Product, eng, ML, security, GTM. CS/CRM GTM first after the pivot.", "Founding roles.", `${P15}/ELAH_FOUNDING_ROLES.md`),
    r("Define technical skill gaps.", "Gaps vs current founder-only repo. No invented teammates.", "Tech skill gaps.", `${P15}/ELAH_SKILL_GAPS.md`),
    r("Define machine-learning skill gaps.", "Offline CatBoost exists; live integration + calibration engineering still a gap.", "ML skill gaps.", `${P15}/ELAH_SKILL_GAPS.md`),
    r("Define security-research skill gaps.", "Phase 8 unstaffed. No external review booked.", "Security-research gaps.", `${P15}/ELAH_SKILL_GAPS.md`),
    r("Define banking-domain skill gaps.", "Later vertical. First domain gap is CS/CRM ops, not bank-only.", "Domain skill gaps.", `${P15}/ELAH_SKILL_GAPS.md`),
    r("Decide whether a technical co-founder is required.", "Open founder decision. Do not invent a co-founder.", "Co-founder decision (open).", `${P15}/ELAH_COFOUNDER.md`),
    r("Identify potential advisors.", "Public names only if founder supplies them. No cold-email from agents.", "Advisor list (research).", `${P15}/ELAH_ADVISORS.md`),
    r("Identify potential security researchers.", "Research list. Not hired.", "Security-researcher list.", `${P15}/ELAH_ADVISORS.md`),
    r("Identify potential banking advisors.", "Later vertical. CS/CRM ops advisor may be higher priority.", "Banking-advisor list.", `${P15}/ELAH_ADVISORS.md`),
    r("Define hiring order.", "Align with ELAH_HIRING_PRIORITIES.md and $400K use of funds.", "Hiring order.", `${P13}/ELAH_HIRING_PRIORITIES.md`),
    r("Define contractor needs.", "Docs/labeling/red-team as contractor options. Not hired.", "Contractor needs.", `${P15}/ELAH_CONTRACTORS.md`),
    r("Define equity and compensation questions for professional review.", "Questions for counsel/accountant. No cap-table percentages.", "Comp questions.", `${P15}/ELAH_COMP_QUESTIONS.md`),
    r("Set a weekly operating review.", "Use founder Kanban. Do not fake a staffed weekly if it is founder-only.", "Weekly review note.", `${P15}/ELAH_OPERATING_CADENCE.md`),
    r("Set monthly milestone reviews.", "Milestones already on the board. Recompute progress via seed scripts, not prisma db push.", "Monthly review note.", `${P15}/ELAH_OPERATING_CADENCE.md`),
    r("Maintain an issue and decision log.", "RoadmapDecision already has the CS/CRM wedge decision (8 Sep 2026).", "Decision log (Kanban).", "app/founder/roadmap"),
    r("Maintain documentation.", "Phase folders in founder + banking repos. Folder names exact.", "Docs hygiene note.", `${P15}/ELAH_DOCS_STANDARDS.md`),
    r("Define development standards.", "TS/Next, no secrets in git, no wrong-DB push.", "Dev standards.", `${P15}/ELAH_DEV_STANDARDS.md`),
    r("Define code-review standards.", "Founder-only today. Standard still written.", "Review standards.", `${P15}/ELAH_DEV_STANDARDS.md`),
    r("Define testing standards.", "tests/elah, phase4/5 suites. No CoT tests that dump prompts to customers.", "Testing standards.", `${P15}/ELAH_TESTING_STANDARDS.md`),
    r("Define release standards.", "Vercel main. Banking vs CRM vs founder projects separated.", "Release standards.", `${P15}/ELAH_RELEASE_STANDARDS.md`),
    r("Track infrastructure costs.", "Neon/Vercel actuals if founder pastes them. Do not invent a burn graph.", "Infra cost tracker (empty or founder-supplied).", `${P15}/ELAH_COSTS.md`),
    r("Track model-training costs.", "Offline CatBoost on a laptop is not a GPU invoice. Do not invent cloud ML spend.", "Training-cost note.", `${P15}/ELAH_COSTS.md`),
    r("Track monthly burn.", "Unknown unless founder supplies. Working plan is the $400K model, not actuals.", "Burn tracker.", `${P15}/ELAH_COSTS.md`),
    r("Track runway.", "Tied to the working ask, not a bank balance claim.", "Runway note.", `${P13}/ELAH_FUNDRAISE_ASK.md`),
  ],
};

function allRows(): Map<string, Map<string, Row>> {
  const nested = new Map<string, Map<string, Row>>();
  for (const block of [PHASE_ROWS, PHASE_ROWS_8_15, PHASE_ROWS_11_15]) {
    for (const [phase, rows] of Object.entries(block)) {
      const inner = nested.get(phase) ?? new Map<string, Row>();
      for (const row of rows) inner.set(row.title, row);
      nested.set(phase, inner);
    }
  }
  return nested;
}

const ROW_INDEX = allRows();

function lookupRow(phase: string, title: string): Row | undefined {
  const key = phaseKey(phase);
  const inner = ROW_INDEX.get(key);
  if (!inner) return undefined;
  if (inner.has(title)) return inner.get(title);
  const withDot = title.endsWith(".") ? title : `${title}.`;
  const without = bare(title) + ".";
  return inner.get(withDot) ?? inner.get(without) ?? inner.get(title.trim());
}

function fallbackRow(phase: string, title: string): Row {
  const meta = META[phaseKey(phase)];
  const folder = meta?.folder ?? "docs";
  const slug = bare(title)
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48)
    .toUpperCase();
  return {
    title,
    doThis: `Write the Phase pack note for “${bare(title)}” in ${folder}/. ${PRODUCT_FREEZE} ${PIVOT_SENTENCE} Do not invent interviews, ARR, holdout-as-CS, or live customer data.`,
    inn: `${folder}/ELAH_${slug || "NOTE"}.md`,
    file: `${folder}/ELAH_${slug || "NOTE"}.md`,
  };
}

/** Build full-template copy for a PHASE_SPECS title. Returns null for Phase 7/16 (other seeds). */
export function thinCopyFor(phase: string, title: string): ThinCopy | null {
  if (phase.startsWith("Phase 7") || phase.startsWith("Phase 16")) return null;
  const row = lookupRow(phase, title) ?? fallbackRow(phase, title);
  return materialize(phase, row);
}

export function assertPhaseSpecCoverage(): { phase: string; missing: string[] }[] {
  const report: { phase: string; missing: string[] }[] = [];
  for (const spec of PHASE_SPECS) {
    if (spec.phase.startsWith("Phase 7") || spec.phase.startsWith("Phase 16")) continue;
    const missing: string[] = [];
    for (const title of spec.tasks) {
      if (!lookupRow(spec.phase, title)) missing.push(title);
    }
    if (missing.length) report.push({ phase: spec.phase, missing });
  }
  return report;
}
