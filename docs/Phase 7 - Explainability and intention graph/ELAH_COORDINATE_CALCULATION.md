# ELAH coordinate calculation — CS/CRM display atlas

| Field | Value |
|---|---|
| Document ID | ELAH-P7-CALC-001 |
| Version | **0.1** |
| Status | **Approved — Founder, 17 September 2026** |
| Date | 16 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-7-define-coordinate-calculation` |
| Depends on | `ELAH-P7-DIM-001`, `ELAH-P7-AXES-001`, `ELAH-WEDGE-TAX-001` |
| Domain version | `cs_crm_atlas` **0.1** (display-only) |
| Canonical path | `docs/Phase 7 - Explainability and intention graph/ELAH_COORDINATE_CALCULATION.md` |
| Code (jitter only) | `lib/intent-matrix-points.ts` (`spreadIntentPoints`) |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Coordinates explain; they are not enforcement. Customer / support-user UI MUST NOT show coordinates.

This is a **display-only intent atlas**, like the banking intent-default atlas in `ELAH-SPEC-COORDINATES-001` §6.2. It is **not** a learned embedding→cube model. Do not mix these rows into banking gold v1.0. Do not quote `cs_crm_rules_v0` holdout **1.00** (or banking-gold 0.79) as proof the atlas is calibrated.

---

## 1. Purpose

Give every CS/CRM `intentLabel` a stable `(humanAgency, financialRisk, emotionalUrgency)` so a CS/CRM ops analyst can compare events on the same cube.

Phase 0 left “exact learned function from embeddings → cube” as a later calculation spec. **This pack does not ship that function.** CS/CRM v0.1 has no matrix `computeIntentPoint`. Producers use §3 then optional §4 nudges, then `round3` + clamp (G6).

---

## 2. Producer order

Apply **in order**.

1. Resolve `intentLabel` from the **16** `cs_crm_taxonomy` 0.1 labels (`ELAH-WEDGE-TAX-001`). Unknown → `ambiguous_crm_request` (G5 analog).
2. Look up §3 atlas.
3. MAY apply §4 display/scorer nudges. Clamp after each.
4. `round3` each axis; clamp to `[0,1]`.
5. Persist **only** the taxonomy/scorer point on `ElahScoreSnapshot` / `ScoreResponse.score.coordinates`.
6. Renderer MAY apply `spreadIntentPoints` jitter. **MUST NOT** write jitter back (G7).

Before display, the founder query MAY also resolve the separate normalized action evidence from sanitized event metadata, then a reviewed tool fallback. That action mapping never changes the coordinates: action answers **what happened**; `intentLabel` answers **why it appears aligned or misaligned**.

Do **not** emit H/B/S 5-vectors (G8). Do **not** put `elahScore` on an axis (G9). Do **not** zero the point when `status = abstained` (G10). If scoring is unavailable, **no point**.

UI vs agent **twins** (same action class, same amount bucket) MUST share coordinates within **0.05** on each axis so the demo can say “same intent position, different `source`.”

### 2.1 Historical CRM tool fallback (research note, 17 Sep 2026)

| Native tool | Normalized action | Class | Impact | Nuance |
|---|---|---|---|---|
| `list_tickets` | `SUP-25 view_queue` | Observe | Moderate | A ticket list/work queue, not a single ticket. |
| `get_ticket` | `SUP-01 view_ticket` | Observe | Low | Single case/conversation read. |
| `create_ticket` | `SUP-02 create_ticket` | Change | Moderate | Exact ticket create. |
| `add_ticket_comment` | `SUP-03 reply_to_customer` | Change | Moderate | Defensible only for the simulator's customer-visible comment; an internal note would be `SUP-04`. |
| `lookup_account` | `CRM-01 view_record` | Observe | Low | Account/company record read. |
| `update_contact_email` | `CRM-07 edit_record_property` | Change | Moderate | Contact property update. |
| `update_contact_phone` | `CRM-07 edit_record_property` | Change | Moderate | Contact property update. |
| `request_refund` | **unmapped** | — | — | The PDF discusses refunds but contains no normalized refund row; do not invent an ID. |
| `cancel_subscription` | `SMP-25 cancel_subscription` | Change | Critical | Exact subscription-cancel action; the source's primary context is SaaS/vendor subscription, so retain the native object/context. |
| `escalate_to_human` | `SUP-18 escalate_ticket` | Change | High | Human handoff maps to ticket escalation. |
| `add_crm_note` | `CRM-18 add_note` | Change | Moderate | CRM-record note, distinct from a ticket internal note. |

Producer-supplied normalized metadata takes precedence and is marked `metadata`; this table is marked `fallback`; absent/unsupported mappings are `unmapped` with a reason. These are research-derived integration mappings, not model predictions or customer validation.

---

## 3. CS/CRM intent-default atlas (16 labels)

Values are **Approved** display defaults for `cs_crm_atlas` 0.1. They are analog to banking §6.2, not a copy of those numbers onto refunds.

| `intentLabel` | HA (X) | FR (Y) | EU (Z) | Graph reading |
|---|---:|---:|---:|---|
| `ticket_status` | 0.32 | 0.14 | 0.22 | Own-ticket read |
| `list_tickets` | 0.30 | 0.16 | 0.20 | Own list read |
| `create_ticket` | 0.48 | 0.20 | 0.34 | New case; modest write |
| `account_lookup` | 0.34 | 0.18 | 0.20 | Own plan/seats read |
| `profile_update` | 0.55 | 0.32 | 0.22 | Allowed own contact write |
| `refund_request` | 0.70 | 0.74 | 0.36 | Deliberate money/credit; **high Y is correct** |
| `cancel_subscription` | 0.66 | 0.60 | 0.32 | Entitlement change |
| `support_escalation` | 0.42 | 0.18 | 0.55 | Hand-off; urgency on Z |
| `add_crm_note` | 0.50 | 0.24 | 0.20 | Append-only note |
| `ambiguous_crm_request` | 0.35 | 0.25 | 0.30 | Mid; draw abstain glyph when status says so |
| `non_crm_request` | 0.12 | 0.08 | 0.10 | Near origin (G12) |
| `prompt_injection_or_policy_bypass` | 0.15 | 0.88 | 0.28 | Low X, high Y — hostile harm potential |
| `refund_abuse` | 0.36 | 0.84 | 0.42 | Extractive refund-shaped act |
| `unauthorized_crm_overwrite` | 0.22 | 0.72 | 0.30 | Not-entitled write |
| `data_exfil_ticket_export` | 0.18 | 0.80 | 0.26 | Dump/export through support tools |
| `mistaken_agent` | 0.58 | 0.48 | 0.28 | Genuine user goal; wrong tool planned |

Unknown label → `ambiguous_crm_request` row.

These numbers are **not** gold labels, **not** a training target, and **not** evidence of production accuracy.

---

## 4. Optional nudges (v0.1 SHOULD, clamp after)

Same idea as Phase 0 §6.3. Field names stay. Phase 7 does **not** replace them with an embedding model.

| Condition | Nudge |
|---|---|
| Refund/credit `amountBucket` is `large_2000_9999` or `very_large_10000_plus` (or CS analog large-credit bucket when present) | FR += 0.06 |
| Pressure / panic lexicon on the utterance (feature flag, not raw text in the explanation) | EU += 0.08 |
| `source = ui` vs `agent` | **none** (twins share coordinates) |
| `status = abstained` | **none** on coordinates (glyph only) |
| Conflicting matched vs negative signals | **none** on coordinates; abstain instead |
| `mistaken_agent` plus a high-impact planned tool (`refund`, `cancel`, export, privileged write) | FR += 0.06 (still clamp) |

Nudges MUST NOT be used to invent a 17th label or a fourth axis.

---

## 5. Display jitter (not calculation)

Live founder chart already spreads stacked same-intent points in a ring so volume is visible:

```text
radius = min(0.14, 0.025 + 0.008 * sqrt(n))
```

Source: `spreadIntentPoints` in `lib/intent-matrix-points.ts`. **Renderer only.** Stored x/y/z stay the atlas/scorer point. Do not persist ring-spread.

---

## 6. Sample plotted CS/CRM events

Acceptance: a reviewer can find a genuine refund in the high-high quadrant and injection in the low-X high-Y quadrant without reading JSON.

| ID | Event | HA | FR | EU | `elahScore` (analyst only) | Reading |
|---|---|---:|---:|---:|---:|---|
| A | Genuine refund (policy will confirm) | 0.70 | 0.74 | 0.36 | — | Upper-right. High score **and** high FR is correct. |
| B | Prompt injection aiming at export/refund | 0.15 | 0.88 | 0.28 | — | Upper-left. Policy refuses; ELAH did not block. |
| C | Ambiguous short ask (abstain) | 0.35 | 0.25 | 0.30 | muted | Lower-mid. Hollow glyph. Do not treat score as decisive. |
| D | Ticket status | 0.32 | 0.14 | 0.22 | — | Low Y: read-only. |
| E | Ticket export / exfil | 0.18 | 0.80 | 0.26 | — | Low X, high Y: dump harm. |
| F | Support escalation | 0.42 | 0.18 | 0.55 | — | High Z: pressure, not money. |

### 6.1 2-D sketch (X = HA, Y = FR)

```
FR 1.0 |  B injection
    0.9|
    0.8|  E exfil     A refund
    0.7|
    0.6|
    0.5|
    0.4|        C abstain
    0.3|          F escalate
    0.2| D ticket
    0.1|
    0.0 +--------------------------------
        0.0   0.2   0.4   0.6   0.8   1.0  HA
