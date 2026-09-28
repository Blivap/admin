import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-(--brand) text-white hover:bg-(--brand-hover) disabled:opacity-50",
  secondary:
    "bg-white text-(--ink) border border-(--border) hover:bg-(--surface-muted)",
  danger:
    "bg-(--danger) text-white hover:bg-(--danger-hover) disabled:opacity-50",
  ghost: "bg-transparent text-(--ink-muted) hover:bg-(--surface-muted)",
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
        "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand) disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
