import { cn } from "@/lib/utils";
import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent-gold text-bg-base hover:bg-accent-gold/90 border border-accent-gold/60 shadow-glow",
  secondary:
    "bg-bg-elevated text-ink hover:bg-bg-subtle border border-line-strong",
  ghost:
    "bg-transparent text-ink-muted hover:text-ink hover:bg-bg-elevated border border-transparent",
  danger:
    "bg-accent-rose/15 text-accent-rose hover:bg-accent-rose/25 border border-accent-rose/40",
  success:
    "bg-accent-emerald/15 text-accent-emerald hover:bg-accent-emerald/25 border border-accent-emerald/40",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
