"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function OverviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError moduleName="Overview" error={error} reset={reset} />;
}
