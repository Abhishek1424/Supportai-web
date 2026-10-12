// Widget-style tests for login and register forms: type, tap, check navigation and error
//   text.
//
// Test guide (Flutter idea):
//   describe(...)  ~ group(...)          it(...)  ~ test(...)         expect(...) ~
//     expect(...)
//   vi.fn / vi.stubGlobal ~ a mock (like mockito)   render(<X />) ~ tester.pumpWidget(X())
//   screen.getByRole/getByText ~ find.byType/find.text   userEvent.click/type ~
//     tester.tap/enterText
//   await screen.findBy... ~ await tester.pumpAndSettle() then find
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginForm } from "@/features/auth/LoginForm";
import { RegisterForm } from "@/features/auth/RegisterForm";
import { mockFetch, renderWithClient } from "../utils";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

describe("LoginForm", () => {
  beforeEach(() => replace.mockClear());

  it("logs in and goes to the dashboard", async () => {
    const fetchMock = mockFetch({ "POST /api/auth/login": { body: { ok: true } } });
    renderWithClient(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Email"), "owner@abc.com");
    await userEvent.type(screen.getByLabelText("Password"), "correct-horse-battery");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      email: "owner@abc.com",
      password: "correct-horse-battery",
    });
  });

  it("shows the backend's error and stays on the page when credentials are wrong", async () => {
    mockFetch({
      "POST /api/auth/login": { status: 401, body: { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } } },
    });
    renderWithClient(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Email"), "owner@abc.com");
    await userEvent.type(screen.getByLabelText("Password"), "nope");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("RegisterForm", () => {
  beforeEach(() => replace.mockClear());

  it("creates the account and goes to the dashboard", async () => {
    const fetchMock = mockFetch({ "POST /api/auth/register": { status: 201, body: { ok: true } } });
    renderWithClient(<RegisterForm />);

    await userEvent.type(screen.getByLabelText("Your name"), "Olivia Owner");
    await userEvent.type(screen.getByLabelText("Company name"), "ABC Insurance");
    await userEvent.type(screen.getByLabelText("Work email"), "owner@abc.com");
    await userEvent.type(screen.getByLabelText("Password"), "correct-horse-battery");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({ organization_name: "ABC Insurance" });
  });

  it("shows a duplicate-email error from the backend", async () => {
    mockFetch({
      "POST /api/auth/register": { status: 409, body: { error: { code: "EMAIL_ALREADY_REGISTERED", message: "Email is already registered." } } },
    });
    renderWithClient(<RegisterForm />);

    await userEvent.type(screen.getByLabelText("Your name"), "A");
    await userEvent.type(screen.getByLabelText("Company name"), "B");
    await userEvent.type(screen.getByLabelText("Work email"), "dup@abc.com");
    await userEvent.type(screen.getByLabelText("Password"), "correct-horse-battery");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("already registered");
  });
});
