// What is this file?   The page guard. It runs BEFORE every page request.
// Why?                 No session cookie -> go to /login. Logged in and opening /login ->
//   go to /dashboard.
// Flutter/Dart idea:   go_router's `redirect:` callback.
// Note:                This is for good user experience only. Real security is in the
//   backend.
// (In Next.js 16 this file is called `proxy.ts`. Older versions called it `middleware.ts`.)
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

// Pages that need no login.
const PUBLIC_PATHS = ["/login", "/register"];

/**
 * Redirect based on whether a session cookie exists.
 *
 * @param request Incoming page request.
 * @returns A redirect, or `next()` to continue.
 */
// Look at the request cookies, then redirect or continue with `NextResponse.next()`.
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

// Run on pages only. Skip /api routes, Next internal files and the favicon.
export const config = {
  // Run on pages only; skip API routes, Next internals and static files.
  matcher: ["/((?!api|_next|favicon.ico).*)"],
};
