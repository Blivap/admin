"use client";

import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-(--border) px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-xs text-(--ink-muted)">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 sm:flex-none"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 sm:flex-none"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
