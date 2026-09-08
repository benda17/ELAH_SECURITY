"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  sendNewsletterAction,
  type NewsletterSendState,
} from "@/app/actions/newsletter";

const initialState: NewsletterSendState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-surface-base disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send to all subscribers"}
    </button>
  );
}

export function NewsletterComposeForm({
  subscriberCount,
  resendReady,
}: {
  subscriberCount: number;
  resendReady: boolean;
}) {
  const [state, formAction] = useFormState(sendNewsletterAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          Subject
        </span>
        <input
          name="subject"
          required
          maxLength={200}
          placeholder="ELAH update"
          className="w-full rounded-xl border border-surface-border bg-surface-base px-3 py-2.5 text-sm text-ink outline-none ring-accent-cyan/40 focus:ring-2"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
          Body
        </span>
        <textarea
          name="body"
          required
          rows={10}
          placeholder="Plain-text newsletter body. Newlines are preserved."
          className="w-full rounded-xl border border-surface-border bg-surface-base px-3 py-2.5 text-sm text-ink outline-none ring-accent-cyan/40 focus:ring-2"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg border border-accent-rose/40 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
          {state.error}
        </p>
      ) : null}
      {state.sent ? (
        <p className="rounded-lg border border-accent-emerald/40 bg-accent-emerald/10 px-3 py-2 text-sm text-accent-emerald">
          Sent to {state.sent} subscriber{state.sent === 1 ? "" : "s"} via Resend.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <p className="text-xs text-ink-dim">
          {subscriberCount} real subscriber{subscriberCount === 1 ? "" : "s"} ·
          {resendReady ? " Resend configured" : " Resend not configured"}
        </p>
      </div>
    </form>
  );
}
