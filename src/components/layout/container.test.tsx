import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Container } from "./container";

afterEach(cleanup);

test("caps width and centers by default", () => {
  render(
    <Container>
      <p>content</p>
    </Container>,
  );

  const className = screen.getByText("content").parentElement?.className ?? "";

  expect(className).toContain("mx-auto");
  expect(className).toContain("max-w-6xl");
});

test("appends caller classes without dropping its own", () => {
  render(
    <Container className="py-8">
      <p>content</p>
    </Container>,
  );

  const className = screen.getByText("content").parentElement?.className ?? "";

  expect(className).toContain("mx-auto");
  expect(className).toContain("py-8");
});
