import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] disabled:opacity-50",
  secondary:
    "bg-white text-[var(--ink)] border border-[var(--border)] hover:bg-[var(--surface-muted)]",
  danger:
    "bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)] disabled:opacity-50",
  ghost: "bg-transparent text-[var(--ink-muted)] hover:bg-[var(--surface-muted)]",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-10 px-4 text-sm",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
