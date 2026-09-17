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
    doThis: `Maintain ${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md: join key (session/conversation), line vs numbered points, and what stays hidden on the customer UI.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md (Approved — Founder, 17 Sep 2026).`,
    successCriteria:
      "- Join key named (session or conversation id).\n- Sequence is visual, not a new score field.\n- Customer UI still has no elahScore.\n- Founder approval recorded 17 Sep 2026.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md`,
    notes: "Done: sequence design approved by founder 17 Sep 2026; trajectory engineering is also implemented on its separate card.",
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
    notes: "Done: risk visual design approved by founder 17 Sep 2026; the separate point implementation is complete.",
    links: [
      "lib/intent-matrix-points.ts",
      "components/charts/intent-matrix-3d.tsx",
    ],
  }),
  spec({
    id: "task-7-create-a-three-layer-intention-visualization",
    title: "Create a three-layer intention visualization.",
    status: "done",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 100,
    estimatedEffort: "8d",
    syncStatus: true,
    body: `Ship (and document) three analyst layers: (1) points in the HA/FR/EU cube, (2) sequences/relations, (3) evidence/reason codes. CS/CRM ops analysts are the first audience; the banking /banking/intent-matrix page is the existing demo. ${FREEZE_BODY}`,
    today: "DONE: founder /banking/crm renders points, optional conversation trajectories, and a graph-linked evidence panel. The customer chat does not expose ELAH scores.",
    doThis: `Maintain the three-layer contract in ${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md and regression-test the founder implementation.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md plus the live /banking/intent-matrix shell.`,
    successCriteria:
      "- Three layers named in the memo.\n- Point, trajectory, and evidence layers implemented on the founder CS/CRM graph.\n- Production build passes.\n- Customer UI has no elahScore.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md; components/cs-crm-intent-matrix-view.tsx; components/cs-crm-explanation-panel.tsx`,
    notes: "Done: all three analyst layers are implemented on founder /banking/crm and the production build passes.",
    links: [
      "app/banking/crm/page.tsx",
      "components/cs-crm-intent-matrix-view.tsx",
      "components/cs-crm-explanation-panel.tsx",
    ],
  }),
  spec({
    id: "task-7-display-individual-action-points",
    title: "Display individual action points.",
    status: "done",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 100,
    estimatedEffort: "3d",
    syncStatus: true,
    body: `Each scored tool call is one point in the cube. Same-intent stacks use display-only ring-spread. ${FREEZE_BODY} Points are analyst-only.`,
    today: "Point cloud is live on /banking/intent-matrix via IntentMatrixPoint + spreadIntentPoints. Banking simulator / CRM command logs can feed analytics; this is not live customer data. Click-select exists on the 3D cloud.",
    doThis: `Maintain the point contract in ${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md (fields, cap, jitter) and keep CRM reads isolated from banking Neon.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md.`,
    successCriteria:
      "- One point per scored action.\n- Jitter not persisted.\n- No elahScore on customer UI.\n- No CRM rows copied into banking Neon.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_VISUAL_OVERLAYS.md; normalized action evidence on founder IntentMatrixPoint rows where available.`,
    notes: "Done: individual CS/CRM snapshot points are live, selectable, ring-spread, capped, and backed by the separate CRM reader.",
    links: ["lib/intent-matrix-points.ts", "components/charts/intent-matrix-3d.tsx"],
  }),
  spec({
    id: "task-7-display-action-trajectories",
    title: "Display action trajectories.",
    status: "done",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "4d",
    syncStatus: true,
    body: `Draw ordered paths for a session so a CS/CRM ops analyst sees escalation (ticket → refund → export) vs a single genuine refund. ${FREEZE_BODY} Trajectories are explanation, not enforcement.`,
    today: "DONE: buildTrajectories orders points by conversationId and timestamp, caps the latest 20 eligible conversations, and the CS/CRM 3D view renders optional polylines.",
    doThis: `Maintain the implementation contract in ${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md. Do not invent a trajectory screenshot from production tickets.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md.`,
    successCriteria:
      "- Session join key defined.\n- Path is optional overlay.\n- No live customer sessions.\n- Freeze restated.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md; lib/intent-matrix-points.ts; components/charts/intent-matrix-3d.tsx`,
    notes: "Done: conversation trajectories are implemented and enabled on the founder CS/CRM cube.",
    links: ["components/charts/intent-matrix-3d.tsx"],
  }),
  spec({
    id: "task-7-display-user-request-to-agent-action-relationshi",
    title: "Display user-request-to-agent-action relationships.",
    status: "done",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "4d",
    syncStatus: true,
    body: `Show the link from the human utterance (ticket text, chat, banking prompt) to the tool the assistant planned. CS/CRM ops analysts need to see injection-in-ticket vs genuine refund request. ${FREEZE_BODY} The link is evidence, not a policy decision.`,
    today: "Phase 2 capture correlates request → tool in AgentEventLog / ElahEvent. CS/CRM cube on /banking/crm draws conversation trajectories and shows tool + utterance on the selected-point panel. Spec: ELAH_GRAPH_SEQUENCES.md.",
    doThis: `Maintain ${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md and the selected-point request/tool evidence contract.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md.`,
    successCriteria:
      "- Utterance→tool link specified.\n- PII redaction called out.\n- Independent twins mentioned.\n- No CoT dump.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md; components/cs-crm-explanation-panel.tsx`,
    notes: "Done: selecting a point shows the sanitized utterance snippet beside platform tool and normalized action evidence; trajectories retain conversation context.",
    links: [
      "docs/Phase 2 - Agent observability and event collection/ELAH_AGENT_CAPTURE.md",
      "components/cs-crm-explanation-panel.tsx",
    ],
  }),
  spec({
    id: "task-7-display-deviations-from-expected-behavior",
    title: "Display deviations from expected behavior.",
    status: "done",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "3d",
    syncStatus: true,
    body: `Define “expected” as the taxonomy atlas / genuine-intent region, then mark deviations (injection, over-eager CRM overwrite, mistaken user) without calling ELAH a blocker. ${FREEZE_BODY} First reader: CS/CRM ops analyst.`,
    today: "DONE: injection, refund-abuse, exfiltration, and policy-denied points receive a deviation marker without inventing a deviation rate.",
    doThis: `Maintain ${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md and keep policy decisions separate from ELAH deviation evidence.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md.`,
    successCriteria:
      "- Expected region defined without new axes.\n- Deviation ≠ ELAH block.\n- No fake rates.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_GRAPH_SEQUENCES.md; lib/elah/cs-crm-coordinates.ts; components/charts/intent-matrix-3d.tsx`,
    notes: "Done: deviation highlighting is implemented; no unsupported rate or enforcement claim is shown.",
    links: ["docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_TAXONOMY.md"],
  }),
  spec({
    id: "task-7-display-model-evidence",
    title: "Display model evidence.",
    status: "in_progress",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 75,
    estimatedEffort: "3d",
    syncStatus: true,
    body: `Surface ScoreResponse explanation.matchedSignals / weakSignals / negativeSignals on the analyst graph or side panel. CS/CRM ops analysts should see evidence tokens, not embeddings or chain-of-thought. ${FREEZE_BODY}`,
    today: "rules_v0 explanations exist on banking /admin/elah-events/[eventId]. CRM stores ElahScoreSnapshot. The 3D matrix does not show those signal lists. Live scorer is still rules_v0; catboost_v0 is offline.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md mapping explanation fields to the panel. Reuse Phase 0 explainability. No CoT. No customer-visible evidence.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Evidence fields named from ScoreResponse 1.0.\n- No CoT / hidden activations.\n- Provenance (rules vs model) visible to analysts.\n- Customer UI excluded.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md; components/cs-crm-explanation-panel.tsx action-evidence block.`,
    notes: "In progress: score, confidence, reason codes, scorer, action provenance, and policy are visible. Matched/weak/negative signal-list coverage remains incomplete.",
    links: [
      "docs/Phase 0 - Product Definition/ELAH_EXPLAINABILITY.md",
      "docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_DASHBOARD.md",
    ],
  }),
  spec({
    id: "task-7-display-contributing-factors",
    title: "Display contributing factors.",
    status: "done",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `Contributing factors are the closed reason-code / feature tokens that moved the point or the score — readable by a CS/CRM ops analyst. ${FREEZE_BODY} Not SHAP dumps. Not CoT.`,
    today: "DONE: the selected-point panel displays closed reason-code tokens as contributing factors; it does not expose weights, embeddings, or chain-of-thought.",
    doThis: `Maintain ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md and the closed-token rendering contract.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Factor list is closed-token, not free text from the model.\n- No CoT.\n- Analyst-only.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md; components/cs-crm-explanation-panel.tsx`,
    notes: "Done: contributing reason-code factors are visible on the analyst-only selected-point panel.",
    links: [
      "docs/Phase 5 - Baseline scoring system/ELAH_REASON_CODES.md",
      "components/cs-crm-explanation-panel.tsx",
    ],
  }),
  spec({
    id: "task-7-display-reason-codes",
    title: "Display reason codes.",
    status: "done",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `Show RC_* (and CS/CRM equivalents once taxonomy is Approved) on the explanation panel. Codes are hints for analysts, never ELAH allow/deny. ${FREEZE_BODY}`,
    today: "DONE: founder /banking/crm displays snapshot reason codes as chips on the selected-point panel. Allow/deny remains company policy, not an ELAH reason code.",
    doThis: `Maintain ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md and do not add allow/deny as an ELAH reason code.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Codes displayed to analysts only.\n- No allow/block/execute codes as ELAH actions.\n- CS/CRM codes not mixed into banking 22-label freeze.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md; components/cs-crm-explanation-panel.tsx`,
    notes: "Done: reason-code chips are implemented on the CS/CRM graph-linked panel.",
    links: [
      "docs/Phase 5 - Baseline scoring system/ELAH_REASON_CODES.md",
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_TAXONOMY.md",
      "components/cs-crm-explanation-panel.tsx",
    ],
  }),
  spec({
    id: "task-7-display-alternative-interpretations",
    title: "Display alternative interpretations.",
    status: "in_progress",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 60,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `When confidence is not high, show the next-best closed labels (e.g. genuine refund vs refund abuse vs injection) so a CS/CRM ops analyst can disagree. ${FREEZE_BODY} Alternatives are labels from the closed set, not a story.`,
    today: "ScoreResponse 1.0 does not require a ranked alternative list. Do not invent one on the card. No analyst study.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md as Proposed: optional top-k closed labels, never free-text CoT. Do not change ScoreResponse without a Phase 0 contract bump.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md (Proposed).`,
    successCriteria:
      "- Alternatives stay in the closed label set.\n- Optional until output-contract change is Approved.\n- No CoT stories.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md; components/cs-crm-explanation-panel.tsx`,
    notes: "In progress: deterministic nearby interpretations are shown from reason-code cues. Closed-label top-k output still requires an approved ScoreResponse contract change.",
    links: ["docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md"],
  }),
  spec({
    id: "task-7-add-an-event-explanation-panel",
    title: "Add an event explanation panel.",
    status: "done",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 100,
    estimatedEffort: "5d",
    syncStatus: true,
    body: `A side panel (graph click or event row) that a CS/CRM ops analyst can read in one screen: intent label, score band, coordinates, evidence, reason codes, provenance, tenant policy decision from the event — not from ELAH. ${FREEZE_BODY}`,
    today: "DONE: clicking a CS/CRM point opens an analyst panel with intent assessment, score/confidence, coordinates, reason codes, scorer, action evidence, policy decision, and sanitized raw metadata.",
    doThis: `Maintain ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md and regression-test against simulator events only.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Panel fields listed and mapped to ScoreResponse 1.0 + event policy decision.\n- Customer/support user UI excluded.\n- No CoT.\n- No live customer tickets.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md; components/cs-crm-explanation-panel.tsx; lib/crm/queries.ts action mapping.`,
    notes: "Done: the graph-linked event explanation panel is implemented and passes the founder production build.",
    links: [
      "docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_DASHBOARD.md",
      "app/banking/intent-matrix/page.tsx",
    ],
  }),
  spec({
    id: "task-7-add-model-version-information",
    title: "Add model-version information.",
    status: "done",
    priority: "medium",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "1d",
    syncStatus: true,
    body: `Analysts must see which scorer produced the point (rules_v0, cs_crm_rules_v0, later catboost_v0) and that live banking POST /v1/score is still rules_v0. ${FREEZE_BODY} Version is provenance, not a quality claim.`,
    today: "DONE: the selected-point panel displays the snapshot scorer, defaulting only when legacy data omitted it. No offline model is presented as live.",
    doThis: `Maintain ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md: provenance copy must never turn holdout results into CS/CRM accuracy claims.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Provenance visible on the analyst panel.\n- Live vs offline models not conflated.\n- No fake CS metrics.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md; components/cs-crm-explanation-panel.tsx`,
    notes: "Done: scorer provenance is visible on the graph-linked analyst panel.",
    links: [
      "docs/Phase 6 - ELAH model development/ELAH_MODEL_VERSIONING.md",
      "docs/Phase 3 - ELAH service foundation/ELAH_MOCK_SCORER.md",
    ],
  }),
  spec({
    id: "task-7-add-raw-event-inspection-for-authorized-users",
    title: "Add raw-event inspection for authorized users.",
    status: "done",
    priority: "high",
    isCriticalPath: false,
    progressPercentage: 100,
    estimatedEffort: "3d",
    syncStatus: true,
    body: `Security reviewer / CS/CRM ops lead (authorized) can inspect the normalized envelope and score snapshot. Support agents and customers cannot. ${FREEZE_BODY} Raw inspect is role-gated.`,
    today: "Banking /admin/elah-events detail is role-gated to security.admin. Founder CRM log pages read CRM SQLite/Neon, not banking Neon. No live Zendesk bodies.",
    doThis: `Maintain ${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md: roles, redaction, and “scores never on customer UI.” Do not misrepresent founder authentication as production tenant SSO.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md.`,
    successCriteria:
      "- Authorized roles listed.\n- Customer/support-user excluded.\n- No live customer data.\n- Envelope still has no score fields.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_EXPLANATION_PANEL.md; middleware.ts; components/cs-crm-explanation-panel.tsx`,
    notes: "Done for the founder platform: authenticated founder/admin surfaces show sanitized raw metadata; customer/support-user UI remains excluded. Production tenant IAM is outside this card.",
    links: [
      "docs/Phase 2 - Agent observability and event collection/ELAH_EVENT_VIEWER.md",
      "app/banking/crm/logs/page.tsx",
    ],
  }),
  spec({
    id: "task-7-test-whether-explanations-are-understandable-to-",
    title: "Test whether explanations are understandable to CS/CRM ops analysts.",
    status: "backlog",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 20,
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
      "Backlog: protocol is approved and ready, but no analyst session has started. Id retained after the CS/CRM title rewrite.",
    links: [
      "docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CS_CRM_INTERVIEW_SCRIPT.md",
      PHASE7_DOC_DIR,
    ],
  }),
  spec({
    id: "task-7-test-whether-explanations-remain-faithful-to-mod",
    title: "Test whether explanations remain faithful to model behavior.",
    status: "in_progress",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 35,
    estimatedEffort: "5d",
    syncStatus: true,
    body: `Faithfulness: evidence tokens must be reconstructable from the scorer that actually ran (rules_v0 or cs_crm_rules_v0 today; catboost_v0 only if wired). ${FREEZE_BODY} Do not test a model that is not on the path.`,
    today: "No faithfulness study. Live path is rules_v0 (banking) and cs_crm_rules_v0 (CRM simulator). catboost_v0 is offline. Do not quote holdout accuracy as explanation faithfulness.",
    doThis: `Write ${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md: method (signal replay vs label), split, and that CoT is out of scope. Run later on simulator/gold only.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md.`,
    successCriteria:
      "- Method named; live scorer named.\n- Offline model not treated as live.\n- No CoT as a faithfulness target.\n- No live customer events.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md; tests/cs-crm-coordinates.test.ts action mapping checks.`,
    notes: "In progress: protocol and focused mapping tests exist. End-to-end signal replay against the live scorers has not been completed.",
    links: [
      "docs/Phase 6 - ELAH model development/ELAH_MODEL_CARD.md",
      "docs/Phase 5 - Baseline scoring system/ELAH_RULES_BASELINE.md",
    ],
  }),
  spec({
    id: "task-7-avoid-exposing-private-model-reasoning-or-unsupp",
    title: "Avoid exposing private model reasoning or unsupported chain-of-thought.",
    status: "done",
    priority: "critical",
    isCriticalPath: true,
    progressPercentage: 100,
    estimatedEffort: "2d",
    syncStatus: true,
    body: `Forbidden on every analyst and customer surface: hidden activations, token-level CoT, “the model thought…”, system-prompt dumps. ${FREEZE_BODY} Phase 0 explainability already bans CoT; Phase 7 restates it for the graph and CS/CRM panel.`,
    today: "DONE: Phase 0 and Phase 7 prohibit CoT; the founder panel renders only structured score, reason, provenance, action, policy, and sanitized metadata fields.",
    doThis: `Maintain ${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md and keep customer chat free of private reasoning.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md.`,
    successCriteria:
      "- CoT and private reasoning listed as OUT.\n- Allowed explanation fields listed.\n- Customer UI explicitly excluded.\n- Status Proposed until founder Approve.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md`,
    notes: "Done: approved Phase 7 privacy guidance and the implemented panel avoid private reasoning and unsupported chain-of-thought.",
    links: [
      "docs/Phase 0 - Product Definition/ELAH_EXPLAINABILITY.md",
      "docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md",
    ],
  }),
  spec({
    id: "task-7-use-concise-evidence-based-explanations-instead",
    title: "Use concise evidence-based explanations instead.",
    status: "done",
    priority: "high",
    isCriticalPath: true,
    progressPercentage: 100,
    estimatedEffort: "3d",
    syncStatus: true,
    body: `Explanations are short, reproducible sentences from matched/weak/negative signals (≤240 chars if a summary exists). CS/CRM ops analysts should read tokens they could verify on the event. ${FREEZE_BODY} Style is evidence, not narrative.`,
    today: "DONE: Phase 7 guidance defines concise, reproducible, PII-safe explanations and the founder panel uses short structured evidence copy rather than narrative reasoning.",
    doThis: `Maintain ${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md and keep explanation copy concise and evidence-based.`,
    inn: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md.`,
    successCriteria:
      "- Summary length and reproducibility stated.\n- PII forbidden in summaries.\n- Examples for CS/CRM tools included.\n- No CoT.",
    deliverables: `${PHASE7_DOC_DIR}/ELAH_FAITHFULNESS_AND_PRIVACY.md`,
    notes: "Done: the approved style memo exists and the graph-linked panel follows it.",
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
