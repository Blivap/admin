"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiRequestError } from "@/lib/api/client";

export function QueryError({
  title = "Something went wrong",
  error,
  onRetry,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
}) {
  const description =
    error instanceof ApiRequestError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Please try again. If this keeps happening, check the API connection.";

  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-(--danger)">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-(--ink)">{title}</p>
      <p className="mt-1 max-w-md text-sm text-(--ink-muted)">
        {description}
      </p>
      {onRetry ? (
        <Button className="mt-4" size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
