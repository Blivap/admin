import { ApiRequestError } from "@/lib/api/client";

export function errorMessage(
  error: unknown,
  fallback = "Something went wrong. Try again.",
): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
