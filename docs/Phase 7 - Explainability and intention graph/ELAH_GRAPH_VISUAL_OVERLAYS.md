# ELAH graph visual overlays (confidence, uncertainty, risk, three layers)

| Field | Value |
|---|---|
| Document ID | ELAH-P7-VIS-001 |
| Version | **0.1** |
| Status | **Approved — Founder, 17 September 2026** |
| Date | 16 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-7-define-how-confidence-appears-visually`; `task-7-define-how-uncertainty-appears-visually`; `task-7-define-how-risk-appears-visually`; `task-7-create-a-three-layer-intention-visualization`; `task-7-display-individual-action-points` |
| Depends on | `ELAH-SPEC-CONFIDENCE-001`, `ELAH-P7-DIM-001`, `ELAH-P7-SEQ-001`, `ELAH-SPEC-SCORE-001` |
| Canonical path | `docs/Phase 7 - Explainability and intention graph/ELAH_GRAPH_VISUAL_OVERLAYS.md` |
| Code (today) | `lib/intent-matrix-points.ts` (`RISK_COLORS`, `spreadIntentPoints`); `components/charts/intent-matrix-3d.tsx`; `components/charts/intent-matrix.tsx` |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Overlays are **not** axes. Customer / support-user UI MUST NOT show the cube, `elahScore`, confidence, or glyphs. Analyst (founder) UI MAY.

Phase 0 deferred exact opacity math and glyphs to Phase 7. This document owns them.

---

## 1. Purpose

Analysts must see **position** (intent coordinates) separately from **how much to trust the reading** (confidence / abstain) and **harm if the tool ran** (risk colour). If colour encodes `elahScore`, the demo collapses G9.

---

## 2. Individual action points (Layer A)

**Display individual action points:** one marker per scored `eventId` with stored coordinates (atlas or scorer), **after** display jitter.

| Surface | Rule |
|---|---|
| 3-D cube | Domain `[0,1]` on X/Y/Z; labels Human Agency / Financial Risk / Emotional Urgency |
| 2-D | X = HA, Y = FR, bubble size ∝ Z (live founder scatter) |
| Missing snapshot / `scoring_unavailable` | **No point** |
| Customer UI | **No cube** |

Live banking demo already draws a point cloud (`intent-matrix-3d.tsx`) with `PointMaterial` opacity **0.82** (constant) and risk vertex colours. That is **not** yet confidence opacity. CS/CRM snapshots are **not** automatically those points.

Suggested marker size: 3-D point size ~0.018 (current); 2-D radius from Z. Selected point: larger + panel (`ELAH-P7-PANEL-001`).

---

## 3. Confidence → opacity

From `ELAH-SPEC-CONFIDENCE-001` C1–C5 and interim caption 8.7: opacity tracks **confidence**, not `elahScore`.

**Exact math (Phase 7):**

```text
opacity = round2( clamp( 0.20 + 0.80 * confidence , 0.20 , 1.00 ) )
```

| Confidence band (display only) | Typical opacity | Word |
|---|---|---|
| High `≥ 0.75` | ≈ 0.80–1.00 | Solid |
| Moderate `[0.40, 0.75)` | ≈ 0.52–0.80 | Readable but not loud |
| Low `< 0.40` | ≈ 0.20–0.52 | Faint; usually also abstained |

Rules:

- Bind **confidence** (or `1 − uncertainty`). Do **not** invent a third formula.
- `rules_v0` / `cs_crm_rules_v0` / uncalibrated stub: still use this opacity, plus the **Uncalibrated (rules)** chip on the panel — not a different fade.
- Do not encode confidence as a fourth axis or as bubble size (Z already uses size in 2-D).
- Customer UI: no opacity encoding of a hidden score.

---

## 4. Uncertainty / abstain → glyph (not a second fade)

`uncertainty = round3(1 − confidence)` (O5 / C2). Do **not** double-encode as both extra-transparent **and** a second colour.

| Condition | Glyph | Must not |
|---|---|---|
| `status = scored` | Filled marker; opacity from §3 | Treat high uncertainty as deny |
| `status = abstained` | **Hollow / dashed ring** at the **same** coordinates (G10). Suggested: 1.4× radius, rose/amber stroke, fill alpha ≤ 0.15 | Move to origin; hide the score in the panel (mute it) |
| Conflict rule fired (`RC_CONFLICTING_SIGNALS`) | Same abstain glyph | A new “conflict axis” |
| `scoring_unavailable` | **No marker**; list copy “Score unavailable” | Fake a point at last-known |

Tooltip (analyst):

```
Point position = intention coordinates.
Opacity = confidence.
Hollow / dashed = ELAH abstained (score non-decisive).
Missing point = score unavailable. Company policy still governs the tool.
```

Uncertainty MAY appear as a numeric line on the **panel** (`Uncertainty 18%`). It MUST NOT appear as an error bar on Y (Financial Risk) or on `elahScore`.

---

## 5. Risk → colour (overlay)

Colour encodes **harm-if-executed** class, not genuineness and not confidence.

Reuse live tokens (`RISK_COLORS` in `lib/intent-matrix-points.ts`):

| Level | Hex | CS/CRM when |
|---|---|---|
| `low` | `#34d399` | Own reads (`ticket_status`, `list_tickets`, `account_lookup`) |
| `medium` | `#fbbf24` | Modest writes (`create_ticket`, `add_crm_note`, allowed `profile_update`, `support_escalation`) |
| `high` | `#fb923c` | Genuine `refund_request`, `cancel_subscription`, `mistaken_agent` with a high-impact planned tool |
| `critical` | `#fb7185` | `prompt_injection_or_policy_bypass`, `refund_abuse`, `unauthorized_crm_overwrite`, `data_exfil_ticket_export` |
| unknown | `#94a3b8` | Missing `riskLevel` |

