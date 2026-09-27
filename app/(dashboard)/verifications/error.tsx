"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function VerificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ModuleError moduleName="Verifications" error={error} reset={reset} />
  );
}
