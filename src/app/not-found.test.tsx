import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import NotFound from "./not-found";

afterEach(cleanup);

test("renders a heading and a link back home", () => {
  render(<NotFound />);

  expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
  expect(
    screen.getByRole("link", { name: /return home/i }).getAttribute("href"),
  ).toBe("/");
});
