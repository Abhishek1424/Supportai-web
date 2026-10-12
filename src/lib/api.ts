// What is this file?   The API client of the web app. All HTTP calls from React code go
//   here.
// Why?                 One place for headers, JSON, errors and "session ended" handling.
// Flutter/Dart idea:   your `ApiService` / Dio client with an error interceptor.
//                      `fetch` ~ Dio.get/post. `Promise` ~ Future. `await` ~ await.
// Data flow:  Widget(component) -> hook -> apiFetch -> /api/proxy/... (Next server) ->
//   FastAPI
// IMPORTANT:  the browser NEVER calls FastAPI directly and never holds the token.
//             The Next server adds the token from a cookie.
/**
 * Browser-side API client.
 *
 * Responsibility: every call from React code to the backend goes through here.
 * The browser never talks to FastAPI directly and never holds a token. It
 * calls this app's own `/api/proxy/*` and `/api/auth/*` routes, which attach
 * the credentials from httpOnly cookies on the server (see lib/server/).
 */

/** Where the Next.js server forwards authenticated API calls. */
// Like a Dio `baseUrl`. Calls go to our own Next server, not to the backend.
const PROXY_PREFIX = "/api/proxy";
const AUTH_PREFIX = "/api/auth";

/** Error codes meaning "your session is gone": the UI must send you to /login. */
// If the backend returns one of these codes, the login is over and we go to /login. A `Set`
//   is the same as a Dart Set.
const SESSION_ERROR_CODES = new Set(["NOT_AUTHENTICATED", "INVALID_TOKEN", "REFRESH_TOKEN_REUSED"]);

/**
 * A failed API call, carrying the backend's structured error.
 *
 * Why a class: components can do `err instanceof ApiError` and branch on the
 * stable `code` (e.g. "EMAIL_ALREADY_REGISTERED") instead of parsing messages.
 */
// Our own error type. Dart idea: `class ApiError implements Exception` with status, code,
//   message.
// Components check the `code` text (like "EMAIL_ALREADY_REGISTERED") instead of the
//   message.
export class ApiError extends Error {
  /**
   * @param status HTTP status code.
   * @param code Machine-readable code from the backend (or NETWORK_ERROR).
   * @param message Safe, human-readable text to show the user.
   * @param requestId Backend request id the user can quote to support.
   * @param details Field-level validation problems for 422 responses.
   */
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string | null,
    public readonly details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Options accepted by the request helpers. */
// Optional settings of one call: method, JSON body, query params. Dart idea: named
//   parameters.
export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Will be JSON-encoded. */
  body?: unknown;
  /** Query-string values; undefined/empty values are skipped. */
  query?: Record<string, string | number | undefined>;
}

/**
 * Turn a failed fetch Response into an ApiError.
 *
 * Why: the backend always answers errors as `{"error": {code, message, ...}}`.
 * If something else answers (a proxy page, an outage) we still produce a
 * usable error instead of crashing on JSON.parse.
 *
 * @param response A non-2xx response.
 * @returns The ApiError to throw.
 */
// Turns a failed response into an ApiError. Like reading
//   `DioException.response?.data['error']`.
export async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = await response.json();
    const error = body?.error;
    if (error?.code && error?.message) {
      return new ApiError(response.status, error.code, error.message, error.request_id, error.details);
    }
  } catch {
    // Body was not JSON; fall through to the generic error below.
  }
  return new ApiError(response.status, "HTTP_ERROR", "Something went wrong. Please try again.");
}

/**
 * Build a query string, skipping empty values.
 *
 * @param query Raw key/values.
 * @returns "" or "?a=1&b=2".
 */
// Makes `?page=2&q=abc` from a map and skips empty values. Dart idea: `Uri(queryParameters:
//   ...)`.
export function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

/**
 * Perform a fetch and return parsed JSON (or undefined for 204).
 *
 * Flow:
 * 1. Send the request (cookies are attached automatically by the browser).
 * 2. On network failure, throw a NETWORK_ERROR ApiError.
 * 3. On a non-2xx answer, convert it to ApiError. If it means the session
 *    ended, redirect to /login (only when `redirectOnSessionEnd` is true).
 * 4. Otherwise return the JSON body.
 *
 * @param url Full URL path on this origin.
 * @param options Method/body/query.
 * @param redirectOnSessionEnd False for login/register, where a 401 is a normal "wrong password".
 * @returns The parsed response body.
 * @throws ApiError
 */
// The core function. `<T>` = generic return type, like `Future<T> request<T>()`.
// Flow: send -> network error? throw ApiError -> not 2xx? throw ApiError
//       (and go to /login if the session ended) -> else return the JSON.
// `window.location.assign('/login')` ~ `Navigator.pushReplacementNamed('/login')`.
async function request<T>(
  url: string,
  options: RequestOptions,
  redirectOnSessionEnd: boolean,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url + buildQuery(options.query), {
      method: options.method ?? "GET",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Cannot reach the server. Check your connection.");
  }

  if (!response.ok) {
    const error = await toApiError(response);
    if (redirectOnSessionEnd && response.status === 401 && SESSION_ERROR_CODES.has(error.code)) {
      if (typeof window !== "undefined") window.location.assign("/login");
    }
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * Call an authenticated backend endpoint through the Next.js proxy.
 *
 * @param path Backend path after `/api/v1`, e.g. "/organizations/current/members".
 * @param options Method/body/query.
 * @returns The parsed response body.
 * @throws ApiError
 */
// Use this for normal calls after login. Example: `apiFetch<Me>('/auth/me')`.
export function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(`${PROXY_PREFIX}${path}`, options, true);
}

/**
 * Call one of this app's session endpoints (login / register / logout).
 *
 * @param action Which session action to perform.
 * @param body Credentials for login/register; omitted for logout.
 * @returns Nothing useful: on success the server has set the session cookies.
 * @throws ApiError, e.g. INVALID_CREDENTIALS
 */
// Only for login / register / logout. The server sets cookies; no token comes back to
//   JavaScript.
export function authFetch(action: "login" | "register" | "logout", body?: unknown): Promise<void> {
  return request<void>(`${AUTH_PREFIX}/${action}`, { method: "POST", body }, false);
}

/**
 * Convert any thrown value into text that is safe to show a user.
 *
 * Why: components should not each decide how to display errors. For
 * validation errors (422) the first field message is included so the user
 * knows what to fix.
 *
 * @param error Whatever was thrown (usually an ApiError).
 * @returns A short, user-facing message.
 */
// Turns any error into short text safe for the user. Components call it to fill the red
//   Alert box.
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const first = error.details?.[0];
    return first ? `${error.message} (${first.field}: ${first.message})` : error.message;
  }
  return "Something went wrong. Please try again.";
}
