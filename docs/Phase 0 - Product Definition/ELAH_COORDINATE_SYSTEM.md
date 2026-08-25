# ELAH Intention-Graph Coordinate System

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-COORDINATES-001 |
| Spec version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related roadmap task | `task-0-define-the-coordinate-system-for-the-intention-g` |
| Depends on | `ELAH-PRD-MVP-SCOPE-001`, `ELAH-SPEC-OUTPUT-001`, live intent matrix (`lib/agent/intent-matrix`) |
| Does not own | `elahScore` bands (score-semantics); confidence opacity/glyphs (confidence spec + Phase 7 visual); learned mapping from embeddings (Phase 7 calculation); a fourth axis |

---

## 1. Purpose

The intention graph is how analysts **see** a scored banking-assistant action: one point in a shared 3-D space. If axes, ranges, or mapping drift, two sessions with the same transfer will not sit in the same region, and SOC views cannot compare events.

This document freezes:

1. **Axes** — names, meaning, low/high poles.
2. **Range** — the unit cube `[0,1]³`.
3. **Mapping rules** — live matrix `x,y,z` and intent-default atlas → `ScoreResponse.score.coordinates`.
4. **A sample plotted event** — output-contract 8.1 plus neighbours so a dashboard can be checked by eye.

Coordinates **explain**. They are not an allow/deny. A genuine external transfer **should** sit high on Financial Risk **and** high on Human Agency.

---

## 2. Plan executed

| Step | Result |
|---|---|
| 1. Bound the space | Three named axes; no fourth |
| 2. Bound the range | Unit cube, `round3`, clamp |
| 3. Mapped live code | Matrix `x→humanAgency`, `y→financialRisk`, `z→emotionalUrgency` |
| 4. Published defaults | Intent atlas from `calculateInitialCoordinates` |
| 5. Separated internals | H/B/S 5-vectors stay classifier-only |
| 6. Sample plot | §8 |

---

## 3. Frozen decisions

| ID | Decision |
|---|---|
| G1 | The graph is a **right-handed unit cube** with exactly three axes: **Human Agency**, **Financial Risk**, **Emotional Urgency**. |
| G2 | API object is `coordinates: { humanAgency, financialRisk, emotionalUrgency }`, each in **[0.00, 1.00]**, three decimal places (output O7 / O12). |
| G3 | Plot mapping: **X** = Human Agency, **Y** = Financial Risk, **Z** = Emotional Urgency. 2-D projection: X vs Y, **Z as bubble size** (live founder chart). |
| G4 | Live classifier point maps **verbatim**: `point.x → humanAgency`, `point.y → financialRisk`, `point.z → emotionalUrgency` (`calculateInitialCoordinates`). |
| G5 | If no matrix point exists, use the **intent-default atlas** in §6. Unknown `intentLabel` → `ambiguous_banking_request` defaults. |
| G6 | Values MUST be **clamped** to `[0,1]` after any adjustment. No wrap-around. |
| G7 | Display-only jitter (ring-spread of stacked intents) MUST NOT be persisted. Stored coordinates are the **taxonomy/scorer** point. |
| G8 | H, B, S 5-vectors (`computeIntentPoint`) are **internal**. They MUST NOT appear on `ScoreResponse` in v1. |
| G9 | Coordinates are **independent of `elahScore`**. High agency + high financial risk + high score is the core money-movement demo, not a contradiction. |
| G10 | Abstention does **not** move the point to the origin. Plot it with the abstain glyph (confidence spec). |
| G11 | Adding, renaming, or swapping axes is a **new spec version**. Phase 7 may add **overlays** (colour, opacity, dashed outline), not a fourth numeric axis. |
| G12 | Origin `(0,0,0)` is theoretically “no agency / no harm potential / no urgency” (near `non_banking_request`). It is not “safe” and not “allow”. |

---

## 4. Axes

| API field | Axis | Plot | Low (≈0) | High (≈1) |
|---|---|---|---|---|
| `humanAgency` | Human Agency | X | Vague, coerced, bot-like, contradictory, injection-steered | Deliberate, specific, ordinary customer action |
| `financialRisk` | Financial Risk | Y | Read-only or support with little harm if executed | Money movement, entitlement change, sensitive export, or hostile attempt to cause that harm |
| `emotionalUrgency` | Emotional Urgency | Z | Calm, routine, informational | Pressure, panic, distress, haste, fear, coercion |

**Financial Risk** is harm **if the requested tool ran**, not “this customer is a fraudster”. A legitimate ₪500 send is high Y. Injection that *asks* for a transfer is also high Y (hostile harm potential) with **low** X.

**Human Agency** is not “the human is present”. It is how much the utterance looks like a **chosen banking act** vs something steered, empty, or non-banking.

**Emotional Urgency** is pressure in the request, not SLA urgency for the bank.

