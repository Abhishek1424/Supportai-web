// What is this file?   The gateway for all normal API calls: /api/proxy/<backend path>.
// Why?                 It adds `Authorization: Bearer <token>` from the cookie, calls
//   FastAPI,
//                      and returns the answer. If the token expired it refreshes and
//                        retries once.
// Flutter/Dart idea:   like a Dio interceptor that adds the token and handles 401 ->
//   refresh -> retry.
//                      The difference: this runs on the Next.js server, so the token stays
//                        secret.
//                      `[...path]` means "any number of URL parts", like a wildcard route.
// Flow:  hook -> apiFetch('/audit-logs') -> /api/proxy/audit-logs -> THIS FILE -> FastAPI
//   -> back
/**
 * Authenticated pass-through to the FastAPI backend.
 *
 * Responsibility: the browser calls `/api/proxy/<backend path>`; this handler
 * adds the `Authorization: Bearer` header from the httpOnly cookie, forwards
 * the call, and returns the answer. If the access token has expired it
 * refreshes the session transparently and retries once.
 *
 * It is deliberately NOT a general proxy: only `/api/v1/...` is reachable and
 * the token-issuing auth endpoints are blocked so tokens cannot leak into
 * browser-visible responses.
 */
import { NextRequest, NextResponse } from "next/server";

import { isSameOriginRequest } from "@/lib/server/origin";
import { buildBackendPath } from "@/lib/server/proxy-path";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session-constants";
import {
  backendFetch,
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
  type TokenPair,
} from "@/lib/server/session";

type Context = { params: Promise<{ path: string[] }> };

/**
 * Forward one request to the backend with a given access token.
 *
 * @param backendPath Validated backend path.
 * @param search Query string including the leading "?" (or "").
 * @param method HTTP method.
 * @param body Request body text, if any.
 * @param accessToken Bearer token, if we have one.
 * @returns The backend response.
 */
// One call to FastAPI with the given token. Builds headers, then `backendFetch`.
function forward(
  backendPath: string,
  search: string,
  method: string,
  body: string | undefined,
  accessToken: string | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return backendFetch(backendPath + search, { method, headers, body });
}

/**
 * Handle any proxied method.
 *
 * Flow:
 * 1. CSRF check for unsafe methods; validate the path.
 * 2. No access cookie but a refresh cookie? Refresh first.
 * 3. Forward to the backend.
 * 4. Got 401 while holding a refresh token? Refresh once and retry.
 * 5. Return the backend's status/body; attach new cookies if we refreshed,
 *    or clear them if the refresh was rejected (session is over).
 *
 * @param request Incoming request.
 * @param context Route params containing the path segments.
 * @returns The backend's answer.
 */
// Steps:
//  1. CSRF check and path check.
//  2. No access cookie but a refresh cookie? Refresh first.
//  3. Call FastAPI.
//  4. Got 401? Refresh once and retry once.
//  5. Return the backend answer. Set new cookies if we refreshed. Clear cookies if refresh
//    failed.
async function handle(request: NextRequest, context: Context): Promise<NextResponse> {
  if (!isSameOriginRequest(request.method, request.headers.get("origin"), request.headers.get("host"))) {
    return errorResponse(403, "FORBIDDEN_ORIGIN", "Cross-site request blocked.");
  }
  const { path } = await context.params;
  const backendPath = buildBackendPath(path);
  if (!backendPath) return errorResponse(404, "NOT_FOUND", "Unknown endpoint.");

  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();
  const search = request.nextUrl.search;

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let renewed: TokenPair | null = null;
  let refreshRejected = false;

  if (!accessToken && refreshToken) {
    renewed = await refreshSession(refreshToken);
    refreshRejected = renewed === null;
    accessToken = renewed?.access_token;
  }

  let backendResponse: Response;
  try {
    backendResponse = await forward(backendPath, search, method, body, accessToken);
    if (backendResponse.status === 401 && refreshToken && !renewed && !refreshRejected) {
      renewed = await refreshSession(refreshToken);
      refreshRejected = renewed === null;
      if (renewed) {
        backendResponse = await forward(backendPath, search, method, body, renewed.access_token);
      }
    }
  } catch {
    return errorResponse(502, "BACKEND_UNAVAILABLE", "The service is temporarily unavailable.");
  }

  const response = new NextResponse(
    backendResponse.status === 204 ? null : await backendResponse.arrayBuffer(),
    {
      status: backendResponse.status,
      headers: passthroughHeaders(backendResponse),
    },
  );
  if (renewed) setSessionCookies(response, renewed);
  if (refreshRejected) clearSessionCookies(response);
  return response;
}

/**
 * Pick the response headers worth forwarding to the browser.
 *
 * Only content type, request id and Retry-After: never cookies or other
 * backend headers.
 *
 * @param response The backend response.
 * @returns A Headers object to put on our response.
 */
// Copy only a few safe headers back to the browser (never cookies from the backend).
function passthroughHeaders(response: Response): Headers {
  const headers = new Headers();
  for (const name of ["content-type", "x-request-id", "retry-after"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

/**
 * Build a standard-shaped error response (same JSON shape as the backend's).
 *
 * @param status HTTP status.
 * @param code Machine-readable code.
 * @param message Human-readable message.
 * @returns The JSON response.
 */
// Builds an error JSON in the same shape as the backend: {error: {code, message}}.
function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Use the same function for all four HTTP methods.
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
