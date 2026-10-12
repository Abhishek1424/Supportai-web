// What is this file?   A SERVER endpoint of the Next.js app: POST /api/auth/login |
//   register | logout.
// Why?                 It talks to FastAPI, then saves the tokens in httpOnly cookies and
//                      returns only {ok: true}. The browser never sees the tokens.
// Flutter/Dart idea:   Next.js `route.ts` files = API handlers, like a tiny `shelf` server
//                      inside the web app. The folder name is the URL. `[action]` is a URL
//                      parameter, like `/api/auth/:action`.
// Flow:  LoginForm -> useLogin -> authFetch('login') -> THIS FILE -> FastAPI /auth/login
/**
 * Session endpoints: POST /api/auth/login | register | logout.
 *
 * Responsibility: talk to FastAPI's auth endpoints and translate the returned
 * tokens into httpOnly cookies. The tokens are NEVER included in the response
 * body, so browser JavaScript cannot see them.
 */
import { NextRequest, NextResponse } from "next/server";

import { isSameOriginRequest } from "@/lib/server/origin";
import { REFRESH_COOKIE } from "@/lib/session-constants";
import {
  backendFetch,
  clearSessionCookies,
  setSessionCookies,
  type TokenPair,
} from "@/lib/server/session";

// The second argument Next gives us: the URL params. In Next 16 `params` is a Promise, so
//   we `await` it.
type Context = { params: Promise<{ action: string }> };

/** Backend paths for the two actions that exchange credentials for tokens. */
// Which actions send credentials to the backend and get tokens back.
const CREDENTIAL_ENDPOINTS: Record<string, string> = {
  login: "/api/v1/auth/login",
  register: "/api/v1/auth/register",
};

/**
 * Handle login, register and logout.
 *
 * Flow (login/register):
 * 1. CSRF check (same-origin).
 * 2. Forward the JSON body to FastAPI.
 * 3. On failure, relay FastAPI's structured error unchanged (the UI shows it).
 * 4. On success, set the cookies and answer `{ ok: true }`.
 *
 * Flow (logout): tell the backend to revoke the refresh token (best effort),
 * then clear the cookies regardless, so the user is always logged out locally.
 *
 * @param request Incoming request.
 * @param context Route params; `action` is the last URL segment.
 * @returns JSON response with cookies set or cleared.
 */
// Next.js calls the function named after the HTTP method (POST, GET...).
// Flow (login/register): CSRF check -> forward JSON to FastAPI -> on error, pass the
// error JSON through -> on success, set cookies and return {ok: true}.
// Flow (logout): ask backend to revoke the token, then ALWAYS clear the cookies.
export async function POST(request: NextRequest, context: Context): Promise<NextResponse> {
  if (!isSameOriginRequest(request.method, request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN_ORIGIN", message: "Cross-site request blocked." } },
      { status: 403 },
    );
  }

  const { action } = await context.params;

  if (action === "logout") {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      await backendFetch("/api/v1/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => undefined);
    }
    return clearSessionCookies(new NextResponse(null, { status: 204 }));
  }

  const endpoint = CREDENTIAL_ENDPOINTS[action];
  if (!endpoint) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Unknown action." } },
      { status: 404 },
    );
  }

  let backendResponse: Response;
  try {
    backendResponse = await backendFetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    });
  } catch {
    return NextResponse.json(
      { error: { code: "BACKEND_UNAVAILABLE", message: "The service is temporarily unavailable." } },
      { status: 502 },
    );
  }

  if (!backendResponse.ok) {
    return new NextResponse(await backendResponse.text(), {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
  const tokens = (await backendResponse.json()) as TokenPair;
  return setSessionCookies(NextResponse.json({ ok: true }), tokens);
}
