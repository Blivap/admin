"use client";

import { RefreshCw } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReloadButton({
  onReload,
  loading = false,
  label = "Reload",
  size = "md",
  variant = "secondary",
  className,
}: {
  onReload: () => void;
  loading?: boolean;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      disabled={loading}
      onClick={onReload}
      aria-label={label}
    >
      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      {label}
    </Button>
  );
}
