// Tests the data hooks alone (no screen). `renderHook` runs a hook like a provider in a
//   test.
import { renderHook, waitFor } from "@testing-library/react";

import { useMembers, useRemoveMember } from "@/features/members/hooks";
import { createWrapper, makeMember, mockFetch } from "../utils";

describe("useMembers", () => {
  it("maps UI params onto the backend's query string", async () => {
    const fetchMock = mockFetch({
      "GET /api/proxy/organizations/current/members": {
        body: { items: [makeMember()], total: 1, page: 2, page_size: 5 },
      },
    });

    const { result } = renderHook(
      () => useMembers({ page: 2, pageSize: 5, q: "alex", sortBy: "email", sortOrder: "desc" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.data?.total).toBe(1));
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("page=2");
    expect(url).toContain("page_size=5");
    expect(url).toContain("q=alex");
    expect(url).toContain("sort_by=email");
    expect(url).toContain("sort_order=desc");
  });
});

describe("useRemoveMember", () => {
  it("sends DELETE for the member id", async () => {
    const fetchMock = mockFetch({ "DELETE /api/proxy/organizations/current/members/m9": { status: 204 } });
    const { result } = renderHook(() => useRemoveMember(), { wrapper: createWrapper() });

    result.current.mutate("m9");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "DELETE" });
  });
});
