# ELAH intention-graph dimensions (Phase 7)

| Field | Value |
|---|---|
| Document ID | ELAH-P7-DIM-001 |
| Version | **0.1** |
| Status | **Approved — Founder, 17 September 2026** |
| Date | 16 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-7-finalize-the-dimensions-of-the-intention-graph` |
| Depends on | `ELAH-SPEC-COORDINATES-001` (Phase 0 G1–G12), `ELAH-WEDGE-TAX-001`, `ELAH-WEDGE-FREEZE-001` |
| Canonical path | `docs/Phase 7 - Explainability and intention graph/ELAH_GRAPH_DIMENSIONS.md` |
| Does not own | Axis prose for support tools (`ELAH-P7-AXES-001`); atlas numbers (`ELAH-P7-CALC-001`); glyphs (`ELAH-P7-VIS-001`) |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Coordinates **explain**. They are not an allow/deny. Customer / support-user UI MUST NOT show `elahScore` or the cube. Analyst (founder) UI MAY show both.

Phase 7 **finalizes** the graph for the CS/CRM first consumer by **restating** Phase 0. It does not reopen the cube.

---

## 1. Purpose

If axes, range, or mapping drift, two refunds with the same intent will not sit in the same region, and a CS/CRM ops analyst cannot compare events.

This document freezes Phase 7 dimensions:

1. Exactly **three** named axes on the **same** unit cube as Phase 0.
2. CS/CRM is an **overlay domain** (16-label atlas), not a second graph and not a fourth axis.
3. Banking graph remains the existing demo / later vertical.

---

## 2. Restated Phase 0 decisions (G1–G12)

Normative source: `docs/Phase 0 - Product Definition/ELAH_COORDINATE_SYSTEM.md` (`ELAH-SPEC-COORDINATES-001`). Phase 7 does **not** change these IDs.

| ID | Decision (still binding) |
|---|---|
| G1 | The graph is a **right-handed unit cube** with exactly three axes: **Human Agency**, **Financial Risk**, **Emotional Urgency**. |
| G2 | API object is `coordinates: { humanAgency, financialRisk, emotionalUrgency }`, each in **[0.00, 1.00]**, three decimal places. |
| G3 | Plot mapping: **X** = Human Agency, **Y** = Financial Risk, **Z** = Emotional Urgency. 2-D projection: X vs Y, **Z as bubble size**. |
| G4 | When a live classifier point exists, map **verbatim**: `point.x → humanAgency`, `point.y → financialRisk`, `point.z → emotionalUrgency`. CS/CRM v0.1 has **no** live embedding classifier; use the display atlas (`ELAH-P7-CALC-001`). |
| G5 | If no matrix point exists, use the **intent-default atlas** for that domain. Unknown CS/CRM label → `ambiguous_crm_request`. Unknown banking label → `ambiguous_banking_request`. Do not cross-walk the two atlases into one gold set. |
| G6 | Values MUST be **clamped** to `[0,1]` after any adjustment. No wrap-around. |
| G7 | Display-only jitter (ring-spread of stacked intents) MUST NOT be persisted. Stored coordinates are the taxonomy/scorer point. Live helper: `spreadIntentPoints` in `lib/intent-matrix-points.ts`. |
| G8 | H, B, S 5-vectors (`computeIntentPoint`) are **internal**. They MUST NOT appear on `ScoreResponse`. They are **not** the Phase 7 three-layer analyst viz. |
| G9 | Coordinates are **independent of `elahScore`**. High agency + high financial risk + high score is the core refund/money-movement demo, not a contradiction. |
| G10 | Abstention does **not** move the point to the origin. Plot it with the abstain glyph (`ELAH-P7-VIS-001`). |
| G11 | Adding, renaming, or swapping axes is a **new spec version**. Phase 7 may add **overlays** (colour, opacity, dashed outline, trajectories), **not** a fourth numeric axis. |
| G12 | Origin `(0,0,0)` is theoretically “no agency / no harm potential / no urgency” (near `non_crm_request` / `non_banking_request`). It is not “safe” and not “allow”. |

---

## 3. What Phase 7 adds (overlays, not axes)

| Overlay | Owned by | Not |
|---|---|---|
| Confidence → opacity | `ELAH-P7-VIS-001` | A W axis |
| Uncertainty / abstain → glyph | `ELAH-P7-VIS-001` | An error bar on `elahScore` |
| Risk colour | `ELAH-P7-VIS-001` (tokens already in `RISK_COLORS`) | Recolouring Y as “fraud” |
| Trajectories / request→tool edges | `ELAH-P7-SEQ-001` | A time axis on the cube |
| Evidence panel | `ELAH-P7-PANEL-001` | H/B/S dumped onto the plot |
| Normalized action class / impact | 17 Sep 2026 research-derived evidence | A fourth action or impact axis |

---

## 4. Two domains, one cube

| Domain | Closed labels | Atlas | Gold |
|---|---|---|---|
| CS/CRM (first consumer) | 16 (`cs_crm_taxonomy` 0.1) | Display-only, `ELAH-P7-CALC-001` | `cs_crm_gold` 0.1 plan — **do not mix** into banking gold v1.0 |
| Banking (demo / later vertical) | 22 (frozen) | Phase 0 §6 intent-default atlas | banking gold v1.0 — do not edit here |

Same API field names. Same `[0,1]³`. **Different** `intentLabel` enums. A dashboard MUST key colour/filter by `appId` / domain, not by pretending `refund_request` is `external_transfer`.

Do not invent a 23rd banking label to “fit refunds on the bank cube.”

### Two labels, neither an axis

The supplied 17 September 2026 research ontology labels **what happened** (`normalizedActionId`); the 16-label CS/CRM taxonomy labels **why the request/tool appears aligned or misaligned** (`intentLabel`). Both may be visible on a selected point, but only intent maps through the approved HA/FR/EU atlas. Action class and impact are evidence fields/overlays only. The research does not validate buyers or model quality.

---

## 5. Invalid dimension changes (reject)

| Mistake | Why |
|---|---|
| Add “Malice”, “Confidence”, or `elahScore` as a fourth plotted axis | G11 / G9 |
| Persist ring-spread x/y | G7 |
| Plot H/B/S as the three analyst layers | G8; Phase 7 layers are points / trajectories / evidence |
| Move abstained points to `(0,0,0)` | G10 |
| Treat high FR as “ELAH says deny” | Policy owns allow/deny |
| Show the cube on customer / support-user UI | Freeze |
| Merge CS/CRM and banking atlases in one gold file | Phase 16 / Phase 4 freeze |

---

## 6. Honest engineering note (16 September 2026)

Founder analytics draws the **banking** unit cube and the CS/CRM-first graph on `/banking/crm`. CRM snapshots are mapped through the approved display-only atlas in `lib/elah/cs-crm-coordinates.ts`; coordinates are not stored on `ElahScoreSnapshot` or CRM Neon. Confidence opacity, abstain glyphs, trajectories, and selected-point evidence are implemented locally; production deployment and human validation remain separate evidence gates.

---

## 7. Sign-off

| Role | Decision | Date | Notes |
|---|---|---|---|
| Founder | **Approve** | 17 September 2026 | G1–G12 restated; CS/CRM overlay; no 4th axis. |

Options: **Approve** / **Approve with comments** / **Reject**.

**Approval statement:** I agree the intention graph remains the unit cube Human Agency × Financial Risk × Emotional Urgency; that Phase 7 adds overlays only; that CS/CRM uses the same cube with a separate 16-label atlas; and that coordinates never allow or block.

---

*End of document.*
