"use client";

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
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "max-h-[92dvh] w-full overflow-y-auto rounded-t-xl border border-(--border) bg-white p-4 shadow-xl sm:rounded-lg sm:p-6",
          wide ? "sm:max-w-3xl" : "sm:max-w-md",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-(--ink)">{title}</h2>
        <div className="mt-4">{children}</div>
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
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" variant={danger ? "danger" : "primary"} disabled={pending}>
        {pending ? "Working…" : label}
      </Button>
    </div>
  );
}
