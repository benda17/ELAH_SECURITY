# ELAH threshold separation (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-THR-001 |
| Version | **1.0** |
| Status | **Recorded** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-validate-threshold-separation` |
| Code | `lib/elah/analyst/bands.ts`, `lib/elah/analyst/thresholds.ts` |
| Test | `tests/elah/phase10-threshold-separation.test.ts` |
| Spec | `ELAH-SPEC-THRESHOLDS-001` |

**Product freeze (unchanged):** Tenant thresholds never allow, block, or execute. They never mutate stored `elahScore`.

---

## 1. Rule

Analyst `reviewBelow` / `watchBelow` are **display / triage** cuts. They:

- MUST NOT be passed into `scoreElahEvent` / `POST /v1/score`
- MUST NOT rewrite snapshots
- MUST only change `bandForScore` labels (`review` / `watch` / `clear`)

`elahNeverEnforces` remains true.

---

## 2. Evidence (28 Sep 2026)

Tightening display cuts from `{0.4, 0.7}` to `{0.9, 0.95}` moves a 0.87 transfer from **clear** to **review**. Re-scoring the same envelope still returns **0.87** and the same `intentLabel`.

RBAC: only `analyst:configure_thresholds` (security reviewer) may persist new cuts.

---

## 3. Sign-off

I agree changing tenant display thresholds does not mutate `elahScore`.

---

*End of document.*
