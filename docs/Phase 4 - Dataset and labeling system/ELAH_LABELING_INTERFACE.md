# ELAH labeling interface (security-admin)

| Field | Value |
|---|---|
| Document ID | ELAH-DATA-UI-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 26 August 2026 |
| Related tasks | Phase 4 manual labeling UI, IAA tracking |
| Depends on | `ELAH-SPEC-LABEL-TAXONOMY-001`, `ELAH-SPEC-EVENT-001` |
| Evidence | `app/(admin)/admin/elah-labeling/`, `app/actions/elah-labeling.ts`, `lib/elah/dataset/label-store.ts`, `lib/elah/dataset/iaa.ts` |

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Customer UI MUST NOT show `elahScore` or labels. Jane’s `/assistant` is unchanged. This interface is **security admin only**.

---

## 1. Purpose

Give the **security reviewer** a manual gold-labeling queue for Phase 4 dataset records: closed `ElahBankingIntent` labels, annotator confidence, contextual risk tags, review notes, and Human Agency / Financial Risk / Emotional Urgency coordinates.

This is **not** a customer page. It does not call `POST /v1/score`. It does not allow, block, or execute banking actions.

---

## 2. How to open as `security.admin`

1. Seed or reset the simulator so canonical demo logins exist.
2. Open `/login`.
3. Sign in as **`security.admin@elah.demo`** / **`DemoPass123!`**.
4. After login the security portal lands on `/admin/security-dashboard`.
5. In the sidebar, open **ELAH labeling** (`/admin/elah-labeling`).

The admin layout and both labeling pages call `requireSecurity()`. Other roles are redirected (`/login?error=forbidden`) and an `unauthorized_route_access` audit is written. That audit is an **ops** row, not an ElahEvent.

See labeling guidelines in the Phase 4 docs pack (taxonomy, tie-breaks, QA). This UI does not depend on a missing markdown file.

---

## 3. List — `/admin/elah-labeling`

Force-dynamic. Rows come from:

1. **Packs** at `data/phase4/v1.0/packs/*.jsonl` when those files exist (generator labels, overlaid with saved gold).
2. Otherwise **`data/phase4/gold-labels.json` plus hardcoded sample records** so the queue is not empty before pack generation.

Opening the list writes `elah_labeling_viewed` (ops, not an ElahEvent).

### 3.1 Table

Columns: `recordId`, pack, `intentLabel`, `annotatorConfidence`, hasNotes. Each row links to `/admin/elah-labeling/[recordId]`.

---

## 4. Detail — `/admin/elah-labeling/[recordId]`

- Event JSON (`JsonViewer`). Not a customer transcript UI.
- Gold-label form: closed intent select (`ELAH_BANKING_INTENTS` in `lib/elah/types.ts`), confidence `high` / `medium` / `low`, contextual risk tag checkboxes (`high_value`, `unusual_device`, `unusual_location`, `behavior_drift`, `accidental_error`, `excessive_permission`, `authz_boundary`, `exfiltration`, `conflict`), review notes (max 2000; reject `/\d{8,}/` as possible PII), coordinate inputs 0–1 step 0.001.
- Save writes `data/phase4/gold-labels.json` via server action `saveGoldLabel` (`requireSecurity()`). `annotatorId` is `role` + `hashUserId(session user id)` — not raw email.
- `elahScore` is **not** required on this form. Optional read-only `goldScore` is shown only when the pack/sample row already has one.
- Opening a detail page writes `elah_labeling_opened`. Saving writes `elah_gold_label_saved`.

---

## 5. Gold file

Path: **`data/phase4/gold-labels.json`**

```json
{
  "version": "1.0",
  "updatedAt": "2026-08-26T00:00:00.000Z",
  "labels": {
    "<scenarioId-or-eventId>": {
      "recordId": "...",
      "intentLabel": "external_transfer",
      "annotatorId": "security_reviewer:<hash>",
      "annotatorConfidence": "high",
      "contextualRiskTags": ["high_value"],
      "reviewNotes": "",
      "humanAgency": 0.72,
      "financialRisk": 0.78,
      "emotionalUrgency": 0.35,
      "labeledAt": "2026-08-26T12:00:00.000Z"
    }
  }
}
```

`intentLabel` must be in `ELAH_BANKING_INTENTS`. The store creates the file if missing.

---

## 6. IAA protocol

Inter-annotator agreement for the overlap set is **not** live-human kappa until both humans have labeled.

1. Founder and a second reviewer independently label the **same 30 overlap ids** in `data/phase4/iaa-overlap.json` (`scenarioId`, `annotatorA`, `annotatorB`).
2. Keep those 30 ids aligned with the overlap slice of the Phase 4 packs when packs exist.
3. Run the IAA script:

```bash
npx tsx scripts/compute-phase4-iaa.ts
```

(or `npm run dataset:iaa` once the parent adds that script)

4. The script prints a JSON report and writes **`data/phase4/iaa-report.json`**: `percentAgreement` (0–1), Cohen’s kappa for nominal labels, `n`, disagreements.

Pure math lives in `lib/elah/dataset/iaa.ts` (`cohenKappa`, `agreementReport`). Tests: `tests/elah/dataset-iaa.test.ts`.

### BLOCKED — live human kappa

**Live human kappa is BLOCKED** until founder + second reviewer have labeled those 30 overlap ids and the script has been re-run on their labels. The checked-in overlap file is a **fixture** so kappa is defined and not 1.0; it is not a claim of human agreement.

---

## 7. What needs a founder walkthrough

1. Log in as `security.admin@elah.demo`. Confirm **ELAH labeling** is in the sidebar. Jane’s `/assistant` still has no score and no labels.
2. Open the list. Confirm sample (or pack) rows, not customer UI.
3. Open a detail row. Confirm event JSON + form. Confirm there is **no required `elahScore`**.
4. Save a gold label. Confirm `data/phase4/gold-labels.json` updated and `annotatorId` is a hash, not an email.
5. State out loud: **ELAH never allows, blocks, or executes.** Labeling does not change a transfer.

---

## 8. Sign-off

I agree the security-admin labeling UI is list + detail + gold-file write as specified; that customer UI and Jane’s `/assistant` do not show `elahScore` or labels; that live human kappa is BLOCKED until the 30-id overlap protocol is run; and that ELAH never allows, blocks, or executes.

---

*End of document.*
