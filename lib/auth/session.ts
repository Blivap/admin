/** Cookie that middleware uses to gate protected routes. */
export const SESSION_COOKIE = "admin_session";

const DAY_SECONDS = 60 * 60 * 24;

function parseMaxAgeSeconds(expiresAt?: string | null): number {
  if (!expiresAt) return DAY_SECONDS;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return DAY_SECONDS;
  return Math.floor(ms / 1000);
}

/** Persist JWT for middleware + Authorization header (client only). */
export function setSessionToken(
  accessToken: string,
  accessTokenExpires?: string | null,
): void {
  if (typeof document === "undefined") return;
  const maxAge = parseMaxAgeSeconds(accessTokenExpires);
  document.cookie = [
    `${SESSION_COOKIE}=${encodeURIComponent(accessToken)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ].join("; ");
}

export function clearSessionToken(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getSessionTokenFromDocument(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
}

export async function getSessionTokenFromServer(): Promise<string | undefined> {
  if (typeof window !== "undefined") return undefined;
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    return jar.get(SESSION_COOKIE)?.value;
  } catch {
    return undefined;
  }
}
