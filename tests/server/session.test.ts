import { refreshSession, resetRefreshCacheForTests } from "@/lib/server/session";

const TOKENS = { access_token: "new-access", refresh_token: "new-refresh", expires_in: 900 };

describe("refreshSession", () => {
  beforeEach(() => resetRefreshCacheForTests());

  it("shares ONE backend call among parallel requests (avoids false theft detection)", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(TOKENS), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await Promise.all([refreshSession("old"), refreshSession("old"), refreshSession("old")]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r?.access_token === "new-access")).toBe(true);
  });

  it("returns null when the backend rejects the token", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
    await expect(refreshSession("revoked")).resolves.toBeNull();
  });

  it("returns null when the backend is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    await expect(refreshSession("anything")).resolves.toBeNull();
  });
});
