// Tests for the proxy path allow-list and the CSRF origin check. Pure functions.
import { isSameOriginRequest } from "@/lib/server/origin";
import { buildBackendPath } from "@/lib/server/proxy-path";

describe("buildBackendPath", () => {
  it("maps segments onto /api/v1", () => {
    expect(buildBackendPath(["audit-logs"])).toBe("/api/v1/audit-logs");
    expect(buildBackendPath(["organizations", "current", "members", "abc"])).toBe("/api/v1/organizations/current/members/abc");
  });

  it("rejects path traversal and empty segments", () => {
    expect(buildBackendPath([])).toBeNull();
    expect(buildBackendPath(["..", "health"])).toBeNull();
    expect(buildBackendPath(["a", "", "b"])).toBeNull();
  });

  it("blocks token-issuing auth endpoints but allows /auth/me", () => {
    for (const name of ["login", "register", "refresh", "logout"]) {
      expect(buildBackendPath(["auth", name])).toBeNull();
    }
    expect(buildBackendPath(["auth", "me"])).toBe("/api/v1/auth/me");
  });

  it("encodes segments so they cannot smuggle extra path or query", () => {
    expect(buildBackendPath(["a?b=c#d"])).toBe("/api/v1/a%3Fb%3Dc%23d");
  });
});

describe("isSameOriginRequest (CSRF check)", () => {
  it("always allows read-only methods", () => {
    expect(isSameOriginRequest("GET", null, "app.com")).toBe(true);
  });

  it("allows unsafe methods from our own origin", () => {
    expect(isSameOriginRequest("POST", "https://app.com", "app.com")).toBe(true);
  });

  it("rejects cross-site, missing and malformed origins on unsafe methods", () => {
    expect(isSameOriginRequest("POST", "https://evil.com", "app.com")).toBe(false);
    expect(isSameOriginRequest("DELETE", null, "app.com")).toBe(false);
    expect(isSameOriginRequest("PATCH", "not a url", "app.com")).toBe(false);
  });
});
