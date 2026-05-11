import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "block w-full rounded-lg border border-line bg-bg-panel/60 px-3.5 py-2 text-sm",
      "text-ink placeholder:text-ink-subtle",
      "focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/40 focus:outline-none",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "block w-full rounded-lg border border-line bg-bg-panel/60 px-3.5 py-2 text-sm",
      "text-ink placeholder:text-ink-subtle",
      "focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/40 focus:outline-none",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "resize-y min-h-[96px]",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "block w-full rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-sm",
      "text-ink",
      "focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/40 focus:outline-none",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Label({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 inline-flex items-center justify-between text-xs font-medium uppercase tracking-wider text-ink-muted w-full"
    >
      <span>{children}</span>
      {hint ? <span className="text-ink-subtle normal-case">{hint}</span> : null}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <Label htmlFor={htmlFor} hint={hint}>
        {label}
      </Label>
      {children}
    </div>
  );
}
