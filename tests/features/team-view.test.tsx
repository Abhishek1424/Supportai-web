import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TeamView } from "@/features/members/TeamView";
import { makeMe, makeMember, mockFetch, renderWithClient } from "../utils";

const MEMBERS_URL = "/api/proxy/organizations/current/members";

const owner = makeMember({ id: "m0", user_id: "u1", email: "owner@abc.com", full_name: "Olivia Owner", role: "owner" });
const agent = makeMember();

/** Standard backend answers for the team screen. */
function teamRoutes(role: Parameters<typeof makeMe>[0]) {
  return {
    "GET /api/proxy/auth/me": { body: makeMe(role) },
    [`GET ${MEMBERS_URL}`]: { body: { items: [owner, agent], total: 2, page: 1, page_size: 10 } },
  };
}

describe("TeamView", () => {
  it("lists members; an owner sees management controls", async () => {
    mockFetch(teamRoutes("owner"));
    renderWithClient(<TeamView />);

    expect(await screen.findByText("Alex Agent")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add member" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Alex Agent" })).toBeInTheDocument();
  });

  it("a viewer can look but not manage (no add, no role dropdowns, no remove)", async () => {
    mockFetch(teamRoutes("viewer"));
    renderWithClient(<TeamView />);

    expect(await screen.findByText("Alex Agent")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add member" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /Role for/ })).not.toBeInTheDocument();
  });

  it("an admin cannot edit or remove the owner but can manage an agent", async () => {
    mockFetch(teamRoutes("admin"));
    renderWithClient(<TeamView />);

    await screen.findByText("Alex Agent");
    expect(screen.queryByRole("button", { name: "Remove Olivia Owner" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Alex Agent" })).toBeInTheDocument();
  });

  it("adds a member through the dialog and sends the chosen role", async () => {
    const fetchMock = mockFetch({
      ...teamRoutes("owner"),
      [`POST ${MEMBERS_URL}`]: { status: 201, body: makeMember({ id: "m3", email: "new@abc.com", full_name: "New Person" }) },
    });
    renderWithClient(<TeamView />);
    await screen.findByText("Alex Agent");

    await userEvent.click(screen.getByRole("button", { name: "Add member" }));
    const dialog = screen.getByRole("dialog", { name: "Add team member" });
    await userEvent.type(within(dialog).getByLabelText("Email"), "new@abc.com");
    await userEvent.selectOptions(within(dialog).getByLabelText("Role"), "admin");
    await userEvent.type(within(dialog).getByLabelText("Full name"), "New Person");
    await userEvent.type(within(dialog).getByLabelText("Initial password"), "long-enough-pass");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add member" }));

    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(JSON.parse(String(post?.[1]?.body))).toEqual({
      email: "new@abc.com",
      role: "admin",
      full_name: "New Person",
      password: "long-enough-pass",
    });
  });

  it("explains what is missing when the email has no account yet", async () => {
    mockFetch({
      ...teamRoutes("owner"),
      [`POST ${MEMBERS_URL}`]: {
        status: 400,
        body: { error: { code: "NEW_USER_DETAILS_REQUIRED", message: "full_name and password are required for a new user." } },
      },
    });
    renderWithClient(<TeamView />);
    await screen.findByText("Alex Agent");

    await userEvent.click(screen.getByRole("button", { name: "Add member" }));
    const dialog = screen.getByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Email"), "unknown@abc.com");
    await userEvent.click(within(dialog).getByRole("button", { name: "Add member" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("has no account yet");
  });

  it("removes a member only after confirmation", async () => {
    const fetchMock = mockFetch({ ...teamRoutes("owner"), [`DELETE ${MEMBERS_URL}/m1`]: { status: 204 } });
    const confirm = vi.spyOn(window, "confirm");
    renderWithClient(<TeamView />);
    await screen.findByText("Alex Agent");

    confirm.mockReturnValueOnce(false);
    await userEvent.click(screen.getByRole("button", { name: "Remove Alex Agent" }));
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(false);

    confirm.mockReturnValueOnce(true);
    await userEvent.click(screen.getByRole("button", { name: "Remove Alex Agent" }));
    await vi.waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === "DELETE")).toBe(true));
  });

  it("shows backend rule violations, e.g. demoting the last owner", async () => {
    mockFetch({
      ...teamRoutes("owner"),
      [`PATCH ${MEMBERS_URL}/m1`]: {
        status: 409,
        body: { error: { code: "LAST_OWNER", message: "An organization must keep at least one owner." } },
      },
    });
    renderWithClient(<TeamView />);
    await screen.findByText("Alex Agent");

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Role for Alex Agent" }), "viewer");

    expect(await screen.findByRole("alert")).toHaveTextContent("at least one owner");
  });
});
