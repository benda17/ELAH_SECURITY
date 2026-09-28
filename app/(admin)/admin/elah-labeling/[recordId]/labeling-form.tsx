"use client";

import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  saveGoldLabel,
  type LabelingActionState,
} from "@/app/actions/elah-labeling";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea, Input } from "@/components/ui/input";

const initialState: LabelingActionState = {};

export type LabelingFormDefaults = {
  recordId: string;
  intentLabel: string;
  annotatorConfidence: "high" | "medium" | "low";
  contextualRiskTags: string[];
  reviewNotes: string;
  humanAgency: number;
  financialRisk: number;
  emotionalUrgency: number;
  goldScore: number | null;
};

export function LabelingForm({
  defaults,
  intents,
  tags,
}: {
  defaults: LabelingFormDefaults;
  intents: readonly string[];
  tags: readonly string[];
}) {
  const [state, formAction] = useFormState(saveGoldLabel, initialState);
  const selected = new Set(defaults.contextualRiskTags);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="recordId" value={defaults.recordId} />

      {defaults.goldScore != null ? (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
            goldScore (read-only)
          </div>
          <div className="font-mono text-sm text-ink">{defaults.goldScore}</div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Intent label" htmlFor="intentLabel">
          <Select
            id="intentLabel"
            name="intentLabel"
            defaultValue={defaults.intentLabel}
            required
          >
            {intents.map((intent) => (
              <option key={intent} value={intent}>
                {intent}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Annotator confidence" htmlFor="annotatorConfidence">
          <Select
            id="annotatorConfidence"
            name="annotatorConfidence"
            defaultValue={defaults.annotatorConfidence}
            required
          >
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </Select>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-muted">
          Contextual risk tags
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <label
              key={tag}
              className="flex items-center gap-2 rounded-lg border border-line bg-bg-panel/40 px-3 py-2 text-sm text-ink"
            >
              <input
                type="checkbox"
                name="contextualRiskTags"
                value={tag}
                defaultChecked={selected.has(tag)}
                className="accent-accent-cyan"
              />
              <span className="font-mono text-xs">{tag}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        label="Review notes"
        htmlFor="reviewNotes"
        hint="Max 2000 chars. No long digit sequences."
      >
        <Textarea
          id="reviewNotes"
          name="reviewNotes"
          rows={4}
          maxLength={2000}
          defaultValue={defaults.reviewNotes}
          placeholder="Why this intent? Tie-break notes only. Do not paste account numbers."
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="humanAgency" htmlFor="humanAgency">
          <Input
            id="humanAgency"
            name="humanAgency"
            type="number"
            min={0}
            max={1}
            step={0.001}
            defaultValue={defaults.humanAgency}
            required
          />
        </Field>
        <Field label="financialRisk" htmlFor="financialRisk">
          <Input
            id="financialRisk"
            name="financialRisk"
            type="number"
            min={0}
            max={1}
            step={0.001}
            defaultValue={defaults.financialRisk}
            required
          />
        </Field>
        <Field label="emotionalUrgency" htmlFor="emotionalUrgency">
          <Input
            id="emotionalUrgency"
            name="emotionalUrgency"
            type="number"
            min={0}
            max={1}
            step={0.001}
            defaultValue={defaults.emotionalUrgency}
            required
          />
        </Field>
      </div>

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

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save gold label"}
    </Button>
  );
}
