"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex w-full flex-col bg-white shadow-2xl shadow-black/25",
          "max-h-[min(92dvh,100%)] rounded-t-2xl border border-(--border) border-b-0",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          "sm:max-h-[min(90dvh,860px)] sm:rounded-xl sm:border-b sm:pb-0",
          wide ? "sm:max-w-3xl" : "sm:max-w-md",
        )}
      >
        <div className="flex shrink-0 justify-center pt-2 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-(--border)" />
        </div>

        <div className="flex shrink-0 items-start gap-3 border-b border-(--border) px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="min-w-0 flex-1 text-base font-semibold leading-snug text-(--ink) sm:text-lg">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--border) bg-(--surface) text-(--ink-muted) hover:bg-(--surface-muted) hover:text-(--ink) sm:h-9 sm:w-9"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalActions({
  onCancel,
  pending,
  label,
  danger,
}: {
  onCancel: () => void;
  pending?: boolean;
  label: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-(--border) pt-4 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="secondary"
        className="w-full sm:w-auto"
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant={danger ? "danger" : "primary"}
        className="w-full sm:w-auto"
        disabled={pending}
      >
        {pending ? "Working…" : label}
      </Button>
    </div>
  );
}
