import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

// next/navigation needs the app-router context, absent under jsdom. Capture
// refresh() so the retry action can be asserted.
const nav = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: nav.refresh }),
}));

import { ErrorState } from "./error-state";

afterEach(() => {
  nav.refresh.mockClear();
  cleanup();
});

test("announces the failure to assistive tech", () => {
  render(<ErrorState />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/something went wrong/i);
  expect(screen.getByRole("alert")).not.toBeNull();
});

test("shows a custom message when provided", () => {
  render(<ErrorState message="The trip service is unavailable." />);
  expect(screen.getByRole("alert").textContent).toBe("The trip service is unavailable.");
});

test("retry re-runs the route via router.refresh()", () => {
  render(<ErrorState />);
  fireEvent.click(screen.getByRole("button", { name: /try again/i }));
  expect(nav.refresh).toHaveBeenCalledOnce();
});

test("offers a route back to the search form", () => {
  render(<ErrorState />);
  const back = screen.getByRole("link", { name: /back to search/i });
  expect(back.getAttribute("href")).toBe("/plan");
});
