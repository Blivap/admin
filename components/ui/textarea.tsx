import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[96px] w-full rounded-md border border-(--border) bg-white px-3 py-2 text-sm text-(--ink) placeholder:text-(--ink-subtle) focus:border-(--brand) focus:outline-none focus:ring-2 focus:ring-(--brand)/20 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
