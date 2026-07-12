import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Badge } from "./badge";

afterEach(cleanup);

test("renders its content", () => {
  render(<Badge>Over cap</Badge>);
  expect(screen.getByText("Over cap")).not.toBeNull();
});

test("applies the token classes for its variant", () => {
  render(<Badge variant="over">Over cap</Badge>);

  const badge = screen.getByText("Over cap");
  expect(badge.className).toContain("bg-budget-over-surface");
  expect(badge.className).toContain("text-budget-over-foreground");
});
