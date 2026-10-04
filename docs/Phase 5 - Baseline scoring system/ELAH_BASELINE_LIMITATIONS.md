# ELAH Baseline Limitations

| Field | Value |
|---|---|
| Document ID | ELAH-BASE-LIMIT-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-5-document-baseline-limitations` |
| Depends on | `ELAH-BASE-RULES-001`, `ELAH-BASE-FEAT-001`, `ELAH-BASE-EVAL-001`, `ELAH-SPEC-CONFIDENCE-001`, `ELAH-DATA-IAA-PACKET-001` |
| Code | `lib/elah/baseline/` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model.

---

## 1. Purpose

State what Phase 5 **cannot** claim. This is the honest gap list for founders, analysts, and Phase 6 model work. The baseline is a measurable, explainable bar — not a production risk engine.

---

## 2. Single-event scoring

`rules_v0` sees **one** `ElahEvent`. It cannot reconstruct:

- velocity or spend-over-time
- retry / confirm loops
- session duration or hop graphs
- earlier steps in a `sequenceId` chain
- a live “this is unusual for this person” profile

Admin correlated hops are operational context for humans. They are not inputs to the scorer. Multi-step gold packs are scored **step by step**, independently.

---

## 3. Synthetic gold, not live κ

Holdout v1.0 is **synthetic** (`phase4_gen_v1`, seed `20260826`). Annotator id on generated rows is not two independent humans.

Phase 4 overlap fixture reports Cohen’s κ on a **30-id packet** — useful as a protocol check, **not** as live dual-annotator agreement on the 100-row holdout.

Blinded holdout intent accuracy is **0.79** (`data/phase5/v1.0/eval-report.json`, `blindedDetectedIntent: true`). That measures actionType / tool / utterance / policy features without the generator’s `detectedIntent` hint. It is **not** human-validated production quality. Do not quote it as model performance.

Injection recall is **0.59** on 22 gold injection rows: several compromised-tool / authz / exfil examples look like a normal planned tool once the hint is removed. The FN hook (injection gold predicted as P0 money-move) is **1/100** (`azb-0005` → `external_transfer`). Legitimate-as-injection FP is **0**.

---

## 4. Uncalibrated

`provenance.scorer = rules_v0`. Confidence is **strength of evidence**, not a reliability diagram you can bank on (`ELAH-SPEC-CONFIDENCE-001` C10).

ECE is **measured** on holdout (`ELAH-BASE-EVAL-001`) and MUST be shown as uncalibrated. Do not temperature-scale in Phase 5 and call it a model. Do not drop the Uncalibrated (rules) badge because ECE looked small on synthetic data.

---

## 5. No profile store

The envelope has `userIdHash`, optional `customerTier`, optional `client.ipAddress` / `userAgent`. There is no device inventory, no home location, no beneficiary graph, no historical amount distribution.

Gold tags `unusual_device`, `unusual_location`, `behavior_drift` are **annotator tags** (`ELAH-DATA-CTX-001`). The live scorer MUST NOT treat missing `client` as an attack. Building a profile store is out of Phase 5 and would still not be an ELAH allow/deny.

---

## 6. UI / agent twins scored independently

Phase 4 twins share `twinGroupId` and have **distinct** `eventId`s (UI vs agent of the same act). `POST /v1/score` does not join twins. Two scores for the same human act can differ in `source`, `toolName`, and therefore in features.

Eval MAY report twin disagreement as a diagnostic. It MUST NOT average twins into one `elahScore` on the envelope.

---

## 7. Product-freeze gaps (by design)

These are **not** bugs to “fix” in the baseline:

| Gap | Why it stays |
|---|---|
| No ATM product | Out of MVP; do not add `atm_withdrawal` intent or tool |
| No beneficiary-write product | Recipients are read-derived; `first_payee` is a gold tag |
| No `device_change` action | Unusual device is a tag + optional userAgent |
| Scores not on `ElahEvent` | Output contract / S10 |
| Jane never sees `elahScore` | C11 / S7 |
| No Prisma schema push for scores | Persist snapshots as today (`AgentEventLog` metadata), not envelope columns |
| Closed 22 labels | No 23rd intent; accidental error stays a tag |
| ELAH never allow / block / execute | Bank policy remains the authority |

A “limitation” that would violate the freeze is **out of scope**, not a Phase 6 feature request.

---

## 8. Adapter and fixture drift

Phase 3 mock-scorer fixtures (`ELAH-SVC-MOCK-001`) are demo anchors. Phase 5 feature composition may move the third decimal. If adapter and `lib/elah/baseline/` ever disagree, **baseline wins** and tests must be updated together. Silent dual tables are a defect.

Idempotency is `requestId` + `eventId` + `mode`, not “same utterance forever.”

---

## 9. What Phase 6 should beat

The trained model must beat **this** holdout bar (intent accuracy, injection FN, legitimate FP) without violating the output contract or the freeze. Beating ECE without remaining honest about calibration is not a win. Beating FP by scoring all wires as injection is not a win.

---

## 10. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree the Phase 5 baseline is single-event, synthetic-gold, uncalibrated `rules_v0` with no live profile store and independent twin scoring; that product-freeze gaps stay; and that ELAH still never allows, blocks, or executes.

---

*End of document.*
