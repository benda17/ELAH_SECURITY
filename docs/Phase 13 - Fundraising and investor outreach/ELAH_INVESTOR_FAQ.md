# ELAH Investor FAQ

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-FAQ-001 |
| Version | **0.1** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security (fundraising pack) |
| Owner | Founder |
| Rule | Answer only what we already know. Blank rows in §2 are for **live** questions. Do not pre-fill them. |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model.

---

## 1. Seed answers (known)

### Is ELAH transaction monitoring / a fraud engine?

No. `elahScore` is how genuine the request looks as **customer banking intent**. It is not P(fraud), not P(allow), and not confidence. A legitimate external transfer **should** score as genuine intent with **high Financial Risk**. That is correct coordinate behavior, not a false positive. We do not claim “we block fraud.”

### Is ELAH a policy engine?

No. Bank policy (simulator: `lib/agent/policy.ts`) **allows, denies, and confirms**. ELAH **scores and explains**. `policyHook.recommendation` is only `none` / `watch` / `review` / `step_up_hint`. A low score does not cancel an allowed tool. A high score does not execute a denied tool.

### Does the customer see the score?

No. Jane’s `/assistant` (and the rest of customer UI) MUST NOT show `elahScore`, confidence, coordinates, reason codes, or the uncalibrated badge. Analyst surface is `/admin/elah-events` as `security.admin@elah.demo`.

### Is `rules_v0` a trained model?

No. It is a deterministic feature → rules baseline. Provenance: `scorer = rules_v0`, `modelVersion = null`. Analyst UI shows **Uncalibrated (rules)**. Phase 6 is the first trained scorer, and it must beat this baseline on the same blinded holdout.

### Why not quote 1.00 accuracy?

That figure was **hint-echo**: the scorer seeing gold `detectedIntent`. The number we quote is **blinded** holdout intent accuracy **0.79** (`data/phase5/v1.0/eval-report.json`, `blindedDetectedIntent: true`). Do not use 1.00 in a pitch.

### What are the blinded holdout numbers?

Gold: Phase 4 v1.0, holdout **n=100**, seed **20260826**, synthetic.

| Metric | Value |
|---|---|
| Intent accuracy | **0.79** |
| Legitimate-as-injection FP | **0** |
| FN (injection gold predicted as P0 money-move) | **1** (`azb-0005`) |
| Injection recall | **0.59** (22 gold injection rows) |
| ECE | **0.153** (uncalibrated) |

Injection recall 0.59 is a **real gap**: several compromised-tool / authz / exfil rows look like a normal planned tool once the generator hint is removed. We say that out loud.

### Is the gold dataset live bank data?

No. It is **synthetic** (`phase4_gen_v1`), **571** rows. Live two-person Cohen’s κ on the overlap packet is **not** yet a result. Fixture κ is a tracker test, not taxonomy-usability evidence.

### Do you have a production bank / ARR / named design partner?

No. The MVP venue is the **live banking simulator**. Pilot acquisition is a later phase. This pack does not invent banks, LOIs, or ARR.

### What is the raise?

**$400K** pre-seed / angel-pre-seed / **12 months**, **founder-approved working ask** (`FIRST_ROUND_PLAN`, 26 August 2026). Not closed; instrument not invented here. Year-1 plan revenue is **$0**. Dashboard 12-month **goal** is a first client **demo or development** install — not a named bank and not production. Eight `USE_OF_FUNDS` buckets sum to $400K (Backend/AI $160K is the largest). Capital does not buy an ELAH allow/deny engine or ATM / `device_change` / beneficiary-write.

### Who allow/denies a transfer in the demo?

The **bank**. Jane confirms because policy said `needs_confirmation`. Injection is refused because policy said deny. ELAH stored a score on both paths.

### What happens if scoring is down?

**Fail-open.** Timeout / 5xx → `elah_scoring_unavailable`; banking continues on policy. We do not invent a score. 4xx is a producer defect: still no fake `ElahScore`.

### Why is Financial Risk high on a good customer?

Financial Risk is harm **if the requested tool ran**, not “this person is a fraudster.” Genuine wires sit high on Y. Injection that *asks* for a transfer can also sit high on Y with **low** Human Agency.

### Will you add ATM, device-change, or beneficiary-write?

Not in this product freeze. Unusual device/location exist as **gold tags**, not as a `device_change` product event.

### Is colocating `POST /v1/score` on the same Next.js deploy a cheat?

No. Phase 0 ownership allows colocation until a second client, GPU, or p95 pressure. Logical split, Bearer auth, OpenAPI, and fail-open are frozen so the service can extract later. It is still not a second policy engine.

### Can we see Jane’s score if we inspect the network tab?

The product rule is **customer UI must not show it**. Scores live on analyst snapshots (`AgentEventLog` metadata), not on the `ElahEvent` envelope. Do not add a Jane widget “for the demo.”

---

## 2. Live meeting questions

Fill **after** a real conversation. Do not invent rows. Do not paste VC quotes.

| Date | Who | Firm | Question (verbatim enough) | Answer given / follow-up |
|---|---|---|---|---|
| | | | | |

---

*End of document.*
