"use client";

import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  /** Optional total row count for the footer label. */
  total?: number;
  onPageChange: (page: number) => void;
}) {
  const safePage = Math.max(1, page || 1);
  const safeTotalPages = Math.max(1, totalPages || 1);

  return (
    <div className="flex flex-col gap-3 border-t border-(--border) px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-xs text-(--ink-muted)">
        Page {safePage} of {safeTotalPages}
        {typeof total === "number" ? ` · ${total} total` : null}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 sm:flex-none"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 sm:flex-none"
          disabled={safePage >= safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
