# ELAH dashboard correctness (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-DASH-001 |
| Version | **1.0** |
| Status | **Recorded** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-validate-dashboard-correctness` |
| Tests | `npm run test:phase9-analyst`, `tests/elah/phase10-customer-ui.test.ts`, `tests/elah/score-read.test.ts` |

**Product freeze (unchanged):** Analyst views MAY show snapshots. Customer views MUST NOT show `elahScore`.

---

## 1. Surfaces

| Route | Who | Scores? |
|---|---|---|
| `/dashboard`, `/assistant`, other customer routes | Jane | **No** |
| `/admin/elah-events`, `/admin/elah-events/[eventId]` | security admin | **Yes** (snapshot, envelope stripped) |
| `/admin/elah-dashboard` | analyst | **Yes** (display bands only) |
| `/admin/elah-baseline` | analyst | Holdout metrics, not live customer PII |
| Founder `/banking/intent-matrix`, `/banking/crm` | founder app | Analyst cube; not Jane |

---

## 2. Correctness rules

1. List/detail scores come from `ElahScoreSnapshot` keyed by `eventId`, not from mutating the envelope.
2. `envelopeForDisplay` never includes `elahScore`.
3. Unavailable hops render as fail-open, not as a numeric 0.00 “bad person” score.
4. Empty/error states must not invent KPIs.
5. Thresholds change **bands**, not stored scores (`ELAH-P10-THR-001`).

---

## 3. Evidence (28 Sep 2026)

- Customer tree grep: no `elahScore` in `app/(customer)`.
- Analyst RBAC: customers 403.
- Score card vs envelope: `tests/elah/score-read.test.ts`.

Manual click-test after deploy remains a founder action (Jane window ≠ admin window).

---

## 4. Sign-off

I agree dashboard correctness is snapshot-on-analyst / nothing-on-Jane; this is not a claim that every hosted pixel was click-tested on 28 Sep 2026.

---

*End of document.*