If `riskLevel` is absent, MAY derive **display-only** from FR + label family:

| Derive | When |
|---|---|
| `critical` | Injection / abuse / exfil / unauthorized overwrite labels |
| `high` | `financialRisk ≥ 0.60` and not critical |
| `medium` | `financialRisk ≥ 0.25` |
| `low` | else |

Do **not** persist the derived level as a new `ScoreResponse` field. Do **not** colour by `elahScore` band (Genuine / Mixed / Off-intent is **panel** copy, `ELAH-SPEC-SCORE-001`).

High FR + emerald “low risk” colour is a defect. High `elahScore` + critical colour on injection is **correct** (low genuineness, high harm potential).

---

## 6. Three-layer intention visualization

Analyst-facing layers. **Not** the classifier-internal H / B / S 5-vectors (G8). The live explainer’s “three layers behind each point” (H/B/S) is **internal documentation of the banking matrix**. Phase 7 does **not** promote those vectors onto `ScoreResponse` or onto the CS/CRM cube.

| Layer | What | Toggle default |
|---|---|---|
| **A — Points** | Individual scored actions (§2) | On |
| **B — Trajectories** | `conversationId` polylines + request→tool edges (`ELAH-P7-SEQ-001`) | On when one thread focused; off on dense global cloud |
| **C — Evidence** | Selection → reason codes, matched / weak / negative signals, contributing factors (`ELAH-P7-PANEL-001`). Optional: tiny `RC_*` chips near the selected point | On for selection; do not paint every point with full evidence |

Layer C MUST NOT render chain-of-thought, hidden activations, raw utterances, or PII.

Research-derived normalized action ID/name/class/impact and mapping provenance belong in Layer C. An analyst MAY filter or decorate by action class/impact, but these are evidence overlays only: they do not move HA/FR/EU, create a fourth axis, encode `elahScore`, or imply ELAH blocked an action. Keep the 249-action label (**what happened**) visually distinct from the 16-intent label (**why aligned/misaligned**).

Caption for the three-layer control:

```
Points = scored actions. Paths = conversation sequence. Evidence = why this point (reason codes and signals).
Not an allow/deny. Not a fourth axis.
```

---

## 7. Accessibility and density

- Do not rely on colour alone: critical/injection also uses the label chip and, when abstained, the hollow glyph.
- Ring-spread (G7) remains the volume cue for stacked intents.
- Keyboard: selecting a point opens the explanation panel. Graph is analyst-only; WCAG for customer chat is out of scope here because customers never see this.

---

## 8. Honest engineering note (16 September 2026)

| Overlay | Live founder banking chart | This spec |
|---|---|---|
| Points | Yes | Yes — founder `/banking/crm` maps snapshots through the approved display atlas |
| Risk colour | Yes (`riskColorHex`) | Same tokens; CS mapping in §5 |
| Jitter | Yes (`spreadIntentPoints`) | Unchanged (display-only) |
| Confidence opacity | Constant `0.82` | §3 formula |
| Abstain glyph | No | §4 hollow/dashed |
| Trajectories | No | Layer B |
| Evidence on graph | Hover snippet (message/tool/policy) | Layer C structured fields only — sanitized analyst evidence, no chain-of-thought |

---

## 9. Sign-off

| Role | Decision | Date | Notes |
|---|---|---|---|
| Founder | **Approve** | 17 September 2026 | Opacity = confidence; glyph = abstain/uncertainty; colour = risk overlay; three layers = points / trajectories / evidence. |

Options: **Approve** / **Approve with comments** / **Reject**.

**Approval statement:** I agree Phase 7 visuals are overlays on the unit cube; that confidence is opacity and abstain is a hollow glyph; that risk colour is not `elahScore`; that the three analyst layers are points, trajectories, and evidence (not H/B/S); and that customer UI never shows this graph.

---

*End of document.*
