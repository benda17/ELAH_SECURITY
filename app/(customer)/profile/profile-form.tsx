"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  updateProfileAction,
  type ProfileActionState,
} from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const initialState: ProfileActionState = {};

export function ProfileForm({
  defaults,
}: {
  defaults: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    employmentStatus: string;
  };
}) {
  const [state, formAction] = useFormState(updateProfileAction, initialState);
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Full name (read-only)" htmlFor="fullName">
        <Input id="fullName" defaultValue={defaults.fullName} disabled />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaults.email}
            required
          />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            defaultValue={defaults.phone}
            required
          />
        </Field>
      </div>
      <Field label="Address" htmlFor="address">
        <Input
          id="address"
          name="address"
          defaultValue={defaults.address}
          required
        />
      </Field>
      <Field label="Employment status" htmlFor="employmentStatus">
        <Input
          id="employmentStatus"
          name="employmentStatus"
          defaultValue={defaults.employmentStatus}
          required
        />
      </Field>

      {state?.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-accent-rose/40 bg-accent-rose/10 p-3 text-sm text-accent-rose">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}
      {state?.ok && state.message ? (
        <div className="flex items-start gap-2 rounded-lg border border-accent-emerald/40 bg-accent-emerald/10 p-3 text-sm text-accent-emerald">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <span>{state.message}</span>
        </div>
      ) : null}

      {confirming ? (
        <div className="rounded-lg border border-accent-amber/40 bg-accent-amber/10 p-3 text-sm text-accent-amber">
          Confirm to save changes. Email and address changes are high-risk and
          logged.
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        {!confirming ? (
          <Button type="button" variant="secondary" onClick={() => setConfirming(true)}>
            Review changes
          </Button>
        ) : (
          <>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <SaveButton />
          </>
        )}
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Confirm and save"}
    </Button>
  );
}
