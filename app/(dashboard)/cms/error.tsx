"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function CmsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ModuleError moduleName="CMS" error={error} reset={reset} />;
}
