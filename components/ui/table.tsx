import { cn } from "@/lib/utils";
import * as React from "react";

export function Table({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-line bg-bg-panel/40",
        className,
      )}
    >
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-bg-subtle/60 text-xs uppercase tracking-wider text-ink-subtle">
      {children}
    </thead>
  );
}

export function TR({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("border-b border-line last:border-0", className)}>
      {children}
    </tr>
  );
}

export function TH({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn("px-4 py-3 text-left font-medium", className)}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-4 py-3 align-middle text-ink", className)}>
      {children}
    </td>
  );
}

export function EmptyRow({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={100} className="px-4 py-8 text-center text-sm text-ink-subtle">
        {message}
      </td>
    </tr>
  );
}
