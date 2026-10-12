// Runs before every test file. After each test it cleans the screen and resets mocks, like
//   `tearDown`.
//
// Test guide (Flutter idea):
//   describe(...)  ~ group(...)          it(...)  ~ test(...)         expect(...) ~
//     expect(...)
//   vi.fn / vi.stubGlobal ~ a mock (like mockito)   render(<X />) ~ tester.pumpWidget(X())
//   screen.getByRole/getByText ~ find.byType/find.text   userEvent.click/type ~
//     tester.tap/enterText
//   await screen.findBy... ~ await tester.pumpAndSettle() then find
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Unmount rendered components and reset mocks so tests cannot leak into each other.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
