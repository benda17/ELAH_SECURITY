# ELAH CRM/SaaS human-actions research mapping

| Field | Value |
|---|---|
| Document ID | ELAH-WEDGE-RESEARCH-001 |
| Version | **0.1** |
| Status | **Research input / Proposed mapping** |
| Source date | **17 September 2026** |
| Classification | Internal — ELAH Security |
| Related tasks | `task-16-define-support-tool-taxonomy-and-intent-labels` · `task-16-plan-gold-dataset-for-support-events` |
| Source | `ELAH_CRM_SaaS_Human_Actions_Research.pdf`, supplied 17 September 2026 |
| Canonical path | `docs/Phase 16 - B2B SaaS CS CRM wedge/ELAH_CRM_SAAS_HUMAN_ACTIONS_RESEARCH.md` |

This note records how the supplied research informs Phase 16. It is not evidence of customer demand, completed interviews, production accuracy, or founder approval of every normalized-action mapping.

**Product boundary (unchanged):** ELAH scores genuine intent before tools. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores live in `ElahScoreSnapshot`, not the event envelope, and customer UI never shows a score.

---

## 1. Research scope

The source defines a starting action ontology with:

- **249 normalized human actions**
- **9 operational domains**
- **28 critical-impact actions**

An action states **what happened**. Impact is contextual: a critical action can be legitimate, and a read can be sensitive because of object or scope.

The nine domains are:

1. Identity, access and workspace (`ID`)
2. CRM customer, account and relationship (`CRM`)
3. Revenue, pipeline and sales work (`REV`)
4. Customer support, ticketing and knowledge (`SUP`)
5. Customer success, adoption and retention (`CS`)
6. SaaS management, license and application lifecycle (`SMP`)
7. Advertising, social and campaign management (`ADS`)
8. Analytics, reporting and dashboards (`ANA`)
9. Automation, integration, data governance and communication (`AUT`)

The ontology spans more than the Phase 16 CS/CRM wedge. A vendor-specific action must be retained separately and mapped only when an exact supported normalized action exists.

---

## 2. Action is not intent

Phase 16 uses two distinct labels:

- `normalizedActionId`: the research ontology ID for **what happened**, such as `SUP-18` (`escalate_ticket`) or `CRM-14` (`assign_owner`).
- `intentLabel`: one of the existing closed 16 `ElahCrmIntent` labels for **why the request or planned tool appears aligned or misaligned**.

The 249 actions do **not** replace the 16 intent labels and are not 249 new intents. The same normalized action can pair with different intent labels when authority, evidence, scope, or sequence changes. Conversely, one intent family may lead to different normalized actions.

Do not infer an action ID from a similar verb. If the source has no exact normalized action, set `normalizedActionId` to `null`/unmapped, preserve the platform-native action, and open a reviewed mapping proposal.

### Confirmed refund gap

The source discusses refund scenarios and fields, but its 249-row normalized action tables contain **no normalized refund action ID**. Phase 16 must therefore not invent `CRM-*`, `SUP-*`, or another action ID for `request_refund`. Until the ontology is explicitly revised, retain the native tool/action name and use an unmapped/null `normalizedActionId`; the separate `refund_request` or `refund_abuse` intent label may still apply.

---

## 3. Context required for training

An action verb alone is insufficient. Each training example should capture:

| Context | Training purpose |
|---|---|
| Actor / authority | Role, tenant, permissions, and whether the actor is authorized for this action. |
| Object / scope | Object type and hashed ID, selected count, tenant/account, and expected fan-out. |
| Before / after | Direction and magnitude of the actual state change. |
| Intent evidence | Approved request, ticket, customer message, work item, report, alert, or other reason the action is plausible. |
| Sequence | Ordered prior and subsequent events that support or contradict the action. |
| External effect | Customer messaging, data sharing, spend, access, deletion, publishing, or downstream automation. |
| Result | Success, rejected, pending approval, failed, or rolled back. |

Also retain `actionClass`, impact, sensitivity, reversibility, platform family/name, and the platform-native action. Hash identities and object IDs; sanitize parameters; preserve tenant/session boundaries and event order; distinguish human from automated actions.

These are training-record or snapshot context fields. They do not add a score to the event envelope.

---

## 4. Training-schema implications

For a Phase 16 labeled row:

1. Keep the event envelope score-free.
2. Record the native tool/action as observed.
3. Add `normalizedActionId` only from the supplied ontology, with its normalized name/class where needed.
4. Add exactly one closed-set `intentLabel` from `cs_crm_taxonomy` 0.1.
5. Add the contextual fields above in structured, privacy-preserving form.
6. Keep policy result separate from both labels. Policy allow/deny/confirm is not an ELAH prediction.
7. Group sequences and counterfactual twins so related rows cannot leak across train/validation/holdout.

High-impact actions should have richer authority, approval, scope, external-effect, and auditability context. Reads must still model sensitivity and scope. Workflow/configuration actions must capture trigger, conditions, downstream fan-out, and activation state.

---

## 5. Proposed mapping workflow

1. Observe a platform-native human action.
2. Find an exact source-ontology match by semantics, object, and state transition.
3. If exact, record that source ID as `normalizedActionId`.
4. If absent or ambiguous, leave it unmapped; do not fabricate an ID.
5. Independently label intent using the closed 16-label Phase 16 taxonomy.
6. Human-review proposed vendor mappings before treating them as canonical.

This workflow is Proposed. The supplied PDF is a research input, not proof that every action exists in every vendor/product plan or that any customer accepts these mappings.

---

## 6. Evidence still required

- Founder approval of the proposed Phase 16 mapping rules.
- Human review of vendor-native → normalized-action mappings.
- Customer interviews establishing whether this two-label view is useful in actual CS/CRM operations.
- Human labeling and IAA for any labeled simulator corpus.
- Independent model evaluation before any production-accuracy claim.
- An explicit ontology revision if a normalized refund action ID is desired.

---

*End of document.*
