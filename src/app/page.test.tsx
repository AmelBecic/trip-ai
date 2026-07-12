import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import Home from "./page";

afterEach(cleanup);

test("renders the value-prop heading and the primary CTA into /plan", () => {
  render(<Home />);

  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
    "fits your budget",
  );
  expect(
    screen.getByRole("link", { name: /plan a trip/i }).getAttribute("href"),
  ).toBe("/plan");
});

test("offers a secondary path to saved trips", () => {
  render(<Home />);

  expect(
    screen.getByRole("link", { name: /view saved trips/i }).getAttribute("href"),
  ).toBe("/saved");
});
