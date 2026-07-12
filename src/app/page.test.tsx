import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import Home from "./page";

afterEach(cleanup);

test("renders the heading and a live path into the planning flow", () => {
  render(<Home />);

  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
    "Plan budget-aware trips",
  );
  expect(
    screen.getByRole("link", { name: /plan a trip/i }).getAttribute("href"),
  ).toBe("/plan");
});
