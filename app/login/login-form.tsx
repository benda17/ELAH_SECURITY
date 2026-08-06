"use client";

import { useFormState, useFormStatus } from "react-dom";
import { founderLoginAction, type FounderLoginState } from "@/app/actions/founder-auth";

const initialState: FounderLoginState = {};

export function FounderLoginForm() {
  const [state, formAction] = useFormState(founderLoginAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          Username
        </span>
        <input
          name="username"
          autoComplete="username"
          required
          defaultValue="bnd"
          className="w-full rounded-xl border border-surface-border bg-surface-base px-3 py-2.5 text-sm text-ink outline-none ring-accent-gold/40 focus:ring-2"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          Password
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-surface-border bg-surface-base px-3 py-2.5 text-sm text-ink outline-none ring-accent-gold/40 focus:ring-2"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg border border-accent-rose/40 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-accent-gold px-4 py-2.5 text-sm font-semibold text-surface-base transition hover:brightness-110 disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}
