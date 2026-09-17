/**
 * Phase 7 — Explainability and intention graph.
 * First analyst is CS/CRM ops (Phase 16 wedge). Banking graph remains the existing demo.
 * Axes frozen: Human Agency / Financial Risk / Emotional Urgency.
 * Docs live in `docs/Phase 7 - Explainability and intention graph/` (folder name exact).
 * ELAH scores genuine intent before tools; company policy allow/deny/confirm;
 * ELAH never allows, blocks, or executes.
 */
import type { TaskPriority, TaskStatus, Workstream } from "../types";
import { PRODUCT_FREEZE, PIVOT_SENTENCE, card } from "./card";

export const PHASE7_NAME = "Phase 7 — Explainability and intention graph";

export const PHASE7_DOC_DIR = "docs/Phase 7 - Explainability and intention graph";

export const PHASE7_MILESTONE = {
  order: 8,
  title: "Intention graph and explanations operational",
  exitCriteria:
    "CS/CRM ops analysts (first) and banking-demo analysts can inspect HA/FR/EU coordinates and evidence per event. Customer UI never shows elahScore. No chain-of-thought. ELAH never allows, blocks, or executes.",
  targetMonthsFromNow: 6,
} as const;

export interface Phase07TaskSpec {
  /** Existing Neon id — title changes must keep this id. */
  id: string;
  title: string;
  workstream: Workstream;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;
  isCriticalPath: boolean;
  progressPercentage: number;
  estimatedEffort: string;
  description: string;
  successCriteria: string;
  deliverables: string;
  notes: string;
  links: string[];
  /** When true, seed overwrites live status + progress from this spec (evidence-based). */
  syncStatus?: boolean;
}

const ACTION_EVIDENCE =
  "17 Sep 2026 research overlay: normalized action says what happened; the existing 16-label intent says why it appears aligned/misaligned. Action class/impact are evidence only, never a fourth axis or policy.";

const FREEZE_BODY = `${PRODUCT_FREEZE} ${PIVOT_SENTENCE} Coordinates explain; they are not an allow/deny. Origin is not “safe.” ${ACTION_EVIDENCE}`;

const OUT_GRAPH =
  "A fourth axis; putting elahScore on the envelope or on the customer/support UI; ELAH allow/block/execute; chain-of-thought or private model reasoning; live customer tickets; prisma db push onto the wrong DB; quoting banking holdout as CS/CRM accuracy.";

function spec(
  partial: Omit<Phase07TaskSpec, "workstream" | "category" | "description"> & {
    body: string;
    today: string;
    doThis: string;
    inn: string;
    out?: string;
  },
): Phase07TaskSpec {
  const { body, today, doThis, inn, out, ...rest } = partial;
  return {
    workstream: "Model",
    category: "Explainability",
    description: card(body, today, doThis, inn, out ?? OUT_GRAPH),
    ...rest,
  };
}

