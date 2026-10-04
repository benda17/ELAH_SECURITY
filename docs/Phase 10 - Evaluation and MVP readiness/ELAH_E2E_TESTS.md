# ELAH end-to-end tests (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-E2E-001 |
| Version | **1.0** |
| Status | **Recorded** — CI + manual demo checklist |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-run-end-to-end-tests` |
| Command | `npm run test:phase10-eval` |

**Product freeze (unchanged):** Jane’s UI is score-free. Policy, not ELAH, allow / deny / confirm. Fail-open 250 ms.

---

## 1. Purpose

Record what “e2e” means for this demo MVP. There is **no Playwright suite** in this repo. Automated coverage is Vitest around scoring, fail-open, RBAC, and customer-route isolation. Browser paths stay a **manual** checklist (Phase 1 scenarios + demo scripts).

---

## 2. Automated (28 Sep 2026)

`npm run test:phase10-eval` — **9 files, 33 tests, all passed**.

Includes: score consistency, threshold separation, envelope isolation, customer-route `elahScore` grep, in-process load bound, fail-open timeout/503, trust boundary (scorer does not import `executeTool`), ScoreResponse contract, analyst RBAC.

Related existing suites (not re-run as a merge gate in this card, still in repo):

| Suite | Command / path |
|---|---|
| Phase 1 scenario fixtures | `tests/events/phase1-scenarios.test.ts` |
| Phase 5 baseline | `npm run test:phase5-baseline` |
| Phase 9 analyst | `npm run test:phase9-analyst` |
| Capture / envelope | `tests/events/` |

---

## 3. Manual golden path (demo)

| Path | Actor | Pass |
|---|---|---|
| Genuine transfer / refund | Jane or CRM customer | Bank/company **confirms**; ELAH scores; tool runs **because policy allowed** |
| Injection | Same | **Policy refuses**; ELAH scores low; **no** tool |
| Analyst card | `security.admin@elah.demo` | Score visible; Uncalibrated badge; no “ELAH blocked” copy |
| Jane dashboard / assistant | `basic.customer@elah.demo` | **No** `elahScore` |

If scoring is unavailable, **say fail-open**. That is an honest demo.

CRM venue: local `http://localhost:3003` / hosted CRM simulator. Banking encore: this app’s `/assistant` + `/admin/elah-events`.

---

## 4. Sign-off

I agree Phase 10 e2e is this CI pack plus the manual demo checklist; it is not a production browser farm.

---

*End of document.*
