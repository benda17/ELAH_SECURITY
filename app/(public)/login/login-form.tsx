"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const initialState: LoginState = {};

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction] = useFormState(loginAction, initialState);
  const errorMessage = state.error ?? initialError;

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue="basic.customer@elah.demo"
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          defaultValue="DemoPass123!"
        />
      </Field>

      {errorMessage ? (
        <div className="flex items-start gap-2 rounded-lg border border-accent-rose/40 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}
