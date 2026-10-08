import { render, screen } from "@testing-library/react";

import { AuditTable, summariseDetails } from "@/features/audit/AuditTable";
import { AuditView } from "@/features/audit/AuditView";
import type { AuditLogEntry } from "@/lib/types";
import { makeMe, mockFetch, renderWithClient } from "../utils";

const entry = (overrides: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
  id: "a1",
  actor_user_id: "u1",
  action: "organization.updated",
  resource_type: "organization",
  resource_id: "o1",
  details: { old_name: "A", new_name: "B" },
  ip_address: "10.0.0.1",
  created_at: "2026-03-01T12:00:00Z",
  ...overrides,
});

describe("summariseDetails", () => {
  it("renders key/value pairs and handles empty details", () => {
    expect(summariseDetails({ old_role: "agent", new_role: "admin" })).toBe("old_role: agent, new_role: admin");
    expect(summariseDetails({})).toBe("");
  });
});

describe("AuditTable", () => {
  it("displays markup in details as inert text (XSS safety)", () => {
    render(<AuditTable entries={[entry({ details: { new_name: "<img src=x onerror=alert(1)>" } })]} />);
    expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("shows an empty state", () => {
    render(<AuditTable entries={[]} />);
    expect(screen.getByText("No audit entries found.")).toBeInTheDocument();
  });
});

describe("AuditView", () => {
  it("shows entries to an admin", async () => {
    mockFetch({
      "GET /api/proxy/auth/me": { body: makeMe("admin") },
      "GET /api/proxy/audit-logs": { body: { items: [entry()], total: 1, page: 1, page_size: 15 } },
    });
    renderWithClient(<AuditView />);
    expect(await screen.findByText("organization.updated")).toBeInTheDocument();
  });

  it("explains missing permission to an agent and never calls the audit API", async () => {
    const fetchMock = mockFetch({ "GET /api/proxy/auth/me": { body: makeMe("agent") } });
    renderWithClient(<AuditView />);
    expect(await screen.findByRole("alert")).toHaveTextContent("do not have permission");
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("audit-logs"))).toBe(false);
  });
});
