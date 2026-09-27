"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type SnackbarTone = "success" | "error" | "info";

export interface SnackbarMessage {
  id: string;
  title: string;
  description?: string;
  tone: SnackbarTone;
}

interface SnackbarContextValue {
  toast: (input: {
    title: string;
    description?: string;
    tone?: SnackbarTone;
  }) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const TONE_STYLES: Record<
  SnackbarTone,
  { bar: string; icon: typeof CheckCircle2 }
> = {
  success: {
    bar: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: CheckCircle2,
  },
  error: {
    bar: "border-rose-200 bg-rose-50 text-rose-900",
    icon: XCircle,
  },
  info: {
    bar: "border-sky-200 bg-sky-50 text-sky-900",
    icon: Info,
  },
};

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SnackbarMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      tone = "info",
    }: {
      title: string;
      description?: string;
      tone?: SnackbarTone;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((prev) => [...prev.slice(-3), { id, title, description, tone }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
        aria-live="polite"
      >
        {items.map((item) => {
          const Icon = TONE_STYLES[item.tone].icon;
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg shadow-black/10",
                TONE_STYLES[item.tone].bar,
              )}
              role="status"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.title}</p>
                {item.description ? (
                  <p className="mt-0.5 text-xs opacity-80">{item.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded p-0.5 opacity-60 hover:opacity-100"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }
  return ctx;
}
