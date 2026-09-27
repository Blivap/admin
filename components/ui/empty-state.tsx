import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4 py-16 text-center",
        className,
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--ink-muted)]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-[var(--ink)]">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-[var(--ink-muted)]">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button
          className="mt-4"
          size="sm"
          variant="secondary"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
