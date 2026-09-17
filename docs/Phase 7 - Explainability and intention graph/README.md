# Phase 7 — Explainability and intention graph (documentation)

Canonical **documentation** pack for Phase 7. First consumer is a **B2B SaaS CS/CRM ops analyst**, not a bank CISO. The banking intention graph stays an **existing demo / later vertical**. Phase 7 adds **overlays** (opacity, glyphs, trajectories, evidence) on the frozen Phase 0 cube. **No fourth numeric axis.** Coordinate calculation for CS/CRM is a **display-only intent atlas** — not a learned embedding→cube model. Do not mix CS/CRM rows into banking gold v1.0. Do not quote rules holdout 1.00 as production. Do not `prisma db push`. Do not invent customers, ARR, interviews, or live Zendesk.

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores live in `ElahScoreSnapshot`, not the event envelope. Customer / support-user UI MUST NOT show `elahScore`. Analyst (founder) UI MAY show score. Fail-open 250 ms → `scoring_unavailable`, not a block.

Evidence date: **17 September 2026**. Phase 7 design approved by the founder **17 September 2026**. CS/CRM taxonomy: 16 labels v0.1 — [ELAH_CS_CRM_TAXONOMY.md](../Phase%2016%20-%20B2B%20SaaS%20CS%20CRM%20wedge/ELAH_CS_CRM_TAXONOMY.md). Not a 23rd banking label. Additive research input: `ELAH_CRM_SaaS_Human_Actions_Research.pdf` (17 Sep 2026), a 249-action starting ontology; it is not customer validation or model-accuracy evidence.

