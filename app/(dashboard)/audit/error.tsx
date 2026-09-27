"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function AuditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError moduleName="Audit" error={error} reset={reset} />;
}