---

## 5. The unit cube

```
        financialRisk (Y)
              1 |
                |
                |        * injection (low X, high Y)
                |              * external transfer (high X, high Y)
                |
              0 +---------------- 1  humanAgency (X)
               /
              / emotionalUrgency (Z) out of page / bubble size
```

| Region (X, Y) | Typical reading |
|---|---|
| High X, low Y | Deliberate read / low-harm (balance, recent tx) |
| High X, high Y | Deliberate money or entitlement (P0 transfer, freeze) |
| Low X, high Y | Steered or hostile high-harm (injection) |
| Low X, low Y | Non-banking or empty |
| Mid X, mid Y | Ambiguous / support / profile |

Z lifts fraud-report and freeze (distress) above a calm transfer of similar X/Y.

All three axes are **bounded**. Producers MUST `round3` then clamp.

---

## 6. Mapping rules (producers)

Apply **in order**.

### 6.1 From the live intent matrix (preferred)

When `ClassifyAgentIntentResult.point` exists:

```
humanAgency     = round3(clamp(point.x))
financialRisk   = round3(clamp(point.y))
emotionalUrgency = round3(clamp(point.z))
```

This is what `lib/elah/helpers.ts` `calculateInitialCoordinates` already does.

Internal formula (documentation only — do not expose H/B/S on the API):

```
x = 0.30·controlDesire + 0.25·moneyMovement + 0.20·productChange
  + 0.15·supportNeed + 0.10·needAwareness

y = 0.30·financialRisk + 0.25·privacySensitivity + 0.20·irreversibility
  + 0.15·authDepth + 0.10·anomalyScore

z = 0.35·protectionNeed + 0.25·supportNeed + 0.20·financialRisk
  + 0.10·controlDesire + 0.10·anomalyScore
```

Source: `lib/agent/intent-matrix/compute-point.ts`. Changing weights is a classifier change; the **named axes and [0,1] cube stay**.

### 6.2 Intent-default atlas (no matrix point)

Used by training backfill and by a rules mock that has `intentLabel` only. Values are the live `calculateInitialCoordinates` defaults.

| `intentLabel` | HA (X) | FR (Y) | EU (Z) |
|---|---:|---:|---:|
| `balance_awareness` | 0.28 | 0.12 | 0.18 |
| `recent_transactions` | 0.30 | 0.16 | 0.20 |
| `spending_summary` | 0.32 | 0.18 | 0.22 |
| `internal_transfer` | 0.62 | 0.42 | 0.28 |
| `external_transfer` | 0.72 | 0.78 | 0.35 |
| `bill_payment` | 0.68 | 0.65 | 0.30 |
| `scheduled_payment` | 0.66 | 0.60 | 0.26 |
| `statement_download` | 0.40 | 0.22 | 0.18 |
| `card_freeze` | 0.70 | 0.48 | 0.55 |
| `card_unfreeze` | 0.68 | 0.40 | 0.42 |
| `fraud_report` | 0.58 | 0.62 | 0.82 |
| `dispute_chargeback` | 0.60 | 0.58 | 0.78 |
| `fee_or_overdraft_question` | 0.45 | 0.35 | 0.48 |
| `loan_inquiry` | 0.52 | 0.38 | 0.24 |
| `loan_application` | 0.64 | 0.55 | 0.32 |
| `savings_optimization` | 0.58 | 0.38 | 0.22 |
| `profile_update` | 0.55 | 0.28 | 0.20 |
| `support_escalation` | 0.42 | 0.15 | 0.52 |
| `ambiguous_banking_request` | 0.35 | 0.25 | 0.30 |
| `non_banking_request` | 0.12 | 0.08 | 0.10 |
| `prompt_injection_or_policy_bypass` | 0.15 | 0.92 | 0.25 |

### 6.3 Optional feature nudges (v1 SHOULD, clamp after)

Baseline/mock MAY apply **after** 6.1 or 6.2. Phase 7 calculation spec may replace this table; field names stay.

| Condition | Nudge |
|---|---|
| `amountBucket` is `large_2000_9999` or `very_large_10000_plus` | FR += 0.06 |
| `source = ui` vs `agent` | **none** (twins share coordinates; they differ by `source` only) |
| `status = abstained` | **none** (do not zero the point) |
| Conflicting matched vs negative signals | **none** on coordinates; abstain instead (confidence spec) |

### 6.4 Comparability

Two events are **comparable** on the graph when both used this spec version. Do not mix raw unclamped classifier floats with atlas values without `round3`.

UI vs agent **twins** (same action class, same amount bucket) MUST share the same coordinates within 0.05 on each axis so the demo can say “same intent position, different `source`”.

---

## 7. What dashboards must draw

