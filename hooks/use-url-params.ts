"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type StringRecord = Record<string, string>;

function readParams<T extends StringRecord>(
  searchParams: URLSearchParams,
  defaults: T,
): T {
  const next = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    const raw = searchParams.get(String(key));
    if (raw !== null) {
      next[key] = raw as T[keyof T];
    }
  }
  return next;
}

function buildQueryString<T extends StringRecord>(
  values: T,
  defaults: T,
): string {
  const qs = new URLSearchParams();
  for (const key of Object.keys(values) as (keyof T)[]) {
    const value = values[key];
    const fallback = defaults[key];
    if (value === undefined || value === null) continue;
    if (String(value) === "" || String(value) === String(fallback)) continue;
    qs.set(String(key), String(value));
  }
  return qs.toString();
}

/**
 * Sync a flat string-keyed state object with the URL search string.
 * Empty / default values are omitted so shared links stay clean.
 */
export function useUrlParams<T extends StringRecord>(defaults: T) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(
    () => readParams(searchParams, defaults),
    // defaults is expected to be a stable module-level constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams],
  );

  const setParams = useCallback(
    (patch: Partial<T> | ((prev: T) => T)) => {
      const current = readParams(searchParams, defaults);
      const next =
        typeof patch === "function"
          ? patch(current)
          : { ...current, ...patch };
      const qs = buildQueryString(next, defaults);
      const href = qs ? `${pathname}?${qs}` : pathname;
      const currentHref = searchParams.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      if (href === currentHref) return;
      router.replace(href, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, router, searchParams],
  );

  return [params, setParams] as const;
}

export function toPositiveInt(value: string, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
