import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import Home from "./page";

afterEach(cleanup);

test("renders the heading and the primary actions", () => {
  render(<Home />);

  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
    "edit the page.tsx file",
  );
  expect(screen.getByRole("link", { name: /deploy now/i })).toBeDefined();
  expect(screen.getByRole("link", { name: /documentation/i })).toBeDefined();
});
