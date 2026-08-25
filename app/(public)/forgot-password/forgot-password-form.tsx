"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle } from "lucide-react";
import {
  requestPasswordResetAction,
  type PasswordResetState,
} from "@/app/actions/auth";
import { DEFAULT_DEMO_LOGIN_EMAIL } from "@/lib/auth/demo-accounts";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const initialState: PasswordResetState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useFormState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <Field label="Email" htmlFor="reset-email">
        <Input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={DEFAULT_DEMO_LOGIN_EMAIL}
        />
      </Field>

      {state.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-accent-rose/40 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.message ? (
        <p className="text-sm text-ink-muted">{state.message}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Submitting…" : "Request recovery"}
    </Button>
  );
}
