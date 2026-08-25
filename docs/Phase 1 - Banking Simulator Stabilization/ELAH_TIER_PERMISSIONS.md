# ELAH User Tiers and Permissions

| Field | Value |
|---|---|
| Document ID | ELAH-SIM-TIERS-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 18 August 2026 |
| Related task | `task-1-verify-user-tiers-and-permissions` |
| Depends on | `ELAH-SIM-DATA-001`, `ELAH-SIM-AUTHZ-001` |
| Evidence | `lib/auth/roles.ts` (`TIER_POLICY`), `app/actions/transfer.ts`, `app/actions/loans.ts`, `app/actions/documents.ts`, `lib/agent/tools/money.ts`, `app/(customer)/investments/page.tsx`, `lib/agent/policy.ts` |

---

## 1. Purpose

Freeze the **live** mapping from customer tier → entitlements and limits, and mark which checks actually run versus which are display-only. Staff roles have **no** tier (`tierFromRole` → `not_applicable`).

**Product freeze:** these limits are **bank policy**, not ELAH decisions.

---

## 2. Role ↔ tier

| Role | Tier | Portal |
|---|---|---|
| `regular_customer` | `basic` | Customer |
| `premium_customer` | `premium` | Customer |
| `vip_customer` | `vip` | Customer |
| `bank_manager` | n/a | Manager |
| `security_reviewer` | n/a | Admin |
| `ai_agent` | n/a | None (blocked; authz A1) |

Live profile `CustomerProfile.tier` is the source of truth at request time (`tierPolicy(profile.tier)`). Role-derived tier is a fallback on the top bar if profile is missing (customers without a profile cannot use the chat API).

---

## 3. Canonical `TIER_POLICY` (USD, mock)

From `lib/auth/roles.ts`. Numbers are **simulated**.

| Control | basic | premium | vip |
|---|---:|---:|---:|
| `dailyTransferLimit` | 5,000 | 25,000 | 100,000 |
| `perTransferLimit` | 5,000 | 25,000 | 100,000 |
| `approvalRequiredAbove` | 2,500 | 15,000 | 50,000 |
| `loanRequestLimit` | 25,000 | 100,000 | 1,000,000 |
| `canSeeInvestments` | false | true | true |
| `documentClasses` (declared) | statement, tax | + investment | + private |

---

## 4. Enforcement matrix (live)

| Control | UI | Agent | Verdict |
|---|---|---|---|
| Per-transfer cap (`perTransferLimit`) | External transfer blocked + `transfer_blocked` + RiskEvent `tier_limit_violation` | External tool same | **Enforced** |
| Amount ≥ `approvalRequiredAbove` | `ApprovalRequest` + pending `transfer_submitted` (no immediate debit) | Same for external | **Enforced** |
| `dailyTransferLimit` | Shown on dashboard / accounts / transfer page | Not summed | **Display only** — not summed against posted volume |
| `BankAccount.dailyTransferLimit` | Shown on account card | Unused | **Display only** |
| Loan ceiling | `loan_request_blocked` if over | No loan tool | **Enforced (UI only)** |
| Investments page | Basic sees upgrade panel; premium/vip see holdings | Internal transfer **to investment** fails for basic (`source_missing` / no account) | **Enforced as UX + missing account** |
| Document **list** | Filter `availableToTier` ⊆ {basic} / +premium / +vip | Statement tool is not class-filtered the same way; monthly statement is a generated summary | **List enforced** |
| Document **download** | Own document by id; **no second `availableToTier` check** | n/a | **Gap** vs list filter |
| Document classes `private` | Declared for VIP in `TIER_POLICY.documentClasses` | Seed uses `availableToTier: vip` on the portfolio row, not a `private` type | **Policy string unused in queries** |
| Bulk download | Always blocked for every tier | n/a | **Enforced (deny all)** |
| Internal transfer amount | No UI | **No** `perTransferLimit` check | **Gap** — only funds + confirmation |
| Policy hard ceiling (agent) | n/a | `validateToolCall`: amount > `approvalRequiredAbove * 10` → deny | **Enforced** (pre-execute) |
| Prompt injection on memo / utterance | Transfer memo blocked | Tool denied if injection on user message or args | **Enforced** (bank policy) |

Worked examples (Jane, basic):

| Attempt | Expected live result |
|---|---|
| External $2,000 | Posts (under 2,500 approval line) if funds exist |
| External $3,000 | Pending manager approval |
| External $6,000 | Blocked (over 5,000) |
| Internal $6,000 via assistant (if funds) | **Would post** — no per-transfer cap |
| Loan $30,000 | Blocked (over 25,000) |
| Open `/investments` | Upgrade copy; no holdings |
| Bulk documents | Always blocked + high RiskEvent |

Worked examples (Isabella, vip): `$40,000` external posts (under 50,000 approval); `$60,000` needs approval; `$120,000` blocked.

---

## 5. What every customer can do (tier-independent)

If they are a customer role with a profile:

- Login, logout, dashboard, accounts, transactions search
- External transfer form (limits differ)
- Documents list (visibility differs), single download of **owned** rows
- Card **request** (new / replacement / lost / stolen) — not freeze
- Loan **request** (ceiling differs)
- Support ticket
- Profile update of email / phone / address / employment (not password)
- Assistant: all **13** allow-listed tools (confirmation still required on money / freeze / statement)

Staff cannot use customer tools (layout + API).

---

## 6. Staff permissions (not tiers)

| Capability | Manager | Security reviewer |
|---|---|---|
| View any customer profile / notes | yes | no (admin logs, not CRM) |
| Approve / reject transfer & loan | yes | no |
| View audit / flagged / risk (manager queue) | yes | via admin risk + action logs |
| Injection scenario catalog | no | yes |
| Training / agent conversation APIs | no | yes |

Manager is **not** a customer and has no accounts.

---

## 7. Invalid readings

| Claim | Reality |
|---|---|
| “Daily limit is enforced” | It is labelled, not summed |
| “ELAH applies tier limits” | Bank code in `tierPolicy` / `validateToolCall` does |
| “VIP private documents are a query filter on `documentClasses`” | List uses `availableToTier` only |
| “Freeze is a Card privilege by tier” | Any customer can freeze **via assistant**; UI has no freeze |

---

## 8. Sign-off

I agree this matrix is the live tier contract as of 18 Aug 2026. Event mapping must record `actor.role` / customer tier as **context**, not as an ELAH allow/deny.

---

*End of document.*
