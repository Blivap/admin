import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm text-[var(--ink)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
