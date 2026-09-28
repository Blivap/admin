"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ModuleError({
  moduleName,
  error,
  reset,
}: {
  moduleName: string;
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-(--danger)">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-rose-900">
            Couldn’t load {moduleName}
          </h2>
          <p className="mt-1 text-sm text-rose-800">
            {error.message ||
              `Something went wrong loading ${moduleName.toLowerCase()}.`}
          </p>
          <Button className="mt-4" variant="secondary" onClick={reset}>
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