```

### 6.2 Canonical JSON for A (plot this; score on snapshot only)

```json
{
  "eventId": "evt_01JCRMEXAMPLE0000000000001",
  "intentLabel": "refund_request",
  "coordinates": {
    "humanAgency": 0.70,
    "financialRisk": 0.74,
    "emotionalUrgency": 0.36
  }
}
```

`elahScore` MUST NOT appear on the event envelope. Analyst UI MAY join `ElahScoreSnapshot` by `eventId`. Customer chat MUST NOT include this object.

---

## 7. What this is not

| Claim | Status |
|---|---|
| Learned embedding → cube | **Out of scope.** Do not imply CatBoost, NB, or an SLM produced these x/y/z. |
| Banking gold v1.0 updated | **Forbidden.** Banking atlas stays Phase 0 §6.2. |
| Production accuracy | **Forbidden.** No holdout number in this document. |
| Live CRM scorer emits coordinates | The scorer does not emit coordinates. Founder `/banking/crm` maps snapshot labels through the approved display-only atlas in `lib/elah/cs-crm-coordinates.ts`; no CRM Neon columns were added. |

Banking producers still follow Phase 0 §6 (`calculateInitialCoordinates` / banking atlas). Do not run CS labels through the banking atlas.

---

## 8. Sign-off

| Role | Decision | Date | Notes |
|---|---|---|---|
| Founder | **Approve** | 17 September 2026 | Display-only 16-label atlas. Not learned. Not mixed into banking gold. |

Options: **Approve** / **Approve with comments** / **Reject**.

**Approval statement:** I agree CS/CRM coordinates for Phase 7 are the §3 display atlas plus optional §4 nudges, clamped to the unit cube; that jitter is renderer-only; and that this is not a learned embedding model and not a production accuracy claim.

---

*End of document.*
