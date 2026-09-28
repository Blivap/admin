import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-(--border) bg-white px-3 text-base text-(--ink) placeholder:text-(--ink-subtle) focus:border-(--brand) focus:outline-none focus:ring-2 focus:ring-(--brand)/20 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
