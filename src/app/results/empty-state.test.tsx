import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { EmptyState } from "./empty-state";

afterEach(cleanup);

test("names the destination in the heading when given one", () => {
  render(<EmptyState destination="KIX" />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("No trips to KIX");
});

test("falls back to a generic heading without a destination", () => {
  render(<EmptyState />);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("No trips found");
});

test("offers concrete guidance to widen the search", () => {
  render(<EmptyState destination="KIX" />);
  const bullets = screen.getAllByRole("listitem");
  expect(bullets.length).toBeGreaterThanOrEqual(3);
  expect(screen.getByText(/budget cap/i)).not.toBeNull();
  expect(screen.getByText(/dates/i)).not.toBeNull();
});

test("links back to the search form", () => {
  render(<EmptyState destination="KIX" />);
  const cta = screen.getByRole("link", { name: /adjust your search/i });
  expect(cta.getAttribute("href")).toBe("/plan");
});
