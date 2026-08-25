# ELAH Human-Intention Score Semantics

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-SCORE-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-human-intention-score-semantics` |
| Depends on | `ELAH-SPEC-OUTPUT-001`, `ELAH-SPEC-CONFIDENCE-001` |

---

## 1. Purpose

`elahScore` is how genuine the request looks as **customer banking intent**. This document freezes **direction, bands, and analyst copy**. Confidence bands are a different axis (`ELAH_CONFIDENCE_SEMANTICS.md`).

ELAH still does **not** allow or block.

---

## 2. Frozen decisions

| ID | Decision |
|---|---|
| S1 | Scale `[0.00, 1.00]`, three decimals. Higher = more genuine banking intent. |
| S2 | Not P(fraud), not P(allow), not confidence. |
| S3 | Display bands (UI only): **Genuine** `≥ 0.75`, **Mixed** `[0.40, 0.75)`, **Off-intent** `< 0.40`. |
| S4 | Band words MUST NOT be API fields in v1. Tenant cuts belong to threshold-config. |
| S5 | Analyst action is **how to read the number**, not a banking decision. Tool path follows **policy**. |
| S6 | Injection samples sit in Off-intent (e.g. 0.08) even with high confidence. |
| S7 | Customer UI MUST NOT show `elahScore`. |

---

## 3. Bands → analyst copy

| Band | Range | List copy | Detail copy | Analyst does |
|---|---|---|---|---|
| Genuine | `≥ 0.75` | `0.87 · Genuine intent` | Looks like ordinary banking intent. | Read explanation; still honour confirmation. |
| Mixed | `[0.40, 0.75)` | `0.48 · Mixed intent` | Ambiguous or thin. | If also abstained, ignore as KPI. |
| Off-intent | `< 0.40` | `0.08 · Off-intent` | Off-intent, hostile, or non-banking. | Review with policy outcome; do not “ELAH blocked”. |

If `status = abstained`, **mute** the band word; show `Abstained` (confidence spec). Do not invent a fourth band.

---

## 4. Worked examples

| Sample | Score | Band | Note |
|---|---|---|---|
| P0 transfer | 0.87 | Genuine | High FR coordinate is OK |
| Statement | 0.81 | Genuine | Lower FR than a wire |
| Ambiguous (abstain) | 0.48 | Mixed, muted | Do not treat as decisive |
| Injection | 0.08 | Off-intent | High confidence that it is hostile |

---

## 5. Invalid readings

- “0.87 means allow” — policy confirms independently.
- “0.08 means ELAH denied” — injection guard / policy denied.
- Using score bands as confidence bands.

---

## 6. Sign-off

I agree `elahScore` direction and Genuine/Mixed/Off-intent copy for MVP analyst UI.

---

*End of document.*
