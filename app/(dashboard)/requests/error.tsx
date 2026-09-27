"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function RequestsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError moduleName="Requests" error={error} reset={reset} />;
}
