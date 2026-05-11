"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  addManagerNoteAction,
  type ManagerActionState,
} from "@/app/actions/manager";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";

const initialState: ManagerActionState = {};

export function AddNoteForm({ customerId }: { customerId: string }) {
  const [state, formAction] = useFormState(addManagerNoteAction, initialState);
  const [k, setK] = useState(0);
  return (
    <form
      key={k}
      action={async (fd) => {
        await formAction(fd);
        setK((v) => v + 1);
      }}
      className="space-y-2"
    >
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid grid-cols-3 gap-2">
        <Field label="Category" htmlFor="category">
          <Select id="category" name="category" defaultValue="general">
            <option value="general">General</option>
            <option value="risk">Risk</option>
            <option value="relationship">Relationship</option>
            <option value="internal">Internal</option>
          </Select>
        </Field>
      </div>
      <Field label="Note" htmlFor="noteBody">
        <Textarea
          id="noteBody"
          name="noteBody"
          rows={2}
          placeholder="Add a short internal note. Notes are treated as untrusted data."
          required
        />
      </Field>
      {state?.error ? (
        <div className="flex items-start gap-2 rounded-lg border border-accent-rose/40 bg-accent-rose/10 p-2 text-xs text-accent-rose">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}
      {state?.ok && state.message ? (
        <div className="flex items-start gap-2 rounded-lg border border-accent-emerald/40 bg-accent-emerald/10 p-2 text-xs text-accent-emerald">
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          <span>{state.message}</span>
        </div>
      ) : null}
      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Add note"}
    </Button>
  );
}
