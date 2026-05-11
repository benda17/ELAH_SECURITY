"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  submitCardRequestAction,
  type CardActionState,
} from "@/app/actions/cards";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";

const initialState: CardActionState = {};

export function CardRequestForm({
  accounts,
  address,
}: {
  accounts: { id: string; label: string }[];
  address: string;
}) {
  const [state, formAction] = useFormState(submitCardRequestAction, initialState);
  const [confirming, setConfirming] = useState(false);

  if (state?.ok && state.message) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-accent-emerald/40 bg-accent-emerald/10 p-3 text-sm text-accent-emerald">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        <span>{state.message}</span>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Account" htmlFor="accountId">
        <Select id="accountId" name="accountId" required>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Card type" htmlFor="cardType">
          <Select id="cardType" name="cardType" defaultValue="debit">
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </Select>
        </Field>
        <Field label="Reason" htmlFor="requestReason">
          <Select id="requestReason" name="requestReason" defaultValue="new">
            <option value="new">New card</option>
            <option value="replacement">Replacement (expiring)</option>
            <option value="lost">Lost</option>
            <option value="stolen">Stolen (requires approval)</option>
          </Select>
        </Field>
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-ink-subtle mb-1">
          Delivery address (from profile)
        </div>
        <div className="rounded-lg border border-line bg-bg-elevated/40 p-3 text-sm text-ink">
          {address}
        </div>
      </div>

      {confirming ? (
        <div className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 p-3 text-sm text-accent-amber">
          Please confirm — this action is logged.
        </div>
      ) : null}

      {state?.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-accent-rose/40 bg-accent-rose/10 p-3 text-sm text-accent-rose">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {!confirming ? (
          <Button type="button" variant="secondary" onClick={() => setConfirming(true)}>
            Review
          </Button>
        ) : (
          <>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Edit
            </Button>
            <SubmitButton />
          </>
        )}
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting…" : "Confirm and submit"}
    </Button>
  );
}
