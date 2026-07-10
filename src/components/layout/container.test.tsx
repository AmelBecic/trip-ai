import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Container } from "./container";

afterEach(cleanup);

/** Exact class tokens, so `px-4` cannot pass by matching inside `sm:px-6`. */
function classesOf(text: string): string[] {
  const parent = screen.getByText(text).parentElement;
  return (parent?.className ?? "").split(" ").filter(Boolean);
}

test("caps width and centers by default", () => {
  render(
    <Container>
      <p>content</p>
    </Container>,
  );

  expect(classesOf("content")).toEqual(
    expect.arrayContaining(["mx-auto", "w-full", "max-w-6xl", "px-4"]),
  );
});

test("appends caller classes that do not conflict", () => {
  render(
    <Container className="py-8">
      <p>content</p>
    </Container>,
  );

  expect(classesOf("content")).toEqual(
    expect.arrayContaining(["mx-auto", "max-w-6xl", "py-8"]),
  );
});

/*
 * The reason cn() exists. Tailwind resolves conflicts by stylesheet source
 * order, so a naively concatenated `max-w-6xl max-w-3xl` renders at 6xl and
 * discards the caller's intent. The override has to actually replace the base.
 */
test("lets a caller override a conflicting base utility", () => {
  render(
    <Container className="max-w-3xl">
      <p>content</p>
    </Container>,
  );

  const classes = classesOf("content");

  expect(classes).toContain("max-w-3xl");
  expect(classes).not.toContain("max-w-6xl");
  expect(classes).toContain("mx-auto");
});

/*
 * twMerge groups by variant, so `px-0` only displaces the unprefixed `px-4`.
 * The responsive steps survive and the section is still padded at >=640px.
 * A caller that wants true full bleed has to zero out every breakpoint.
 */
test("overriding base padding only replaces the matching variant", () => {
  render(
    <Container className="px-0">
      <p>content</p>
    </Container>,
  );

  const classes = classesOf("content");

  expect(classes).toContain("px-0");
  expect(classes).not.toContain("px-4");
  expect(classes).toEqual(expect.arrayContaining(["sm:px-6", "md:px-8", "lg:px-12"]));
});

test("a full-bleed caller must zero every breakpoint", () => {
  render(
    <Container className="px-0 sm:px-0 md:px-0 lg:px-0">
      <p>content</p>
    </Container>,
  );

  const classes = classesOf("content");

  expect(classes).toEqual(
    expect.arrayContaining(["px-0", "sm:px-0", "md:px-0", "lg:px-0"]),
  );

  // Each individually: arrayContaining under .not passes if any one is missing.
  for (const padded of ["px-4", "sm:px-6", "md:px-8", "lg:px-12"]) {
    expect(classes).not.toContain(padded);
  }
});
