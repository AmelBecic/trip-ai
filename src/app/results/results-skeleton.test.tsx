import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { ResultsSkeleton } from "./results-skeleton";

afterEach(cleanup);

test("exposes one busy status region with an accessible loading label", () => {
  render(<ResultsSkeleton />);

  const region = screen.getByRole("status");
  expect(region.getAttribute("aria-busy")).toBe("true");
  expect(screen.getByText(/loading trip results/i)).not.toBeNull();
});

test("pre-draws several placeholder blocks rather than a lone spinner", () => {
  const { container } = render(<ResultsSkeleton />);

  // Header (title + subtitle) plus three itinerary cards' worth of blocks.
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(3);
});
