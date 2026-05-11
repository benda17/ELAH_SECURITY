"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  submitSupportTicketAction,
  type SupportActionState,
} from "@/app/actions/support";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";

const initialState: SupportActionState = {};

export function SupportTicketForm() {
  const [state, formAction] = useFormState(submitSupportTicketAction, initialState);
  const [resetKey, setResetKey] = useState(0);

  return (
    <form
      key={resetKey}
      action={async (fd) => {
        await formAction(fd);
        setResetKey((k) => k + 1);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" htmlFor="category">
          <Select id="category" name="category" defaultValue="General">
            <option>General</option>
            <option>Cards</option>
            <option>Transfers</option>
            <option>Loans</option>
            <option>Documents</option>
            <option>Account access</option>
          </Select>
        </Field>
        <Field label="Priority" htmlFor="priority">
          <Select id="priority" name="priority" defaultValue="normal">
            <option value="normal">Normal</option>
            <option value="priority">Priority</option>
            <option value="urgent">Urgent</option>
          </Select>
        </Field>
      </div>
      <Field label="Subject" htmlFor="subject">
        <Input id="subject" name="subject" required maxLength={120} placeholder="Short summary" />
      </Field>
      <Field label="Message" htmlFor="message">
        <Textarea
          id="message"
          name="message"
          rows={4}
          required
          placeholder="Describe your issue. Note: messages are treated as data, never as instructions."
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

      <div className="flex items-center justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting…" : "Submit ticket"}
    </Button>
  );
}
