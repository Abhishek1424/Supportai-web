/**
 * Server-only helpers for the session cookies and for talking to FastAPI.
 *
 * Responsibility: this is the "backend-for-frontend" core. It stores the JWT
 * access token and the refresh token in httpOnly cookies, so JavaScript in the
 * browser (including any injected by an XSS bug) can never read them.
 *
 * Never import this file from client components.
 */
import "server-only";

import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session-constants";

/** Matches the backend's REFRESH_TOKEN_TTL_DAYS default. The backend is the real authority. */
const REFRESH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** How long a finished refresh result is reused by late parallel requests (see refreshSession). */
const REFRESH_REUSE_WINDOW_MS = 10_000;

/** Token response of the backend's login/register/refresh endpoints. */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Base URL of the FastAPI backend (server-side env var, never sent to the browser).
 *
 * @returns URL without a trailing slash.
 */
export function backendUrl(): string {
  return (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/\/$/, "");
}

/**
 * Call the FastAPI backend.
 *
 * @param path Path after the host, e.g. "/api/v1/auth/login".
 * @param init Standard fetch options.
 * @returns The raw backend Response.
 */
export function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${backendUrl()}${path}`, { ...init, cache: "no-store" });
}

/**
 * Write the session cookies onto a response.
 *
 * Cookie flags and why:
 * - httpOnly: JavaScript cannot read the tokens.
 * - sameSite=lax: other sites cannot make the browser send them on cross-site
 *   POSTs (our CSRF defence, together with the Origin check in origin.ts).
 * - secure (production): only sent over HTTPS.
 * - The access cookie expires with the JWT; the refresh cookie lives longer so
 *   the proxy can silently renew the session.
 *
 * @param response The response being returned to the browser.
 * @param tokens Fresh tokens from the backend.
 * @returns The same response, for chaining.
 */
export function setSessionCookies(response: NextResponse, tokens: TokenPair): NextResponse {
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  response.cookies.set(ACCESS_COOKIE, tokens.access_token, { ...base, maxAge: tokens.expires_in });
  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...base,
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

/**
 * Delete both session cookies (logout, or a refresh that failed).
 *
 * @param response The response being returned to the browser.
 * @returns The same response.
 */
export function clearSessionCookies(response: NextResponse): NextResponse {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

/**
 * In-flight and recently finished refreshes, keyed by the refresh token used.
 *
 * Why this exists: the backend rotates refresh tokens and treats a second use
 * of the same token as theft (it then revokes the whole session). A dashboard
 * page fires several API calls at once; if the access token has just expired,
 * ALL of them would try to refresh with the same token and the second would
 * log the user out. Sharing one refresh among them avoids that.
 *
 * Limitation: this is per Node.js process. Running several server instances
 * needs sticky sessions or a shared lock (e.g. Redis).
 */
const refreshes = new Map<string, Promise<TokenPair | null>>();

/**
 * Exchange a refresh token for new tokens, de-duplicating parallel calls.
 *
 * Flow:
 * 1. If a refresh with this token is running (or finished < 10s ago), reuse it.
 * 2. Otherwise call the backend's /auth/refresh.
 * 3. Remember the result briefly so slightly later requests that still carry
 *    the old cookie get the same new tokens.
 *
 * @param refreshToken The refresh token from the cookie.
 * @returns New tokens, or null if the backend rejected the token.
 */
export function refreshSession(refreshToken: string): Promise<TokenPair | null> {
  const existing = refreshes.get(refreshToken);
  if (existing) return existing;

  const attempt = requestRefresh(refreshToken).finally(() => {
    setTimeout(() => refreshes.delete(refreshToken), REFRESH_REUSE_WINDOW_MS).unref?.();
  });
  refreshes.set(refreshToken, attempt);
  return attempt;
}

/**
 * Perform the actual backend refresh call.
 *
 * @param refreshToken The refresh token to exchange.
 * @returns The new tokens, or null on any failure (invalid, expired, backend down).
 */
async function requestRefresh(refreshToken: string): Promise<TokenPair | null> {
  try {
    const response = await backendFetch("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return response.ok ? ((await response.json()) as TokenPair) : null;
  } catch {
    return null;
  }
}

/** Test helper: forget remembered refreshes. */
export function resetRefreshCacheForTests(): void {
  refreshes.clear();
}
