// Helpers shared by tests: fake users, fake API (mockFetch) and a cache wrapper.
//
// Test guide (Flutter idea):
//   describe(...)  ~ group(...)          it(...)  ~ test(...)         expect(...) ~
//     expect(...)
//   vi.fn / vi.stubGlobal ~ a mock (like mockito)   render(<X />) ~ tester.pumpWidget(X())
//   screen.getByRole/getByText ~ find.byType/find.text   userEvent.click/type ~
//     tester.tap/enterText
//   await screen.findBy... ~ await tester.pumpAndSettle() then find
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

import type { Me, Member, Permission, Role } from "@/lib/types";

/** Permissions per role, copied from the backend so tests reflect reality. */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ["org:read", "org:update", "members:read", "members:manage", "audit:read"],
  admin: ["org:read", "org:update", "members:read", "members:manage", "audit:read"],
  agent: ["org:read", "members:read"],
  viewer: ["org:read", "members:read"],
};

/**
 * Build a Me payload for a role.
 *
 * @param role Role of the fake logged-in user.
 * @returns A complete Me object.
 */
export function makeMe(role: Role = "owner"): Me {
  return {
    user: { id: "u1", email: "owner@abc.com", full_name: "Olivia Owner" },
    organization: { id: "o1", name: "ABC Insurance", slug: "abc-insurance-1", created_at: "2026-01-01T00:00:00Z" },
    role,
    permissions: ROLE_PERMISSIONS[role],
  };
}

/**
 * Build a Member row.
 *
 * @param overrides Fields to change.
 * @returns A Member.
 */
export function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: "m1",
    user_id: "u2",
    email: "agent@abc.com",
    full_name: "Alex Agent",
    role: "agent",
    created_at: "2026-02-01T10:00:00Z",
    ...overrides,
  };
}

/** A canned fetch answer. */
export interface MockReply {
  status?: number;
  body?: unknown;
}

/**
 * Replace global fetch with a router keyed by "METHOD /path" (query string ignored).
 *
 * Why: tests exercise real components and hooks against fake HTTP, so they
 * verify what the user sees without needing a backend.
 *
 * @param routes Map of "GET /api/proxy/auth/me" -> reply (or a function returning one).
 * @returns The fetch mock, so tests can assert on the calls made.
 */
// Replaces the real network with a fake. Pass a map like 'GET /path' -> response. Like a
//   MockDio.
export function mockFetch(routes: Record<string, MockReply | ((init?: RequestInit) => MockReply)>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    const key = `${init?.method ?? "GET"} ${url.pathname}`;
    const route = routes[key];
    if (!route) throw new Error(`Unmocked request: ${key}`);
    const reply = typeof route === "function" ? route(init) : route;
    const status = reply.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(reply.body ?? {}), { status });
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

/**
 * Wrapper giving components a fresh, non-retrying query cache.
 *
 * @returns A wrapper component for render()/renderHook().
 */
// Gives the component a fresh data cache, like wrapping a widget in a Provider for a widget
//   test.
export function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/**
 * Render a component inside the query provider.
 *
 * @param ui The element to render.
 * @returns Testing Library's render result.
 */
export function renderWithClient(ui: ReactElement) {
  return render(ui, { wrapper: createWrapper() });
}
