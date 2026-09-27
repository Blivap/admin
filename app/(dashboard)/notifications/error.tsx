"use client";

import { ModuleError } from "@/components/ui/module-error";

export default function NotificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ModuleError moduleName="Notifications" error={error} reset={reset} />
  );
}
