// What is this file?   Safety check for the proxy: which backend URLs may the browser
//   reach?
// Rules:               only /api/v1/..., no `..` tricks, and no login/refresh endpoints.
// Why?                 The proxy must not become an open door to the backend.
/** The only auth endpoint the browser may reach through the proxy. */
const ALLOWED_AUTH_PATH = "auth/me";

/**
 * Validate and build the backend URL path for a proxied call.
 *
 * Why it exists: the proxy must not become an open relay. Only `/api/v1/...`
 * is reachable, and token-issuing auth endpoints are blocked so tokens can
 * only ever flow through the cookie-setting routes.
 *
 * Rules:
 * - Reject `.` / `..` / empty segments (path traversal).
 * - Block `auth/*` except `auth/me`.
 * - Every segment is URL-encoded.
 *
 * @param segments URL segments after `/api/proxy/`.
 * @returns The backend path (e.g. "/api/v1/audit-logs"), or null if not allowed.
 */
export function buildBackendPath(segments: string[]): string | null {
  if (segments.length === 0 || segments.some((s) => s === "" || s === "." || s === "..")) {
    return null;
  }
  const joined = segments.join("/");
  if (segments[0] === "auth" && joined !== ALLOWED_AUTH_PATH) return null;
  return `/api/v1/${segments.map(encodeURIComponent).join("/")}`;
}