Demo venue (CS/CRM): **ELAH CRM Simulation**. GitHub [`benda17/ELAH_SECURITY-CRM-System`](https://github.com/benda17/ELAH_SECURITY-CRM-System). Local [http://localhost:3003](http://localhost:3003). Hosted: [https://elahcrmsystem.vercel.app](https://elahcrmsystem.vercel.app). Founder CS/CRM graph (first analyst surface): this repo, `/banking/crm` — atlas `lib/elah/cs-crm-coordinates.ts`, cube `components/cs-crm-intent-matrix-view.tsx`. Banking demo cube (later vertical): `/banking/intent-matrix`.

Canonical demo users: `basic.customer@elah.demo` (customer / support-user), `security.admin@elah.demo` (analyst). Password `DemoPass123!`.

This pack maps all **23** Phase 7 Kanban cards. Re-audit on 17 September 2026: **19 Done, 3 In Progress, 1 Backlog, 0 In Review**.

---

## How to upload to Confluence

Founder-only paste. Agents do not publish.

1. Create a parent page titled **Phase 7 — Explainability and intention graph**. Put [ELAH_PHASE7_EXECUTIVE_SUMMARY.md](./ELAH_PHASE7_EXECUTIVE_SUMMARY.md) on that home page.
2. Create one child page per file in the index below that has a Doc ID. Page title = **Doc ID + short name** (example: `ELAH-P7-DIM-001 — Graph dimensions`). Paste the markdown. Keep headings.
3. Keep the header table (Document ID, Version, Status, Date). The design documents are **Approved — Founder, 17 September 2026**. Human-test results remain outstanding.
4. Link each Kanban card’s deliverable to its Confluence child (same Doc ID). Several cards share one file; that is intended.
5. Do **not** upload Neon connection strings, `.env`, live ticket exports, or production CRM dumps. Demo password `DemoPass123!` is the known simulator login; do not treat it as a customer secret.
6. Do **not** paste banking holdout numbers as CS/CRM or refund accuracy. If you cite them, they must stay labeled **banking-gold / `rules_v0`**. Do **not** quote CS `cs_crm_rules_v0` holdout 1.00 as production.
7. Do **not** paste chain-of-thought, hidden activations, or raw customer utterances into Confluence as “explanations.”

Upload path for Kanban links: `docs/Phase 7 - Explainability and intention graph/<file>`.

---

## Index

| Order | Task | Task id | Evidence status (17 Sep 2026) | Doc ID | File / pointer |
|---:|---|---|---|---|---|
| 1 | Finalize the dimensions of the intention graph | `task-7-finalize-the-dimensions-of-the-intention-graph` | **Approved design** | ELAH-P7-DIM-001 | [ELAH_GRAPH_DIMENSIONS.md](./ELAH_GRAPH_DIMENSIONS.md) — restates Phase 0 G1–G12; CS/CRM overlay; no 4th axis |
| 2 | Define the meaning of each axis | `task-7-define-the-meaning-of-each-axis` | **Approved design** | ELAH-P7-AXES-001 | [ELAH_GRAPH_AXES.md](./ELAH_GRAPH_AXES.md) — HA / FR / EU for support/CRM tools |
| 3 | Define coordinate calculation | `task-7-define-coordinate-calculation` | **Approved design** | ELAH-P7-CALC-001 | [ELAH_COORDINATE_CALCULATION.md](./ELAH_COORDINATE_CALCULATION.md) — display-only CS/CRM atlas (16 labels). Not a learned embedding→cube model |
| 4 | Define how action sequences appear on the graph | `task-7-define-how-action-sequences-appear-on-the-graph` | **Approved design** | ELAH-P7-SEQ-001 | [ELAH_GRAPH_SEQUENCES.md](./ELAH_GRAPH_SEQUENCES.md) |
| 5 | Define how confidence appears visually | `task-7-define-how-confidence-appears-visually` | **Approved design** | ELAH-P7-VIS-001 | [ELAH_GRAPH_VISUAL_OVERLAYS.md](./ELAH_GRAPH_VISUAL_OVERLAYS.md) §confidence |
| 6 | Define how uncertainty appears visually | `task-7-define-how-uncertainty-appears-visually` | **Approved design** | ELAH-P7-VIS-001 | [ELAH_GRAPH_VISUAL_OVERLAYS.md](./ELAH_GRAPH_VISUAL_OVERLAYS.md) §uncertainty |
| 7 | Define how risk appears visually | `task-7-define-how-risk-appears-visually` | **Approved design** | ELAH-P7-VIS-001 | [ELAH_GRAPH_VISUAL_OVERLAYS.md](./ELAH_GRAPH_VISUAL_OVERLAYS.md) §risk |
| 8 | Create a three-layer intention visualization | `task-7-create-a-three-layer-intention-visualization` | **Done — implemented and build-verified** | ELAH-P7-VIS-001 | [ELAH_GRAPH_VISUAL_OVERLAYS.md](./ELAH_GRAPH_VISUAL_OVERLAYS.md) §three-layers — points / trajectories / evidence. **Not** H/B/S internals |
| 9 | Display individual action points | `task-7-display-individual-action-points` | **Done — implemented and build-verified** | ELAH-P7-VIS-001 | [ELAH_GRAPH_VISUAL_OVERLAYS.md](./ELAH_GRAPH_VISUAL_OVERLAYS.md) §points. Live CS/CRM: founder `/banking/crm`. Banking demo: `/banking/intent-matrix` |
| 10 | Display action trajectories | `task-7-display-action-trajectories` | **Done — implemented and tested** | ELAH-P7-SEQ-001 | [ELAH_GRAPH_SEQUENCES.md](./ELAH_GRAPH_SEQUENCES.md) §trajectories |
| 11 | Display user-request-to-agent-action relationships | `task-7-display-user-request-to-agent-action-relationshi` | **Done — selected-point relationship implemented** | ELAH-P7-SEQ-001 | [ELAH_GRAPH_SEQUENCES.md](./ELAH_GRAPH_SEQUENCES.md) §request-to-tool |
| 12 | Display deviations from expected behavior | `task-7-display-deviations-from-expected-behavior` | **Done — deviation markers implemented** | ELAH-P7-SEQ-001 | [ELAH_GRAPH_SEQUENCES.md](./ELAH_GRAPH_SEQUENCES.md) §deviations; no invented rate |
| 13 | Display model evidence | `task-7-display-model-evidence` | **In progress — core evidence live; signal lists incomplete** | ELAH-P7-PANEL-001 | [ELAH_EXPLANATION_PANEL.md](./ELAH_EXPLANATION_PANEL.md) §evidence |
| 14 | Display contributing factors | `task-7-display-contributing-factors` | **Done — reason-code factors implemented** | ELAH-P7-PANEL-001 | [ELAH_EXPLANATION_PANEL.md](./ELAH_EXPLANATION_PANEL.md) §contributing |
| 15 | Display reason codes | `task-7-display-reason-codes` | **Done — graph-linked chips implemented** | ELAH-P7-PANEL-001 | [ELAH_EXPLANATION_PANEL.md](./ELAH_EXPLANATION_PANEL.md) §reason-codes |
| 16 | Display alternative interpretations | `task-7-display-alternative-interpretations` | **In progress — deterministic notes live; closed-label top-k not approved** | ELAH-P7-PANEL-001 | [ELAH_EXPLANATION_PANEL.md](./ELAH_EXPLANATION_PANEL.md) §alternatives — no CoT ranking |
| 17 | Add an event explanation panel | `task-7-add-an-event-explanation-panel` | **Done — implemented and build-verified** | ELAH-P7-PANEL-001 | [ELAH_EXPLANATION_PANEL.md](./ELAH_EXPLANATION_PANEL.md) |
| 18 | Add model-version information | `task-7-add-model-version-information` | **Done — scorer provenance implemented** | ELAH-P7-PANEL-001 | [ELAH_EXPLANATION_PANEL.md](./ELAH_EXPLANATION_PANEL.md) §provenance |
| 19 | Add raw-event inspection for authorized users | `task-7-add-raw-event-inspection-for-authorized-users` | **Done for founder/admin scope** | ELAH-P7-PANEL-001 | [ELAH_EXPLANATION_PANEL.md](./ELAH_EXPLANATION_PANEL.md) §raw-event — sanitized, founder/analyst only |
| 20 | Test whether explanations are understandable to CS/CRM ops analysts | `task-7-test-whether-explanations-are-understandable-to-` | **Backlog — protocol ready; no session started** | ELAH-P7-FAITH-001 | [ELAH_FAITHFULNESS_AND_PRIVACY.md](./ELAH_FAITHFULNESS_AND_PRIVACY.md) §understandability — **no fabricated interview notes** |
| 21 | Test whether explanations remain faithful to model behavior | `task-7-test-whether-explanations-remain-faithful-to-mod` | **In progress — protocol/mapping tests exist; signal replay incomplete** | ELAH-P7-FAITH-001 | [ELAH_FAITHFULNESS_AND_PRIVACY.md](./ELAH_FAITHFULNESS_AND_PRIVACY.md) §faithfulness |
| 22 | Avoid exposing private model reasoning or unsupported chain-of-thought | `task-7-avoid-exposing-private-model-reasoning-or-unsupp` | **Done — approved guidance and structured UI implemented** | ELAH-P7-FAITH-001 | [ELAH_FAITHFULNESS_AND_PRIVACY.md](./ELAH_FAITHFULNESS_AND_PRIVACY.md) §no-cot |
| 23 | Use concise evidence-based explanations instead | `task-7-use-concise-evidence-based-explanations-instead` | **Done — approved guidance and concise UI implemented** | ELAH-P7-FAITH-001 | [ELAH_FAITHFULNESS_AND_PRIVACY.md](./ELAH_FAITHFULNESS_AND_PRIVACY.md) §concise |
| — | Founder executive summary | — | — | — | [ELAH_PHASE7_EXECUTIVE_SUMMARY.md](./ELAH_PHASE7_EXECUTIVE_SUMMARY.md) |

Closed 16 `ElahCrmIntent` labels (Proposed 0.1): [ELAH_CS_CRM_TAXONOMY.md](../Phase%2016%20-%20B2B%20SaaS%20CS%20CRM%20wedge/ELAH_CS_CRM_TAXONOMY.md). **Not** a 23rd banking label. Banking 22-label freeze stays in Phase 4. Frozen cube: [ELAH_COORDINATE_SYSTEM.md](../Phase%200%20-%20Product%20Definition/ELAH_COORDINATE_SYSTEM.md) (G1–G12).

---

## How to read

1. **Dimensions + axes** — same unit cube as Phase 0; CS/CRM overlay meaning for refunds, tickets, CRM writes, export. Financial Risk = harm **if the tool ran**, not “fraudster.”
2. **Coordinate calculation** — display-only atlas for all 16 CS/CRM labels. Jitter is renderer-only (`spreadIntentPoints`). Not a learned model. Not mixed into banking gold v1.0.
3. **Sequences** — trajectories by `conversationId`; request→tool edge; deviations (`mistaken_agent`, injection jump, FR spike).
4. **Visual overlays** — confidence opacity, uncertainty/abstain glyph, risk colour, three analyst layers (points / trajectories / evidence).
5. **Explanation panel** — analyst fields from `ElahScoreSnapshot`. Forbidden: CoT, customer-visible score, allow/deny by ELAH.
6. **Faithfulness + privacy** — no private model reasoning; concise evidence; faithfulness checklist; CS/CRM understandability **protocol** (zero completed notes).

## Two-label action evidence overlay (17 Sep 2026)

- **Normalized action = what happened.** Keep the platform-native tool plus action ID/name/class/impact and mapping provenance.
- **Existing 16-label intent = why it appears aligned or misaligned.** The action ontology does not replace or expand the intent set.
- HA/FR/EU remain the only graph axes. Action class and ontology impact are evidence-panel fields/optional overlays only.
- Historical tool fallbacks are reviewed research mappings; producer metadata takes precedence. `request_refund` is explicitly unmapped because the PDF has no normalized refund action ID.
- Company policy remains separate from both labels. A `Critical` action impact never means “ELAH blocked.”

Related: Phase 0 coordinate / explainability / confidence specs, Phase 5 reason codes, Phase 16 CS/CRM wedge, Phase 4 banking gold (do not overwrite).

---

*End of document.*
