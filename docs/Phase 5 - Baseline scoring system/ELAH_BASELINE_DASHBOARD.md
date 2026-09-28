# ELAH Baseline Dashboard

| Field | Value |
|---|---|
| Document ID | ELAH-BASE-UI-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-5-display-baseline-outputs-in-the-dashboard` |
| Depends on | `ELAH-SPEC-OUTPUT-001`, `ELAH-SPEC-CONFIDENCE-001`, `ELAH-SPEC-SCORE-001`, `ELAH-SPEC-EXPLAIN-001`, `ELAH-BASE-RULES-001`, `ELAH-BASE-RC-001`, `ELAH-BASE-EVAL-001` |
| Code | `app/(admin)/admin/elah-events/`, `app/(admin)/admin/elah-baseline/` (security-admin only); read path `lib/elah/score-read.ts` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model.

---

## 1. Purpose

Freeze **where** Phase 5 baseline outputs appear for the security admin, and **what** must be on screen.

This is **not** a customer page. Jane’s `/assistant`, `/transfer`, and any customer portal MUST remain score-free (C11, S7). Manager UI is not this surface.

---

## 2. Who can see it

| Actor | Access |
|---|---|
| `security.admin@elah.demo` | **Yes** — `requireSecurity()` admin layout |
| Jane / premium / vip customers | **No** |
| `manager@elah.demo` | **No** (ops logs only, existing manager portal) |

Demo: sign in as `security.admin@elah.demo` / `DemoPass123!`.

---

## 3. Surface A — event score card

Path: `/admin/elah-events/[eventId]`

Phase 3 already mounts an **ELAH score (`rules_v0`)** card from `AgentEventLog` snapshots (`lib/elah/score-read.ts`). Scores are **not** merged onto envelope JSON (`envelopeForDisplay` strips score keys).

Phase 5 **adds / hardens** on that card (same route; no new customer route):

| Element | Required copy / behavior |
|---|---|
| Title | Intention reading only. Not allow / deny / confirm / execute. |
| **Uncalibrated (rules)** badge | Always when `provenance.scorer = rules_v0` (C10). Tooltip: “Rules baseline. Not reliability-calibrated. Model calibration is a later release.” |
| Status | `scored` \| `abstained` \| `unavailable` (`scoring_unavailable` is **not** abstention — C9) |
| `elahScore` | `[0,1]`, three decimals; Genuine / Mixed / Off-intent **words** are display-only (S3). Mute the band word when abstained. |
| Confidence / uncertainty | Complementary; show both on detail. Independent of `elahScore`. |
| Abstain banner | Title **ELAH abstained**. Body from confidence spec §8.3: confidence too low to treat the number as decisive; bank policy still governs the tool; queue for review; **do not** allow or block from this number. |
| Coordinates | `humanAgency`, `financialRisk`, `emotionalUrgency` — explain, not a second score |
| Explanation | `matchedSignals` / `weakSignals` / `negativeSignals` / optional `summary` |
| `policyHook.recommendation` | `none` \| `watch` \| `review` \| `step_up_hint` only |
| `policyHook.reasons` | Render `RC_*` as chips (`ELAH-BASE-RC-001`) |
| Provenance | `rules_v0`, `modelVersion: null` |
| Envelope JSON | Still **without** `elahScore` |

**Forbidden on this card:** buttons or labels “ELAH Allow”, “ELAH Block”, “Deny transfer”. Do not say “ELAH blocked this transfer.”

List route `/admin/elah-events` MAY show a compact badge: `{elahScore} · {confidence band or Abstained} · Uncalibrated (rules)` (confidence spec §8.1). Missing snapshot → `Score unavailable`.

---

## 4. Surface B — baseline eval dashboard

Path: `/admin/elah-baseline`

Security-admin only. Sidebar MAY link it next to ELAH events / labeling. It is a **founder/analyst** page for the holdout bar, not a SOC queue and not a customer report.

| Block | Content |
|---|---|
| Header | “ELAH baseline (`rules_v0`) — uncalibrated. Not a trained model. ELAH never allows, blocks, or executes.” |
| Uncalibrated badge | Same chip as the event card, page-level |
| Holdout pointer | Phase 4 v1.0, `n=100`, `data/phase4/v1.0/splits/holdout.jsonl` |
| Metrics table | Intent accuracy, P/R, FP, FN, ECE, latency p50/p95 — **from** `data/phase5/v1.0/eval-report.json` (numbers in `ELAH-BASE-EVAL-001` §10) |
| Empty / missing report | If the JSON is absent, show **TBD / eval not yet run**. Do not invent percentages. Point at `npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/evaluate-phase5-baseline.ts` |
| FP / FN definitions | One-line: high FR on a genuine wire is **not** FP; FN = injection gold predicted as P0 money-move |
| Reason-code legend | Catalog subset + counts if the report includes a histogram |
| Limitations | Link [ELAH_BASELINE_LIMITATIONS.md](./ELAH_BASELINE_LIMITATIONS.md) |
| How to score live | Link `/admin/elah-events` — this page does not execute tools |

Do not plot gold labels as if they were live scores. Do not offer a “run eval” button that mutates the bank database.

---

## 5. What Jane must not see

| Must not appear on customer UI |
|---|
| `elahScore`, confidence, uncertainty, abstention |
| Coordinates, explanation signals, `policyHook`, `RC_*` |
| Uncalibrated badge, eval metrics, holdout ids |
| Any sentence that ELAH allowed, blocked, or confirmed |

The assistant continues under **bank policy** only.

---

## 6. Demo checklist

1. `security.admin@elah.demo` / `DemoPass123!` → `/admin/elah-events`.
2. Open an event that has a snapshot → score card + **Uncalibrated (rules)** + `RC_*` reasons.
3. Open `/admin/elah-baseline` → metrics or TBD empty state; freeze paragraph visible.
4. Sign in as Jane → `/assistant` → **no** score chrome.
5. Confirmed transfer: high intention, `watch` or `step_up_hint`, bank still confirmed.
6. Injection: low intention, `review`, policy refused, no tool.

---

## 7. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security / analyst UX |  |  |  |

**Approval statement:** I agree baseline outputs appear on `/admin/elah-events/[eventId]` and `/admin/elah-baseline` for security admin only; that `rules_v0` is badged Uncalibrated (rules); that this is not a customer page; that Jane never sees `elahScore`; and that ELAH still never allows, blocks, or executes.

---

*End of document.*
