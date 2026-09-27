import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];
const COOKIE_NAME = "admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(COOKIE_NAME)?.value);
  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!hasSession && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/overview";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Gate page routes only. Do not run on /admin/* — those are proxied API
     * calls (rewrites). Gating them caused POST /admin/auth/login → 307 /login.
     */
    "/((?!_next/static|_next/image|favicon.ico|admin/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
