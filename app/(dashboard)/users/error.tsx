"use client";

import { Button } from "@/components/ui/button";

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-900">Users module error</h2>
      <p className="mt-1 text-sm text-rose-800">
        {error.message || "Something went wrong loading users."}
      </p>
      <Button className="mt-4" variant="secondary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
