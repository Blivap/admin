"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function SupportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError moduleName="Support" error={error} reset={reset} />;
}