export const PHASE07_TASKS: Phase07TaskSpec[] = [
  spec({
    id: "task-7-finalize-the-dimensions-of-the-intention-graph",
    title: "Finalize the dimensions of the intention graph.",
    status: "done",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 100,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `CS/CRM ops analysts (first reader) and banking-demo analysts share one intention graph: a right-handed unit cube with exactly three frozen axes — Human Agency, Financial Risk, Emotional Urgency. ${FREEZE_BODY} Done looks like the Phase 7 dimensions memo restating the freeze and pointing at the live 3D matrix without adding a fourth numeric axis.`,
    today: "Founder approved ELAH_GRAPH_DIMENSIONS.md on 17 Sep 2026. Axes are rendered on /banking/intent-matrix (banking demo) and /banking/crm (CS/CRM first).",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_GRAPH_DIMENSIONS.md: three axes only; unit cube [0,1]³; CS/CRM ops analyst as first reader; banking demo as later vertical. Cite Phase 0 coordinate spec. Do not rename axes.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_DIMENSIONS.md (Approved — Founder, 17 Sep 2026).`,
    successCriteria:
      "- Axes remain Human Agency, Financial Risk, Emotional Urgency.\n- No fourth axis.\n- CS/CRM ops analyst named as first reader; banking graph stays the existing demo.\n- Founder approval recorded 17 Sep 2026.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_DIMENSIONS.md`,
    notes:
      "Done: Phase 7 dimensions design approved by founder 17 Sep 2026. This does not mark graph engineering or analyst testing Done.",
    links: [
      "docs/Phase 0 - Product Definition/ELAH_COORDINATE_SYSTEM.md",
      "app/banking/intent-matrix/page.tsx",
      PHASE7_DOC_DIR,
    ],
  }),
  spec({
    id: "task-7-define-the-meaning-of-each-axis",
    title: "Define the meaning of each axis.",
    status: "done",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 100,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `Write pole meanings a CS/CRM ops analyst can use without ML jargon: Human Agency (chosen act vs steered/empty), Financial Risk (harm if the tool ran — refund, CRM overwrite, PII export — not “this person is a fraudster”), Emotional Urgency (pressure in the request, not SLA). ${FREEZE_BODY} Banking demo keeps the same names so one graph language spans verticals.`,
    today: "Founder approved ELAH_GRAPH_AXES.md on 17 Sep 2026. Intent-matrix explainers restate X/Y/Z for banking and CS/CRM.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_GRAPH_AXES.md with low/high poles, one CS/CRM example and one banking-demo example per axis. Genuine high-Y refund/transfer is allowed. Do not equate high Financial Risk with block.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_AXES.md.`,
    successCriteria:
      "- Each axis has a one-line definition and low/high poles.\n- Financial Risk is harm-if-executed, not identity-as-fraud.\n- CS/CRM examples use tickets/refunds/CRM writes, not only wires.\n- Freeze restated.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_AXES.md`,
    notes: "Done: Phase 7 axis meanings approved by founder 17 Sep 2026.",
    links: [
      "docs/Phase 0 - Product Definition/ELAH_COORDINATE_SYSTEM.md",
      "components/intent-matrix-explainer.tsx",
    ],
  }),
  spec({
    id: "task-7-define-coordinate-calculation",
    title: "Define coordinate calculation.",
    status: "done",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 100,
    estimatedEffort: "3d",
    syncStatus: true,
    body: `Document how a scored event becomes a point: live matrix x→humanAgency, y→financialRisk, z→emotionalUrgency; clamp to [0,1]; display jitter must not be persisted. ${FREEZE_BODY} Calculation explains position; it does not move policy.`,
    today: "Founder approved ELAH_COORDINATE_CALCULATION.md and the matching display-only CS/CRM atlas on 17 Sep 2026. Display jitter remains non-persistent under Phase 0 G7.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_COORDINATE_CALCULATION.md: API mapping, clamp, atlas fallback, “H/B/S vectors stay internal”, CS/CRM scorer must emit the same three fields. Do not persist ring-spread.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_COORDINATE_CALCULATION.md.`,
    successCriteria:
      "- Mapping table x/y/z → HA/FR/EU is explicit.\n- Clamp and non-persistent jitter stated.\n- Internal 5-vectors stay off ScoreResponse.\n- CS/CRM path uses the same three fields.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_COORDINATE_CALCULATION.md; lib/elah/cs-crm-coordinates.ts tool→action fallback and metadata parser.`,
    notes: "Done: coordinate design approved 17 Sep 2026. Additive action mapping is research-derived; refund stays unmapped and human mapping review remains open.",
    links: [
      "lib/intent-matrix-points.ts",
      "docs/Phase 0 - Product Definition/ELAH_COORDINATE_SYSTEM.md",
    ],
  }),
  spec({
    id: "task-7-define-how-action-sequences-appear-on-the-graph",
    title: "Define how action sequences appear on the graph.",
    status: "done",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `Specify how a ticket→refund→CRM-write (or banking transfer chain) appears as an ordered path, not a bag of dots. CS/CRM ops analysts need sequence, not only the last point. ${FREEZE_BODY} Sequence overlay must not imply ELAH executed the tools.`,
    today: "Founder approved ELAH_GRAPH_SEQUENCES.md on 17 Sep 2026. CRM graph groups recent points by conversationId; no trajectory is persisted as a score field.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md: join key (session/conversation), line vs numbered points, what to hide on the customer UI. Implement later; this card is the spec.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md (Approved — Founder, 17 Sep 2026).`,
    successCriteria:
      "- Join key named (session or conversation id).\n- Sequence is visual, not a new score field.\n- Customer UI still has no elahScore.\n- Founder approval recorded 17 Sep 2026.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md`,
    notes: "Done: sequence design approved by founder 17 Sep 2026. Engineering remains tracked by the trajectory display card.",
    links: ["components/charts/intent-matrix-3d.tsx", "lib/elah"],
  }),
  spec({
    id: "task-7-define-how-confidence-appears-visually",
    title: "Define how confidence appears visually.",
    status: "done",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `Specify the analyst glyph for confidence (opacity, ring, or badge) so a CS/CRM ops analyst can see “usable vs abstain” without reading model internals. ${FREEZE_BODY} Confidence is not a fourth axis and not a block.`,
    today: "Phase 0 ELAH_CONFIDENCE_SEMANTICS.md and ScoreResponse.confidence exist. CS/CRM cube on /banking/crm maps confidence to opacity. Spec: ELAH_GRAPH_VISUAL_OVERLAYS.md.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md: glyph for scored / abstain / scoring_unavailable. Fail-open stays fail-open. Do not encode confidence as Financial Risk.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md (Approved — Founder, 17 Sep 2026).`,
    successCriteria:
      "- Visual is an overlay, not a fourth coordinate.\n- Abstain ≠ origin.\n- scoring_unavailable has a distinct glyph.\n- No customer-facing confidence.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md`,
    notes: "Done: confidence overlay design approved by founder 17 Sep 2026; CS/CRM cube maps confidence to opacity.",
    links: [
      "docs/Phase 0 - Product Definition/ELAH_CONFIDENCE_SEMANTICS.md",
      "components/charts/intent-matrix-3d.tsx",
    ],
  }),
  spec({
    id: "task-7-define-how-uncertainty-appears-visually",
    title: "Define how uncertainty appears visually.",
    status: "done",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "1d",
    syncStatus: true,
    body: `Uncertainty (wide posterior, missing context) must look different from low Human Agency. CS/CRM ops analysts should not treat “we do not know” as “hostile.” ${FREEZE_BODY}`,
    today: "Founder approved the uncertainty/abstain glyph in ELAH_GRAPH_VISUAL_OVERLAYS.md on 17 Sep 2026. No analyst study has been run.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md paired with the confidence memo. Dashed outline or hatch — not a new axis. Do not dump chain-of-thought to explain uncertainty.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md (Approved — Founder, 17 Sep 2026).`,
    successCriteria:
      "- Uncertainty overlay distinct from agency and risk.\n- No CoT in the tooltip.\n- Fail-open / scoring_unavailable covered.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md`,
    notes: "Done: uncertainty visual design approved by founder 17 Sep 2026. Analyst validation remains open.",
    links: ["docs/Phase 0 - Product Definition/ELAH_CONFIDENCE_SEMANTICS.md"],
  }),
  spec({
    id: "task-7-define-how-risk-appears-visually",
    title: "Define how risk appears visually.",
    status: "done",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "1d",
    syncStatus: true,
    body: `Financial Risk is already the Y axis. Color may encode a discrete riskLevel for glanceability, but color must not become a silent policy (red ≠ ELAH blocked). ${FREEZE_BODY} First reader is a CS/CRM ops analyst looking at refunds and CRM writes.`,
    today: "components/charts/intent-matrix-3d.tsx colors points by riskLevel (low/medium/high/critical). Explainer legend exists. Phase 7 memo should warn that color is not allow/deny.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md: Y axis = Financial Risk; color = optional discrete band; never “ELAH blocked.” Keep customer UI score-free.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md (Approved — Founder, 17 Sep 2026).`,
    successCriteria:
      "- Color legend does not say allow/block.\n- Y axis remains Financial Risk.\n- CS/CRM examples included.\n- Freeze restated.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md`,
    notes: "Done: risk visual design approved by founder 17 Sep 2026; implementation remains tracked separately.",
    links: [
      "lib/intent-matrix-points.ts",
      "components/charts/intent-matrix-3d.tsx",
    ],
  }),
  spec({
    id: "task-7-create-a-three-layer-intention-visualization",
    title: "Create a three-layer intention visualization.",
    status: "in_progress",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 50,
    estimatedEffort: "8d",
    syncStatus: true,
    body: `Ship (and document) three analyst layers: (1) points in the HA/FR/EU cube, (2) sequences/relations, (3) evidence/reason codes. CS/CRM ops analysts are the first audience; the banking /banking/intent-matrix page is the existing demo. ${FREEZE_BODY} Layer 1 exists; layers 2–3 are incomplete.`,
    today: "/banking/intent-matrix has 3D cube + 2D projection + explainer (“three layers behind each point” copy). Trajectories, request-action links, and ScoreResponse evidence on the graph are not a complete three-layer product. No CS/CRM graph page yet.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md naming the three layers and what is live vs gap. Keep implementing on founder analytics; do not show scores on ELAH CRM Simulation customer chat.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md plus the live /banking/intent-matrix shell.`,
    successCriteria:
      "- Three layers named in the memo.\n- Live 3D cube cited as layer 1 evidence.\n- Gaps (sequences, evidence panel on graph) listed honestly.\n- Customer UI has no elahScore.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md`,
    notes: "In progress because the 3D matrix exists. Not Done — sequences/evidence layers incomplete.",
    links: [
      "app/banking/intent-matrix/page.tsx",
      "components/intent-matrix-explainer.tsx",
    ],
  }),
  spec({
    id: "task-7-display-individual-action-points",
    title: "Display individual action points.",
    status: "in_progress",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 50,
    estimatedEffort: "3d",
    syncStatus: true,
    body: `Each scored tool call is one point in the cube. Same-intent stacks use display-only ring-spread. ${FREEZE_BODY} Points are analyst-only.`,
    today: "Point cloud is live on /banking/intent-matrix via IntentMatrixPoint + spreadIntentPoints. Banking simulator / CRM command logs can feed analytics; this is not live customer data. Click-select exists on the 3D cloud.",
    doThis: `Document the point contract in ${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md (fields, cap, jitter). Wire CS/CRM simulator points later without merging CRM rows into banking Neon.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md.`,
    successCriteria:
      "- One point per scored action.\n- Jitter not persisted.\n- No elahScore on customer UI.\n- No CRM rows copied into banking Neon.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md; normalized action evidence on founder IntentMatrixPoint rows where available.`,
    notes: "In progress: founder point clouds exist; action evidence resolves from sanitized metadata or reviewed fallback. Human validation remains open.",
    links: ["lib/intent-matrix-points.ts", "components/charts/intent-matrix-3d.tsx"],
  }),
  spec({
    id: "task-7-display-action-trajectories",
    title: "Display action trajectories.",
    status: "in_review",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 10,
    estimatedEffort: "4d",
    syncStatus: true,
    body: `Draw ordered paths for a session so a CS/CRM ops analyst sees escalation (ticket → refund → export) vs a single genuine refund. ${FREEZE_BODY} Trajectories are explanation, not enforcement.`,
    today: "3D helper draws axis lines only. No session polyline on the matrix. Sequence spec is a sibling card.",
    doThis: `Spec + later implementation note in ${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md. Do not invent a trajectory screenshot from production tickets.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md.`,
    successCriteria:
      "- Session join key defined.\n- Path is optional overlay.\n- No live customer sessions.\n- Freeze restated.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md`,
    notes: "Not built. Spec / in_review.",
    links: ["components/charts/intent-matrix-3d.tsx"],
  }),
  spec({
    id: "task-7-display-user-request-to-agent-action-relationshi",
    title: "Display user-request-to-agent-action relationships.",
    status: "in_review",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 15,
    estimatedEffort: "4d",
    syncStatus: true,
    body: `Show the link from the human utterance (ticket text, chat, banking prompt) to the tool the assistant planned. CS/CRM ops analysts need to see injection-in-ticket vs genuine refund request. ${FREEZE_BODY} The link is evidence, not a policy decision.`,
    today: "Phase 2 capture correlates request → tool in AgentEventLog / ElahEvent. CS/CRM cube on /banking/crm draws conversation trajectories and shows tool + utterance on the selected-point panel. Spec: ELAH_GRAPH_SEQUENCES.md.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md: which fields to draw, how to hide PII, independent twins if UI and agent both exist.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md.`,
    successCriteria:
      "- Utterance→tool link specified.\n- PII redaction called out.\n- Independent twins mentioned.\n- No CoT dump.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md`,
    notes: "Capture exists off-graph. Graph overlay is spec-only.",
    links: [
      "docs/Phase 2 - Agent observability and event collection/ELAH_AGENT_CAPTURE.md",
    ],
  }),
  spec({
    id: "task-7-display-deviations-from-expected-behavior",
    title: "Display deviations from expected behavior.",
    status: "in_review",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 10,
    estimatedEffort: "3d",
    syncStatus: true,
    body: `Define “expected” as the taxonomy atlas / genuine-intent region, then mark deviations (injection, over-eager CRM overwrite, mistaken user) without calling ELAH a blocker. ${FREEZE_BODY} First reader: CS/CRM ops analyst.`,
    today: "No deviation overlay on the matrix. Gold labels and reason codes exist on banking eval; CS/CRM taxonomy is Proposed in Phase 16. Do not invent a deviation rate.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md: expected region, overlay rule, and that policy (not ELAH) decides allow/deny/confirm.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md.`,
    successCriteria:
      "- Expected region defined without new axes.\n- Deviation ≠ ELAH block.\n- No fake rates.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md`,
    notes: "Spec. No measured deviation metric to quote.",
    links: ["docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_TAXONOMY.md"],
  }),
  spec({
    id: "task-7-display-model-evidence",
    title: "Display model evidence.",
    status: "in_review",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 20,
    estimatedEffort: "3d",
    syncStatus: true,
    body: `Surface ScoreResponse explanation.matchedSignals / weakSignals / negativeSignals on the analyst graph or side panel. CS/CRM ops analysts should see evidence tokens, not embeddings or chain-of-thought. ${FREEZE_BODY}`,
    today: "rules_v0 explanations exist on banking /admin/elah-events/[eventId]. CRM stores ElahScoreSnapshot. The 3D matrix does not show those signal lists. Live scorer is still rules_v0; catboost_v0 is offline.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md mapping explanation fields to the panel. Reuse Phase 0 explainability. No CoT. No customer-visible evidence.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Evidence fields named from ScoreResponse 1.0.\n- No CoT / hidden activations.\n- Provenance (rules vs model) visible to analysts.\n- Customer UI excluded.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md; components/cs-crm-explanation-panel.tsx action-evidence block.`,
    notes: "In review: founder CRM selected-point panel separates action, intent assessment, and company policy. Signal-list coverage and human validation remain incomplete.",
    links: [
      "docs/Phase 0 - Product Definition/ELAH_EXPLAINABILITY.md",
      "docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_DASHBOARD.md",
    ],
  }),
  spec({
    id: "task-7-display-contributing-factors",
    title: "Display contributing factors.",
    status: "in_review",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 15,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `Contributing factors are the closed reason-code / feature tokens that moved the point or the score — readable by a CS/CRM ops analyst. ${FREEZE_BODY} Not SHAP dumps. Not CoT.`,
    today: "Phase 5 RC_* reason codes on policyHook.reasons. Feature families in ELAH_BASELINE_FEATURES.md. Not shown as a graph overlay.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md: which tokens appear, max count, forbid raw weights and chain-of-thought.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Factor list is closed-token, not free text from the model.\n- No CoT.\n- Analyst-only.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md`,
    notes: "Spec. Reason codes exist in Phase 5; graph display does not.",
    links: ["docs/Phase 5 - Baseline scoring system/ELAH_REASON_CODES.md"],
  }),
  spec({
    id: "task-7-display-reason-codes",
    title: "Display reason codes.",
    status: "in_review",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 25,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `Show RC_* (and CS/CRM equivalents once taxonomy is Approved) on the explanation panel. Codes are hints for analysts, never ELAH allow/deny. ${FREEZE_BODY}`,
    today: "Banking admin score card shows reason codes. Phase 5 catalog ELAH_REASON_CODES.md. Intent-matrix does not list RC_* on the selected point. CS/CRM closed labels are Proposed, not a 23rd banking label.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md pointing at the Phase 5 catalog and the Phase 16 CS/CRM taxonomy. Do not add allow/deny as a reason code.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Codes displayed to analysts only.\n- No allow/block/execute codes as ELAH actions.\n- CS/CRM codes not mixed into banking 22-label freeze.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md`,
    notes: "In review: codes exist off-graph. Graph chip still due.",
    links: [
      "docs/Phase 5 - Baseline scoring system/ELAH_REASON_CODES.md",
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_TAXONOMY.md",
    ],
  }),
  spec({
    id: "task-7-display-alternative-interpretations",
    title: "Display alternative interpretations.",
    status: "in_review",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 10,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `When confidence is not high, show the next-best closed labels (e.g. genuine refund vs refund abuse vs injection) so a CS/CRM ops analyst can disagree. ${FREEZE_BODY} Alternatives are labels from the closed set, not a story.`,
    today: "ScoreResponse 1.0 does not require a ranked alternative list. Do not invent one on the card. No analyst study.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md as Proposed: optional top-k closed labels, never free-text CoT. Do not change ScoreResponse without a Phase 0 contract bump.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md (Proposed).`,
    successCriteria:
      "- Alternatives stay in the closed label set.\n- Optional until output-contract change is Approved.\n- No CoT stories.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md`,
    notes: "Spec / Proposed. Do not ship a new ScoreResponse field without Phase 0.",
    links: ["docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md"],
  }),
  spec({
    id: "task-7-add-an-event-explanation-panel",
    title: "Add an event explanation panel.",
    status: "in_progress",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 40,
    estimatedEffort: "5d",
    syncStatus: true,
    body: `A side panel (graph click or event row) that a CS/CRM ops analyst can read in one screen: intent label, score band, coordinates, evidence, reason codes, provenance, tenant policy decision from the event — not from ELAH. ${FREEZE_BODY}`,
    today: "Banking /admin/elah-events/[eventId] score card is the closest panel. Intent-matrix has an explainer but not a per-event ScoreResponse panel. CRM analyst events exist in ELAH CRM Simulation; founder /banking/crm reads CRM logs without merging DBs.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md (fields + non-goals) and keep implementing against simulator events only.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Panel fields listed and mapped to ScoreResponse 1.0 + event policy decision.\n- Customer/support user UI excluded.\n- No CoT.\n- No live customer tickets.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md; components/cs-crm-explanation-panel.tsx; lib/crm/queries.ts action mapping.`,
    notes: "In progress: founder CRM graph-linked panel shows normalized action evidence separately from intent and company policy. Production click-test and analyst validation remain open.",
    links: [
      "docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_DASHBOARD.md",
      "app/banking/intent-matrix/page.tsx",
    ],
  }),
  spec({
    id: "task-7-add-model-version-information",
    title: "Add model-version information.",
    status: "in_review",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 20,
    estimatedEffort: "1d",
    syncStatus: true,
    body: `Analysts must see which scorer produced the point (rules_v0, cs_crm_rules_v0, later catboost_v0) and that live banking POST /v1/score is still rules_v0. ${FREEZE_BODY} Version is provenance, not a quality claim.`,
    today: "Score snapshots store modelVersion/provenance. Offline catboost_v0 is not live. CRM simulator uses cs_crm_rules_v0. Intent-matrix explainer does not always show version on the selected point.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md: chip copy, uncalibrated badge, never quote holdout as CS/CRM accuracy.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Provenance visible on the analyst panel.\n- Live vs offline models not conflated.\n- No fake CS metrics.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md`,
    notes: "Partial in snapshots. Graph chip still due.",
    links: [
      "docs/Phase 6 - ELAH model development/ELAH_MODEL_VERSIONING.md",
      "docs/Phase 3 - ELAH service foundation/ELAH_MOCK_SCORER.md",
    ],
  }),
  spec({
    id: "task-7-add-raw-event-inspection-for-authorized-users",
    title: "Add raw-event inspection for authorized users.",
    status: "in_progress",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 45,
    estimatedEffort: "3d",
    syncStatus: true,
    body: `Security reviewer / CS/CRM ops lead (authorized) can inspect the normalized envelope and score snapshot. Support agents and customers cannot. ${FREEZE_BODY} Raw inspect is role-gated.`,
    today: "Banking /admin/elah-events detail is role-gated to security.admin. Founder CRM log pages read CRM SQLite/Neon, not banking Neon. No live Zendesk bodies.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md: roles, redaction, and “scores never on customer UI.” Point at existing admin/CRM log pages as evidence, not as production tenant SSO.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Authorized roles listed.\n- Customer/support-user excluded.\n- No live customer data.\n- Envelope still has no score fields.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md`,
    notes: "In progress: admin event detail + CRM logs. Not a production IAM design.",
    links: [
      "docs/Phase 2 - Agent observability and event collection/ELAH_EVENT_VIEWER.md",
      "app/banking/crm/logs/page.tsx",
    ],
  }),
  spec({
    id: "task-7-test-whether-explanations-are-understandable-to-",
    title: "Test whether explanations are understandable to CS/CRM ops analysts.",
    status: "in_review",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 10,
    estimatedEffort: "5d",
    syncStatus: true,
    body: `Usability check for CS/CRM ops analysts (Head of Support, CRM ops, QA lead) — not a bank-CISO study with nouns swapped. Can they read HA/FR/EU, evidence tokens, and the policy-vs-ELAH split without ML jargon? ${FREEZE_BODY} Title used to say “banking analysts”; first reader is now CS/CRM. Banking-demo analysts remain a later vertical.`,
    today: "No interviews logged. Phase 16 interview script exists (ELAH_CS_CRM_INTERVIEW_SCRIPT.md) but is discovery, not a completed understandability test. Agents do not email anyone. Do not invent quotes.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md: protocol, tasks on the CRM simulator demo, note-taking template. Do not run outreach from this card. Do not mark Done without real notes.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md (protocol). Later: dated notes.`,
    successCriteria:
      "- Protocol names CS/CRM ops roles, not bank CISO as the only audience.\n- No fabricated interviews.\n- Banking-analyst study, if any, is labeled later-vertical.\n- Freeze spoken in the protocol.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md`,
    notes:
      "Id kept as task-7-test-whether-explanations-are-understandable-to- after the CS/CRM title rewrite. No interviews on file.",
    links: [
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_INTERVIEW_SCRIPT.md",
      PHASE7_DOC_DIR,
    ],
  }),
  spec({
    id: "task-7-test-whether-explanations-remain-faithful-to-mod",
    title: "Test whether explanations remain faithful to model behavior.",
    status: "in_review",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 10,
    estimatedEffort: "5d",
    syncStatus: true,
    body: `Faithfulness: evidence tokens must be reconstructable from the scorer that actually ran (rules_v0 or cs_crm_rules_v0 today; catboost_v0 only if wired). ${FREEZE_BODY} Do not test a model that is not on the path.`,
    today: "No faithfulness study. Live path is rules_v0 (banking) and cs_crm_rules_v0 (CRM simulator). catboost_v0 is offline. Do not quote holdout accuracy as explanation faithfulness.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md: method (signal replay vs label), split, and that CoT is out of scope. Run later on simulator/gold only.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md.`,
    successCriteria:
      "- Method named; live scorer named.\n- Offline model not treated as live.\n- No CoT as a faithfulness target.\n- No live customer events.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md; tests/cs-crm-coordinates.test.ts action mapping checks.`,
    notes: "Protocol plus focused mapping tests only. No analyst session, IAA, customer validation, or model-accuracy evidence; not Done.",
    links: [
      "docs/Phase 6 - ELAH model development/ELAH_MODEL_CARD.md",
      "docs/Phase 5 - Baseline scoring system/ELAH_RULES_BASELINE.md",
    ],
  }),
  spec({
    id: "task-7-avoid-exposing-private-model-reasoning-or-unsupp",
    title: "Avoid exposing private model reasoning or unsupported chain-of-thought.",
    status: "in_review",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 25,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `Forbidden on every analyst and customer surface: hidden activations, token-level CoT, “the model thought…”, system-prompt dumps. ${FREEZE_BODY} Phase 0 explainability already bans CoT; Phase 7 restates it for the graph and CS/CRM panel.`,
    today: "ELAH_EXPLAINABILITY.md §1 and output contract forbid CoT. rules_v0 summaries are template sentences from signal lists. No red-team proof that the CRM UI cannot leak CoT — do not claim one.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md as the Phase 7 restatement: allowed fields, forbidden fields, test that customer chat never returns reasoning.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md.`,
    successCriteria:
      "- CoT and private reasoning listed as OUT.\n- Allowed explanation fields listed.\n- Customer UI explicitly excluded.\n- Status Proposed until founder Approve.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md`,
    notes: "Policy exists in Phase 0. Phase 7 pack restatement still due. Not Done.",
    links: [
      "docs/Phase 0 - Product Definition/ELAH_EXPLAINABILITY.md",
      "docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md",
    ],
  }),
  spec({
    id: "task-7-use-concise-evidence-based-explanations-instead",
    title: "Use concise evidence-based explanations instead.",
    status: "in_progress",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 40,
    estimatedEffort: "3d",
    syncStatus: true,
    body: `Explanations are short, reproducible sentences from matched/weak/negative signals (≤240 chars if a summary exists). CS/CRM ops analysts should read tokens they could verify on the event. ${FREEZE_BODY} Style is evidence, not narrative.`,
    today: "rules_v0 and Phase 0 explainability already require summary reproducibility from signal lists. Admin score card shows them on the banking demo. Phase 7 style guide for the graph/CS panel is not in the Phase 7 folder yet.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md: length cap, no names/account numbers, CS/CRM examples (refund, macro, PII export) plus banking-demo encore. Do not generate CoT to sound smarter.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md.`,
    successCriteria:
      "- Summary length and reproducibility stated.\n- PII forbidden in summaries.\n- Examples for CS/CRM tools included.\n- No CoT.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md`,
    notes: "In progress: live rules_v0 explanations. Phase 7 style memo still due.",
    links: [
      "docs/Phase 0 - Product Definition/ELAH_EXPLAINABILITY.md",
      "docs/Phase 5 - Baseline scoring system/ELAH_RULES_BASELINE.md",
    ],
  }),
];

export function phase07TaskId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `task-7-${slug}`.slice(0, 64);
}
