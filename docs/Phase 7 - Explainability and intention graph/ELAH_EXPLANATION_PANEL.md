# ELAH event explanation panel (analyst)

| Field | Value |
|---|---|
| Document ID | ELAH-P7-PANEL-001 |
| Version | **0.1** |
| Status | **Approved — Founder, 17 September 2026** |
| Date | 16 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-7-display-model-evidence`; `task-7-display-contributing-factors`; `task-7-display-reason-codes`; `task-7-display-alternative-interpretations`; `task-7-add-an-event-explanation-panel`; `task-7-add-model-version-information`; `task-7-add-raw-event-inspection-for-authorized-users` |
| Depends on | `ELAH-SPEC-OUTPUT-001`, `ELAH-SPEC-EXPLAIN-001`, `ELAH-SPEC-CONFIDENCE-001`, `ELAH-SPEC-SCORE-001`, `ELAH-BASE-RC-001`, `ELAH-WEDGE-FREEZE-001` |
| Canonical path | `docs/Phase 7 - Explainability and intention graph/ELAH_EXPLANATION_PANEL.md` |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores live in `ElahScoreSnapshot`, not the event envelope. Customer / support-user UI MUST NOT show `elahScore`. Analyst (founder) UI MAY show score. Fail-open 250 ms → `scoring_unavailable`, not a block.

This panel is **Layer C** of the intention visualization (`ELAH-P7-VIS-001`). It binds output-contract fields. It does **not** add CoT, hidden activations, or new `ScoreResponse` keys.

---

## 1. Purpose

MVP demos fail if the score is an opaque number (`ELAH-SPEC-EXPLAIN-001`). A CS/CRM ops analyst (first consumer) needs one panel that answers: **what intent, how genuine, how sure, which evidence, which scorer, what the envelope said** — without implying ELAH allowed or blocked the tool.

---

## 2. Who sees what

| Surface | Panel | `elahScore` | Raw event |
|---|---|---|---|
| Customer / support-user UI (`/support`, chat) | **Forbidden** | **MUST NOT** | **MUST NOT** (no score, no coordinates, no RC_*) |
| Analyst / founder UI | **Required** when a snapshot exists | **MAY** | **MAY** if authorized (§8) |
| Graph hover | Short caption | MAY (analyst only) | No raw utterance |

Authorized users for raw-event inspection: founder / `security.admin@elah.demo` (demo) / later tenant security-reviewer role. Not the end customer.

---

## 3. Panel fields (required when `status` is `scored` or `abstained`)

Join `ElahEvent` (envelope) to `ElahScoreSnapshot` on `eventId`. If no snapshot: show **Score unavailable** (fail-open copy). Do **not** invent a number.

| Block | Source | Analyst copy | Forbidden |
|---|---|---|---|
| **Intent** | `score.intentLabel` | Closed CS/CRM 16-label set (or banking 22 on the demo cube). Chip the string. | Ad-hoc labels; stretching `dispute_chargeback` onto refunds |
| **Score + band** | `elahScore` + `ELAH-SPEC-SCORE-001` | `0.87 · Genuine intent` / Mixed / Off-intent. If abstained: **mute** the band word; show `Abstained` | “Risk score”; customer-visible badge; fourth band |
| **Confidence** | `confidence` / `uncertainty` | `82%` (uncertainty 18%). High / Moderate / Low words are UI-only | Treating confidence as P(allow) |
| **Status** | `ScoreResponse.status` | `Scored` \| `Abstained` | “Failed”, “Blocked” |
| **Coordinates** | `score.coordinates` | HA / FR / EU, three decimals; link to cube selection | Fourth axis; persisted jitter |
| **Reason codes** | `policyHook.reasons` | `RC_*` chips (§6) | `allow` / `deny` / `block` as ELAH actions |
| **Matched signals** | `explanation.matchedSignals` | Why it looks like this intent | Raw utterance; PII |
| **Weak signals** | `explanation.weakSignals` | Why evidence is thin | Padding empty arrays with CoT |
| **Negative signals** | `explanation.negativeSignals` | Counter-evidence / injection pattern ids | Hidden chain-of-thought |
| **Summary** | optional `explanation.summary` ≤ 240 chars | One sentence **reproducible from the three lists** | Names, ticket bodies, account numbers |
| **Policy context** | `event.policy.decision` | Company allow / deny / confirm — labeled **company policy** | “ELAH denied” |
| **Hook** | `policyHook.recommendation` | `none` / `watch` / `review` / `step_up_hint` only | `allow` / `deny` / `confirm` on the hook |
| **Provenance** | `score.provenance` | §7 | Secrets; claiming CatBoost is live when `scorer` is rules |

### 3.1 Separate action evidence (17 Sep 2026 research overlay)

The selected-point panel has three visibly separate blocks:

1. **Intent assessment — why aligned/misaligned:** existing 16-label `intentLabel`, score, confidence, reasons, and scorer.
2. **Action evidence — what happened:** platform-native action/tool; `normalizedActionId`; normalized name; action class; typical impact; mapping status and reason.
3. **Company policy — separate decision:** allow / deny / needs-confirmation from the tenant event.

Metadata mapping takes precedence over the historical fallback and is labeled `metadata`. Reviewed tool fallback is labeled `fallback`. Missing taxonomy coverage is labeled `unmapped` with a reason. In particular, `request_refund` remains unmapped because the supplied 249-action PDF has no normalized refund action ID.

Action impact copy MUST say **ontology impact** or **typical action impact**. Never render `Critical` as “ELAH blocked,” “deny,” or an enforcement result. Action class/impact remain panel fields or overlays, not graph axes.

Abstain banner (required), CS wording:

**Title:** `ELAH abstained`

**Body:** `Confidence is too low to treat this intention score as decisive. Company policy still governs whether the tool runs. Queue for review; do not allow or block from this number.`

Fail-open banner:

**Title:** `Score unavailable`

**Body:** `ELAH did not respond in time. The assistant continued under company policy only. No intention score to review.`

Uncalibrated chip when `provenance.scorer` is `rules_v0`, `cs_crm_rules_v0`, `rules_stub_v0`, or `intent_matrix` without a calibration note: **Uncalibrated (rules)**.

---

## 4. Display model evidence

**Evidence** is the structured explanation object plus reason codes. That is the whole of “model evidence” for v0.1.

| Show | Do not show |
|---|---|
| `matchedSignals` / `weakSignals` / `negativeSignals` | Token attributions, attention maps, tree dumps, logits |
| `RC_*` in `policyHook.reasons` | Free-text “because I thought…” |
| Pattern ids (e.g. `ignore_previous_instructions`) | Full system prompt; raw ticket text |
| Optional summary ≤ 240 chars | A second summary that is not a function of the lists |

At least one matched **or** negative signal SHOULD be present on every scored P0 CS demo (genuine refund, mistaken CRM write, injection), same quality bar as Phase 0 §4.

Red-team must not be able to dump a system prompt via explanation fields (`ELAH-SPEC-EXPLAIN-001`).

---

## 5. Display contributing factors

**Contributing factors** = the same signal lists, grouped for reading. Not a new API array.

| Group | Typical contents |
|---|---|
| For this intent | `matchedSignals` (e.g. `planned_tool:issue_refund`, `refund_or_credit_verb`) |
| Thin evidence | `weakSignals` (short message, no tool, missing amount) |
| Against / hostile | `negativeSignals` (injection lexicon, cross-tenant export tokens) |
| Hook attention | `policyHook.reasons` (why watch/review/step_up_hint) |

Feature names MAY appear as `snake_case` or `prefix:value`. They MUST NOT appear as new keys on `ScoreResponse` (`ELAH-BASE-FEAT-001`).

Do not list H/B/S 5-vector components (G8).

---

## 6. Display reason codes

Codes live in **`policyHook.reasons`** only (`ELAH-BASE-RC-001`). Phase 7 does **not** add `reasonCodes`.

| Rule | Value |
|---|---|
| Token | Starts with `RC_` |
| Render | Chips, catalog order, de-duped |
| Empty | Allowed when `recommendation` is `none` |
| Banking catalog | Phase 5 list remains valid on the **banking demo** |
| CS/CRM | Same field. Emit domain-true codes (injection, abstain, high FR, tool planned). Do **not** mint `RC_ALLOW` / `RC_DENY`. Do **not** claim a second catalog is production until a CS reason-code memo is Approved |

Forbidden strings as codes or hook values: `allow`, `deny`, `block`, `confirm`, `execute`, `RC_ALLOW`, `RC_DENY`, `ELAH_BLOCK`, … (`ELAH-BASE-RC-001` §5).

UI MUST NOT say “deny because RC_*.” Escalation language is **review / do not treat as decisive**.

---

## 7. Add model-version information (provenance)

From `ElahScore.provenance` (`ELAH-SPEC-OUTPUT-001` §5.7):

| Field | Analyst line |
|---|---|
| `scorer` | `rules_v0` / `cs_crm_rules_v0` / `rules_stub_v0` / `intent_matrix` / `model` / `hybrid` / `manual` |
| `modelVersion` | Semver or date tag when `scorer` is `model` or `hybrid`; show **`null`** as `—` for rules-only. Do not invent `catboost_v0` on the CRM path |
| `labelSource` | How a training row would be tagged; MAY differ from `scorer` |

Copy: `Scorer cs_crm_rules_v0 · modelVersion — · Uncalibrated (rules).`

Offline CatBoost / naive Bayes eval heads are **not** this panel unless `provenance.scorer` actually says so. Live CRM as of Phase 16: in-process rules stub; remote 250 ms client may still be stubbed — say that honestly when `scoring_unavailable`.

---

## 8. Raw-event inspection (authorized founder / analyst)

**Add raw-event inspection for authorized users:** a folded section, default **collapsed**.

| MAY show | MUST NOT show |
|---|---|
| `eventId`, `occurredAt`, `appId`, `source`, `actionType`, `outcome` | `elahScore` on the envelope (it is not there) |
| `conversationId`, `messageId` (ids only) | Customer email, raw ticket body, unredacted `toolArgs` |
| Sanitized `toolName` + redacted args (event schema S7) | Other tenants’ tickets; Neon connection strings |
| Company `policy.decision` | Buttons labeled **ELAH Allow** / **ELAH Block** |
| Link to snapshot JSON (score object) | CoT, activations, prompt dump |

Demo: `security.admin@elah.demo`. Support-user session MUST NOT reach this fold.

---

## 9. Alternative interpretations (no extra model field)

Output contract O9: explanation is **only** the three signal lists + optional summary. Phase 7 MUST NOT add `alternatives[]` or a CoT ranking.

**Display alternative interpretations** from **existing** structured disagreement:

| Source | Panel line | Label as |
|---|---|---|
| Planner `detectedIntent` ≠ `score.intentLabel` | “Planner: {detected}. ELAH: {intentLabel}.” | Disagreement, not a second score |
| `negativeSignals` naming another family | “Counter-signal: {id}.” | Evidence against the chosen label |
| `mistaken_agent` | “User goal looks like {nearby genuine family}; planned tool does not.” only if those ids are in the signal lists | Do not guess the family |
| Taxonomy neighbour list | Static 16-label legend | **“Taxonomy, not a model ranking”** |

If none of the above exist, show **“No structured alternative.”** Do **not** generate “the model also considered refund_abuse (0.41).”

---

## 10. Concise evidence-based copy

Prefer chips + one summary sentence over paragraphs. Summary, if present, MUST be reproducible from the three lists (`ELAH-P7-FAITH-001`).

**Say:** “ELAH scored genuine support/CRM intent before the tool. Company policy confirm. The customer does not see this number.”

**Never say:** “ELAH blocked the refund.” / “ELAH allowed the CRM update.” / “Accuracy is the banking holdout.”

No **ELAH Allow** / **ELAH Deny** buttons on this panel.

---

## 11. Sign-off

| Role | Decision | Date | Notes |
|---|---|---|---|
| Founder | **Approve** | 17 September 2026 | Analyst panel from snapshot fields; no CoT; no customer-visible score; no ELAH allow/deny. |

Options: **Approve** / **Approve with comments** / **Reject**.

**Approval statement:** I agree the explanation panel is analyst-only, binds output-contract evidence and `RC_*` reasons, shows scorer/`modelVersion`, allows raw-event inspection for authorized users with sanitized args, displays alternatives only from structured disagreement, and never lets ELAH allow, block, or execute.

---

*End of document.*
