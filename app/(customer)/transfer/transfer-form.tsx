"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Send, ShieldAlert } from "lucide-react";
import {
  submitTransferAction,
  type TransferState,
} from "@/app/actions/transfer";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { tierPolicy } from "@/lib/auth/roles";

interface AccountOption {
  id: string;
  type: string;
  masked: string;
  available: number;
}

const initialState: TransferState = {};

export function TransferForm({
  accounts,
  policy,
  tier,
}: {
  accounts: AccountOption[];
  policy: ReturnType<typeof tierPolicy>;
  tier: string;
}) {
  const [state, formAction] = useFormState(submitTransferAction, initialState);
  const [reviewing, setReviewing] = useState(false);
  const [draft, setDraft] = useState({
    sourceAccountId: accounts[0]?.id ?? "",
    recipientName: "",
    recipientAccount: "",
    amount: "",
    memo: "",
    intent: "",
  });

  // If the action returned "ok" but no pendingApproval and no error, the action redirected.
  // Reset state if blocked.
  useEffect(() => {
    if (state?.blocked) setReviewing(true);
  }, [state]);

  const amountNum = Number(draft.amount || 0);
  const requiresApproval = amountNum >= policy.approvalRequiredAbove;
  const overLimit = amountNum > policy.perTransferLimit;
  const sourceAccount = accounts.find((a) => a.id === draft.sourceAccountId);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="sourceAccountId" value={draft.sourceAccountId} />
      <input type="hidden" name="recipientName" value={draft.recipientName} />
      <input type="hidden" name="recipientAccount" value={draft.recipientAccount} />
      <input type="hidden" name="amount" value={draft.amount} />
      <input type="hidden" name="memo" value={draft.memo} />
      <input type="hidden" name="intent" value={draft.intent} />

      {!reviewing ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Source account" htmlFor="sourceAccountId-vis">
              <Select
                id="sourceAccountId-vis"
                value={draft.sourceAccountId}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, sourceAccountId: e.target.value }))
                }
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.type.toUpperCase()} · {a.masked} ·{" "}
                    {formatCurrency(a.available)} available
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Amount (USD)" htmlFor="amount-vis">
              <Input
                id="amount-vis"
                type="number"
                step="0.01"
                min="0.01"
                value={draft.amount}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, amount: e.target.value }))
                }
                placeholder="0.00"
                required
              />
            </Field>
            <Field label="Recipient name" htmlFor="recipientName-vis">
              <Input
                id="recipientName-vis"
                value={draft.recipientName}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, recipientName: e.target.value }))
                }
                placeholder="e.g. John Smith"
                required
              />
            </Field>
            <Field label="Recipient account" htmlFor="recipientAccount-vis">
              <Input
                id="recipientAccount-vis"
                value={draft.recipientAccount}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, recipientAccount: e.target.value }))
                }
                placeholder="Account number or beneficiary ID"
                required
              />
            </Field>
            <Field
              label="Memo (optional)"
              htmlFor="memo-vis"
              hint="Not authoritative · for your reference"
            >
              <Textarea
                id="memo-vis"
                value={draft.memo}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, memo: e.target.value }))
                }
                placeholder="Rent for May, dinner split, etc."
                rows={2}
              />
            </Field>
            <Field
              label="Your declared intent (for logs)"
              htmlFor="intent-vis"
              hint="Optional · helps ELAH detect drift"
            >
              <Textarea
                id="intent-vis"
                value={draft.intent}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, intent: e.target.value }))
                }
                placeholder="e.g. Transfer $500 to John for May rent"
                rows={2}
              />
            </Field>
          </div>

          {amountNum > 0 ? (
            <div className="rounded-lg border border-line bg-bg-elevated/40 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                {overLimit ? (
                  <Badge variant="status-blocked">
                    Over tier limit — will be blocked
                  </Badge>
                ) : requiresApproval ? (
                  <Badge variant="status-pending">
                    Manager approval required
                  </Badge>
                ) : (
                  <Badge variant="status-approved">Within tier limit</Badge>
                )}
                <span className="text-xs text-ink-muted">
                  Tier <span className="text-ink">{tier}</span> · approval above{" "}
                  {formatCurrency(policy.approvalRequiredAbove)} · per-transfer
                  limit {formatCurrency(policy.perTransferLimit)}
                </span>
              </div>
            </div>
          ) : null}

          {state?.error ? (
            <ErrorBox message={state.error} />
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (
                  !draft.sourceAccountId ||
                  !draft.recipientName ||
                  !draft.recipientAccount ||
                  amountNum <= 0
                ) {
                  return;
                }
                setReviewing(true);
              }}
            >
              Review transfer
            </Button>
          </div>
        </>
      ) : (
        <ReviewStep
          draft={draft}
          sourceMasked={sourceAccount?.masked ?? ""}
          requiresApproval={requiresApproval}
          overLimit={overLimit}
          state={state}
          onEdit={() => setReviewing(false)}
        />
      )}
    </form>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-accent-rose/40 bg-accent-rose/10 p-3 text-sm text-accent-rose">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function ReviewStep({
  draft,
  sourceMasked,
  requiresApproval,
  overLimit,
  state,
  onEdit,
}: {
  draft: {
    recipientName: string;
    recipientAccount: string;
    amount: string;
    memo: string;
    intent: string;
  };
  sourceMasked: string;
  requiresApproval: boolean;
  overLimit: boolean;
  state: TransferState;
  onEdit: () => void;
}) {
  const amount = Number(draft.amount || 0);

  if (state?.pendingApproval) {
    return (
      <div className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 p-4 text-sm">
        <div className="flex items-center gap-2 font-semibold text-accent-amber">
          <ShieldAlert className="size-4" />
          Submitted for manager approval
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          We logged the request and queued it for review by your assigned bank
          manager. Funds were not moved.
        </p>
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-bg-elevated/40 p-4 text-sm">
        <div className="text-xs uppercase tracking-widest text-ink-subtle">
          Review and confirm
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Row k="From" v={sourceMasked} />
          <Row k="Amount" v={formatCurrency(amount)} highlight />
          <Row k="Recipient" v={draft.recipientName} />
          <Row k="Recipient account" v={draft.recipientAccount} />
          <Row k="Memo" v={draft.memo || "—"} />
          <Row k="Declared intent" v={draft.intent || "—"} />
        </div>
      </div>

      {overLimit ? (
        <div className="rounded-lg border border-accent-rose/40 bg-accent-rose/10 p-3 text-sm text-accent-rose">
          This amount exceeds your tier's per-transfer limit. Submitting will be
          blocked and logged as a risk event.
        </div>
      ) : requiresApproval ? (
        <div className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 p-3 text-sm text-accent-amber">
          This transfer requires a bank manager approval. Submitting will create
          a pending approval request — no funds will move until a manager
          approves.
        </div>
      ) : (
        <div className="rounded-lg border border-accent-emerald/40 bg-accent-emerald/10 p-3 text-sm text-accent-emerald">
          This transfer is within your tier limits and will be posted
          immediately upon submission.
        </div>
      )}

      {state?.error ? <ErrorBox message={state.error} /> : null}

      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" onClick={onEdit}>
          ← Edit
        </Button>
        <ConfirmSubmitButton overLimit={overLimit} />
      </div>
    </div>
  );
}

function ConfirmSubmitButton({ overLimit }: { overLimit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      name="confirmed"
      value="1"
      variant={overLimit ? "danger" : "primary"}
      disabled={pending}
    >
      {pending ? "Submitting…" : overLimit ? "Try anyway (will be blocked)" : "Confirm and submit"}
      <Send className="size-3.5" />
    </Button>
  );
}

function Row({
  k,
  v,
  highlight,
}: {
  k: string;
  v: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-ink-subtle">
        {k}
      </div>
      <div
        className={
          highlight
            ? "text-xl font-semibold text-accent-gold"
            : "text-sm text-ink"
        }
      >
        {v}
      </div>
    </div>
  );
}
