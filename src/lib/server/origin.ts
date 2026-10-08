/**
 * CSRF defence for cookie-authenticated routes.
 *
 * Because the session lives in cookies, a malicious site could try to make a
 * logged-in user's browser send a state-changing request to us. SameSite=Lax
 * already blocks most of that; this check adds a second layer by requiring
 * that unsafe requests come from our own origin.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Decide whether a request is allowed from a CSRF standpoint.
 *
 * Rules:
 * - Safe (read-only) methods are always allowed.
 * - For unsafe methods the `Origin` header must be present and its host must
 *   equal the `Host` header of this server. Browsers always send Origin on
 *   cross-site POST/PATCH/DELETE, so a forged request cannot pass.
 *
 * @param method HTTP method of the incoming request.
 * @param origin Value of the Origin header (or null).
 * @param host Value of the Host header (or null).
 * @returns True if the request may proceed.
 */
export function isSameOriginRequest(
  method: string,
  origin: string | null,
  host: string | null,
): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
