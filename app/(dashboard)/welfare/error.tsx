"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function WelfareError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError moduleName="Welfare" error={error} reset={reset} />;
}
