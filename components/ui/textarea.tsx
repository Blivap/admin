import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[96px] w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
