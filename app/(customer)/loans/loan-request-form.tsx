"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  submitLoanAction,
  type LoanActionState,
} from "@/app/actions/loans";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

const initialState: LoanActionState = {};

export function LoanRequestForm({ ceiling }: { ceiling: number }) {
  const [state, formAction] = useFormState(submitLoanAction, initialState);
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
      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount (USD)" htmlFor="amount" hint={`Max ${formatCurrency(ceiling)}`}>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="100"
            min="500"
            required
            placeholder="0.00"
          />
        </Field>
        <Field label="Term (months)" htmlFor="termMonths">
          <Select id="termMonths" name="termMonths" defaultValue="24">
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="36">36</option>
            <option value="48">48</option>
            <option value="60">60</option>
            <option value="120">120</option>
          </Select>
        </Field>
      </div>
      <Field label="Purpose" htmlFor="purpose">
        <Input
          id="purpose"
          name="purpose"
          required
          placeholder="e.g. Home improvement"
        />
      </Field>
      <Field label="Income range" htmlFor="incomeRange">
        <Select id="incomeRange" name="incomeRange" defaultValue="$50k-$100k">
          <option value="$0-$50k">$0 – $50k</option>
          <option value="$50k-$100k">$50k – $100k</option>
          <option value="$100k-$250k">$100k – $250k</option>
          <option value="$250k-$500k">$250k – $500k</option>
          <option value="$500k+">$500k+</option>
        </Select>
      </Field>
      <Field
        label="Additional notes (optional)"
        htmlFor="notes"
        hint="Treated as untrusted data"
      >
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Anything that may help your application…"
        />
      </Field>

      {state?.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-accent-rose/40 bg-accent-rose/10 p-3 text-sm text-accent-rose">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {confirming ? (
        <div className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 p-3 text-sm text-accent-amber">
          Confirm to submit. This request will be sent to your assigned bank
          manager for review and is logged.
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