| Surface | Rule |
|---|---|
| 3-D cube | Domain `[0,1]` on all axes; labels Human Agency / Financial Risk / Emotional Urgency |
| 2-D | X = HA, Y = FR, bubble size ∝ Z (live founder `IntentMatrixScatter`) |
| Abstain | Same coordinates; dashed/hollow (confidence spec G-caption) |
| Score unavailable | No point |
| Stacked same-intent volume | Ring-spread **in the renderer only** (live `spreadIntentPoints`) |
| Colour | MAY encode matrix `riskLevel` or `policyHook` — overlay, not an axis |

Customer assistant UI: **do not** show the cube.

---

## 8. Sample plotted events

Coordinates match `ELAH-SPEC-OUTPUT-001` §8 and the atlas.

| ID | Event | HA | FR | EU | `elahScore` | Graph reading |
|---|---|---:|---:|---:|---:|---|
| A | P0 external transfer (8.1) | 0.72 | 0.78 | 0.35 | 0.87 | Upper-right: deliberate money out. High score **and** high FR is correct. |
| B | Prompt injection (8.2) | 0.15 | 0.92 | 0.25 | 0.08 | Upper-left: high harm potential, not a chosen customer act. |
| C | Abstained ambiguous (8.3) | 0.35 | 0.25 | 0.30 | 0.48 | Lower-mid. Draw hollow. Do not treat score as decisive. |
| D | Statement download (8.4) | 0.40 | 0.22 | 0.18 | 0.81 | Lower-mid X, low Y: export with modest harm vs a wire. |
| E | Balance (atlas) | 0.28 | 0.12 | 0.18 | — | Near origin on Y: read-only. |
| F | Fraud report (atlas) | 0.58 | 0.62 | 0.82 | — | High Z: distress. |

### 8.1 2-D sketch (X = HA, Y = FR)

```
FR 1.0 |  B injection
    0.9|
    0.8|                 A transfer
    0.7|
    0.6|                    F fraud
    0.5|
    0.4|
    0.3|        C abstain
    0.2|          D statement
    0.1| E balance
    0.0 +--------------------------------
        0.0   0.2   0.4   0.6   0.8   1.0  HA
```

**Acceptance:** a reviewer can find A in the high-high quadrant and B in the low-X high-Y quadrant without reading JSON.

### 8.2 Canonical JSON for A (plot this)

```json
{
  "eventId": "evt_01JEXAMPLE000000000000001",
  "intentLabel": "external_transfer",
  "elahScore": 0.87,
  "status": "scored",
  "coordinates": {
    "humanAgency": 0.72,
    "financialRisk": 0.78,
    "emotionalUrgency": 0.35
  }
}
```

---

## 9. Invalid mappings (reject)

| Mistake | Why |
|---|---|
| Persist ring-spread x/y | Display jitter is not signal |
| Put `elahScore` on an axis | Score is a separate scalar |
| Swap X/Y vs live charts | Breaks analyst muscle memory |
| Emit H/B/S on `ScoreResponse` | Not in output contract |
| Move abstained points to `(0,0,0)` | Hides the actual (thin) evidence |
| Treat high FR as “ELAH says deny” | Policy owns allow/deny |

---

## 10. Implementation notes (live)

- Training table columns: `humanAgency`, `financialRisk`, `emotionalUrgency`.
- Classifier table: `AgentIntentEvent.x/y/z`.
- Founder 2-D chart already labels X Human Agency, Y Financial / Data Risk, Z bubble = urgency.
- MVP wording: **Financial Risk** (output contract). Charts MAY subtitle “Financial / Data Risk” as the same Y axis.

---

## 11. Out of scope

- Exact learned function from embeddings → cube (Phase 7 calculation).
- Opacity, glyphs, accessibility of the WebGL cube (Phase 7 visual).
- Score-band colours on the point (score-semantics).
- Changing the 22-intent atlas without a spec revision.

---

## 12. Related documents

| Document | Role |
|---|---|
| `docs/Phase 0 - Product Definition/ELAH_MVP_SCOPE.md` | Axis one-liners |
| `docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md` | `coordinates` object; samples 8.1–8.4 |
| `docs/Phase 0 - Product Definition/ELAH_CONFIDENCE_SEMANTICS.md` | Abstain glyph; opacity recommendation |
| `docs/ELAH_LABEL_TAXONOMY.md` | Annotator low/high poles |
| Live `lib/agent/intent-matrix/compute-point.ts` | Internal x/y/z weights |

---

## 13. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder | | | Approve / Approve with comments / Reject |
| Engineering | | | |
| Analyst UX | | | |

**Approval statement:** I agree that the ELAH intention graph is the unit cube Human Agency × Financial Risk × Emotional Urgency; that live matrix `x,y,z` maps to those names; that the §6 atlas and §8 sample plot (transfer high-high, injection low-X high-Y) are the v1 reference; and that coordinates never allow or block.

---

*End of document.*
