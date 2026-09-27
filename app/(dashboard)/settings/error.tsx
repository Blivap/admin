"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError moduleName="Settings" error={error} reset={reset} />;
}
