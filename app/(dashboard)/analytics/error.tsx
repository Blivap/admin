"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError moduleName="Analytics" error={error} reset={reset} />;
}
