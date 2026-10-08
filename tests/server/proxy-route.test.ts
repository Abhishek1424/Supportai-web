// @vitest-environment node
import { NextRequest } from "next/server";

import { GET, POST } from "@/app/api/proxy/[...path]/route";
import { resetRefreshCacheForTests } from "@/lib/server/session";

/** Build a request to the proxy as a browser would send it. */
function proxyRequest(path: string, init: { method?: string; cookie?: string; origin?: string; body?: string } = {}) {
  return new NextRequest(`http://app.test/api/proxy/${path}`, {
    method: init.method ?? "GET",
    headers: {
      host: "app.test",
      ...(init.cookie && { cookie: init.cookie }),
      ...(init.origin && { origin: init.origin }),
    },
    body: init.body,
  });
}

const context = (path: string) => ({ params: Promise.resolve({ path: path.split("/") }) });

describe("proxy route", () => {
  beforeEach(() => resetRefreshCacheForTests());

  it("adds the bearer token from the httpOnly cookie", async () => {
    const backend = vi.fn(async () => new Response(JSON.stringify({ ok: 1 }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", backend);

    const response = await GET(proxyRequest("audit-logs", { cookie: "sa_access=tok123" }), context("audit-logs"));

    expect(response.status).toBe(200);
    const [url, init] = backend.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/api/v1/audit-logs");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok123");
  });

  it("refreshes an expired session and retries once, setting new cookies", async () => {
    const backend = vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith("/auth/refresh")) {
        return new Response(JSON.stringify({ access_token: "fresh", refresh_token: "fresh-r", expires_in: 900 }), { status: 200 });
      }
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === "Bearer fresh"
        ? new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
        : new Response("{}", { status: 401 });
    });
    vi.stubGlobal("fetch", backend);

    const response = await GET(proxyRequest("auth/me", { cookie: "sa_access=expired; sa_refresh=r1" }), context("auth/me"));

    expect(response.status).toBe(200);
    expect(response.cookies.get("sa_access")?.value).toBe("fresh");
    expect(response.cookies.get("sa_access")).toMatchObject({ httpOnly: true, sameSite: "lax" });
  });

  it("clears the cookies when the refresh token is rejected", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
    const response = await GET(proxyRequest("auth/me", { cookie: "sa_refresh=dead" }), context("auth/me"));
    expect(response.status).toBe(401);
    expect(response.cookies.get("sa_access")?.value).toBe("");
  });

  it("refuses token-issuing endpoints and never calls the backend", async () => {
    const backend = vi.fn();
    vi.stubGlobal("fetch", backend);
    const response = await POST(
      proxyRequest("auth/refresh", { method: "POST", origin: "http://app.test", body: "{}" }),
      context("auth/refresh"),
    );
    expect(response.status).toBe(404);
    expect(backend).not.toHaveBeenCalled();
  });

  it("blocks cross-site writes (CSRF)", async () => {
    const backend = vi.fn();
    vi.stubGlobal("fetch", backend);
    const response = await POST(
      proxyRequest("organizations/current/members", { method: "POST", origin: "https://evil.com", cookie: "sa_access=t", body: "{}" }),
      context("organizations/current/members"),
    );
    expect(response.status).toBe(403);
    expect(backend).not.toHaveBeenCalled();
  });

  it("returns a friendly 502 when the backend is down", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const response = await GET(proxyRequest("audit-logs", { cookie: "sa_access=t" }), context("audit-logs"));
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ error: { code: "BACKEND_UNAVAILABLE" } });
  });
});
