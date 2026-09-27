import { env } from "@/config/env";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  /** When true, response is returned as Blob (e.g. CSV export). */
  blob?: boolean;
  /** Skip redirect-on-401 (used by login). */
  skipAuthRedirect?: boolean;
}

async function cookieHeaderFromServer(): Promise<string | undefined> {
  if (typeof window !== "undefined") return undefined;
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const serialized = jar.toString();
    return serialized || undefined;
  } catch {
    return undefined;
  }
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const from = `${window.location.pathname}${window.location.search}`;
  const params = new URLSearchParams();
  if (from && from !== "/login") params.set("from", from);
  const qs = params.toString();
  window.location.assign(qs ? `/login?${qs}` : "/login");
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as Record<string, unknown>;
  if (typeof record.message === "string") return record.message;
  if (Array.isArray(record.message) && record.message.every((m) => typeof m === "string")) {
    return record.message.join(", ");
  }
  if (typeof record.error === "string") return record.error;
  return fallback;
}

/**
 * Single typed fetch wrapper. Every admin API call goes through this.
 * Attaches credentials, JSON-encodes bodies, throws ApiRequestError on non-2xx,
 * and redirects to /login on 401.
 */
export async function apiClient<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers: extraHeaders,
    blob = false,
    skipAuthRedirect = false,
  } = options;

  const headers = new Headers(extraHeaders);
  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const serverCookie = await cookieHeaderFromServer();
  if (serverCookie && !headers.has("Cookie")) {
    headers.set("Cookie", serverCookie);
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (response.status === 401 && !skipAuthRedirect) {
    redirectToLogin();
    throw new ApiRequestError(401, "Unauthorized");
  }

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
    throw new ApiRequestError(
      response.status,
      extractErrorMessage(payload, response.statusText || "Request failed"),
      payload,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (blob) {
    return (await response.blob()) as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}
