# ELAH model rollback tests (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-RB-001 |
| Version | **1.0** |
| Status | **Recorded** — **offline only** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-run-model-rollback-tests` |
| Canonical | `docs/Phase 6 - ELAH model development/ELAH_MODEL_VERSIONING.md` |
| Training home | `/Users/benda/elah-model` |

**Product freeze (unchanged):** Live `POST /v1/score` remains **`rules_v0`**. Changing `artifacts/current.json` does **not** change the bank.

---

## 1. What “rollback” means today

Offline training-home default:

```bash
cd /Users/benda/elah-model
python -m elah_model.evaluate --model-version catboost_v0
# --set-current   # offline pointer only
```

Immutable copies live under `artifacts/versions/`. That is **not** live rollback.

---

## 2. What was not tested

- Flipping live `provenance.scorer` from `rules_v0` to CatBoost and back
- Feature-flag cutover in Vercel
- Dual-running models on Jane’s path

`task-6-integrate-the-best-model-into-the-elah-service` is still **backlog**. Until that ships, the live “rollback” is: **keep shipping `rules_v0`**.

---

## 3. Sign-off

I agree Phase 10 rollback evidence is the offline registry; live model rollback is not wired.

---

*End of document.*
