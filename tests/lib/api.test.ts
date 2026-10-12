// Unit tests for the API client with a fake network. Checks error mapping, redirect to
//   /login, and JSON handling.
import { ApiError, apiFetch, authFetch, buildQuery, getErrorMessage, toApiError } from "@/lib/api";
import { mockFetch } from "../utils";

describe("buildQuery", () => {
  it("skips empty and undefined values", () => {
    expect(buildQuery({ page: 2, q: "", sort: undefined, name: "a b" })).toBe("?page=2&name=a+b");
    expect(buildQuery({})).toBe("");
    expect(buildQuery(undefined)).toBe("");
  });
});

describe("toApiError", () => {
  it("reads the backend's structured error", async () => {
    const response = new Response(
      JSON.stringify({ error: { code: "MEMBER_NOT_FOUND", message: "Member could not be found.", request_id: "r1" } }),
      { status: 404 },
    );
    const error = await toApiError(response);
    expect(error).toMatchObject({ status: 404, code: "MEMBER_NOT_FOUND", requestId: "r1" });
  });

  it("falls back to a generic error when the body is not our format", async () => {
    const error = await toApiError(new Response("<html>Bad gateway</html>", { status: 502 }));
    expect(error.code).toBe("HTTP_ERROR");
    expect(error.message).not.toContain("html");
  });
});

describe("getErrorMessage", () => {
  it("includes the first field problem for validation errors", () => {
    const error = new ApiError(422, "VALIDATION_ERROR", "Request validation failed.", null, [
      { field: "body.email", message: "not a valid email" },
    ]);
    expect(getErrorMessage(error)).toContain("body.email");
  });

  it("hides unknown errors behind a generic message", () => {
    expect(getErrorMessage(new TypeError("secret internals"))).toBe("Something went wrong. Please try again.");
  });
});

describe("apiFetch", () => {
  it("sends JSON bodies and parses JSON answers", async () => {
    const fetchMock = mockFetch({ "POST /api/proxy/things": { status: 201, body: { id: "1" } } });
    const result = await apiFetch<{ id: string }>("/things", { method: "POST", body: { a: 1 } });
    expect(result).toEqual({ id: "1" });
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ body: '{"a":1}', headers: { "Content-Type": "application/json" } });
  });

  it("returns undefined for 204 No Content", async () => {
    mockFetch({ "DELETE /api/proxy/things/1": { status: 204 } });
    await expect(apiFetch("/things/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("redirects to /login when the session has ended", async () => {
    mockFetch({ "GET /api/proxy/auth/me": { status: 401, body: { error: { code: "INVALID_TOKEN", message: "x" } } } });
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    await expect(apiFetch("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(assign).toHaveBeenCalledWith("/login");
  });

  it("does NOT redirect on a normal login failure", async () => {
    mockFetch({ "POST /api/auth/login": { status: 401, body: { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } } } });
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    await expect(authFetch("login", { email: "a@b.com", password: "x" })).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(assign).not.toHaveBeenCalled();
  });

  it("reports network failures with a friendly error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiFetch("/x")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});
