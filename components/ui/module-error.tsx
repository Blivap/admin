"use client";

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
      <h2 className="text-lg font-semibold text-rose-900">
        {moduleName} module error
      </h2>
      <p className="mt-1 text-sm text-rose-800">
        {error.message || `Something went wrong loading ${moduleName.toLowerCase()}.`}
      </p>
      <Button className="mt-4" variant="secondary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
