# ELAH MVP limitations (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-LIM-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-document-known-limitations` |
| Reuses | `ELAH-BASE-LIMIT-001`, `ELAH-MDL-LIM-001` |

**Product freeze (unchanged):** `rules_v0` is uncalibrated and not a trained model. No production claim.

---

## 1. Purpose

One list for Phase 10 so a demo guest is not told a fairy tale. Details stay in Phase 5/6 memos.

---

## 2. Limitations (still true)

| Gap | Honest line |
|---|---|
| Single-event scorer | No velocity, no person-profile, no hop graph in the model |
| Synthetic gold | Holdout is generated; live dual-annotator κ is **not** this number |
| Uncalibrated | ECE 0.153 is measured, not a reliability diagram you can bank |
| Injection recall 0.59 | Compromised-tool rows look like planned tools without the hint |
| Live vs offline | CatBoost 0.90 is **offline**; live is `rules_v0` 0.79 |
| No HTTP load | In-process µs ≠ Vercel p95 |
| No pentest | Unit trust-boundary ≠ Phase 8 |
| No interviews | Zero usability notes |
| No customer | No ARR, no design partner, no DPA |
| CS/CRM vs banking | Different gold, different first buyer; do not mix metrics |
| Fail-open | Unavailable scoring never becomes a block |
| Product fence | No ATM, no beneficiary-write, no `device_change` |

---

## 3. Sign-off

I agree these limitations remain; Phase 10 does not erase them with a readiness report.

---

*End of document.*
