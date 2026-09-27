import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
