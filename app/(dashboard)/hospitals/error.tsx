"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function HospitalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError moduleName="Facilities" error={error} reset={reset} />;
}
