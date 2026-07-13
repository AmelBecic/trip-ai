import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Skeleton } from "./skeleton";

afterEach(cleanup);

test("renders a pulsing, token-filled placeholder block", () => {
  const { container } = render(<Skeleton />);
  const block = container.firstChild as HTMLElement;

  expect(block.className).toContain("animate-pulse");
  expect(block.className).toContain("bg-surface-muted");
});

test("is hidden from assistive tech and merges caller classes", () => {
  const { container } = render(<Skeleton className="h-8 w-40" />);
  const block = container.firstChild as HTMLElement;

  expect(block.getAttribute("aria-hidden")).toBe("true");
  expect(block.className).toContain("h-8");
  expect(block.className).toContain("w-40");
});
