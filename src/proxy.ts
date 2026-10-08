/**
 * Page-level route guard (Next.js 16 "proxy", formerly "middleware").
 *
 * Responsibility: send visitors without a session cookie to /login, and send
 * logged-in visitors away from /login and /register. This is only a UX
 * convenience that avoids flashing protected pages. Real authorization is
 * enforced by the backend on every API call.
 */
import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session-constants";

const PUBLIC_PATHS = ["/login", "/register"];

/**
 * Redirect based on whether a session cookie exists.
 *
 * @param request Incoming page request.
 * @returns A redirect, or `next()` to continue.
 */
export function proxy(request: NextRequest): NextResponse {
  const hasSession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);
  const isPublic = PUBLIC_PATHS.includes(request.nextUrl.pathname);

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Run on pages only; skip API routes, Next internals and static files.
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
