# ELAH Phase 4 Dataset Versioning

| Field | Value |
|---|---|
| Document ID | ELAH-DATA-VER-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 26 August 2026 |
| Related | `ELAH_SYNTHETIC_SCENARIOS.md`, `docs/ELAH_LABEL_TAXONOMY.md` |
| Code | `lib/elah/dataset/{generate,split,leakage,provenance}.ts` |
| Manifest | `data/phase4/v1.0/manifest.json` |

**Product freeze:** ELAH never allows, blocks, or executes. Dataset versions are labeling artifacts, not policy engines.

---

## 1. Purpose

Freeze how a Phase 4 cut is identified, stored, split, and restored so later baseline/model work can cite **`v1.0`** without silent drift.

---

## 2. Manifest

`data/phase4/v1.0/manifest.json` records:

| Field | Meaning |
|---|---|
| `datasetVersion` | `v1.0` |
| `taxonomyVersion` | `1.0` (label taxonomy document) |
| `seed` | `PHASE4_SEED` (`20260826`) |
| `counts.packs` | Row counts per pack |
| `counts.multi_step_sequences` | Sequence count for `multi_step` |
| `counts.splits` | `train` / `val` / `holdout` row counts |
| `generatedAt` | Cut timestamp (`2026-08-26T00:00:00.000Z` for v1.0) |
| `files[]` | Relative path, sha256, record count |
| `changelog` | `["initial synthetic cut 26 Aug 2026"]` |

A new cut is a **new directory** (`data/phase4/v1.1/`, …), not an in-place edit of `v1.0`.

---

## 3. Immutability

Once `v1.0` is published:

- Do not rewrite pack or split JSONL in place to “fix a label”.
- Do not change `PHASE4_SEED` and claim the same version.
- Do not mix live production events into this directory.
- Additive later versions MAY add packs or rows; they MUST bump `datasetVersion`.

If a label error is found, ship `v1.1` with a changelog line. Keep `v1.0` on disk for comparability.

---

## 4. Splits

`lib/elah/dataset/split.ts` assigns groups with seed `PHASE4_SEED`:

| Split | Target |
|---|---|
| `train` | 70% of groups |
| `val` | 15% of groups |
| `holdout` | remainder (~15%) |

**Grouping key (first match):** `sequenceId` OR `twinGroupId` OR `scenarioId`.

Stratify by `pack` when possible so rare packs are not emptied out of a split.

Pack files keep `split: null`. Split files set `split` on each copied row.

---

## 5. Leakage keys

`lib/elah/dataset/leakage.ts` → `assertNoLeakage(train, val, holdout)` throws if either key appears in more than one split:

- `sequenceId`
- `twinGroupId`

UI/agent twins (`twin-ext-*`, `twin-stmt-*`) and multi-step sequences must train together or hold out together. Tests plant a cross-split twin and expect failure.

`scenarioId` is unique per row and is the fallback group key.

---

## 6. Provenance

Every gold row MUST pass `requireProvenance(record)`:

| Field | v1.0 value |
|---|---|
| `source` | `synthetic_generator` |
| `generatorVersion` | `phase4_gen_v1` |
| `taxonomyVersion` | `1.0` |
| `annotatorId` | `rules_v0_gold` |
| `createdAt` | ISO timestamp of the cut |

Optional `provenance.extra.untrustedSource` / `historySketch` / `syntheticTier` are allowed. `summarizeBySource(records)` counts rows by `provenance.source`.

---

## 7. Restore

Restore **is not** a database load.

```bash
npx tsx scripts/generate-phase4-dataset.ts
```

Same seed + same generator version ⇒ same scenario ids, same splits, same file hashes (v1.0 uses a fixed `generatedAt`). Compare `manifest.json` sha256 list after regenerate.

Do not restore by editing JSONL by hand. Do not `prisma db push`. Live `executeTool` is unchanged; compromised-tool rows are synthetic labels only.

---

*End of document.*
