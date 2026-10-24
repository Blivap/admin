import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildQueryString(
  params: object,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Convert kobo integer to naira for display/editing (e.g. 150000 → 1500). */
export function koboToNaira(kobo: number) {
  return kobo / 100;
}

/** Convert naira amount to kobo integer (e.g. 1500 → 150000). */
export function nairaToKobo(naira: number) {
  return Math.round(naira * 100);
}

export function formatNairaFromKobo(kobo?: number | null) {
  if (kobo == null || Number.isNaN(kobo)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(koboToNaira(kobo));
}

/** Safe short id for tables — never throws on null/undefined. */
export function shortId(value?: string | null, length = 8) {
  if (!value || typeof value !== "string") return null;
  if (value.length <= length) return value;
  return `${value.slice(0, length)}…`;
}

export function fullName(firstname?: string | null, lastname?: string | null) {
  return `${firstname ?? ""} ${lastname ?? ""}`.trim();
}
