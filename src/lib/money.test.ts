import { expect, test } from "vitest";
import { toMinorUnits } from "./money";

test("converts major units to minor units for a two-decimal currency", () => {
  expect(toMinorUnits(1299, "USD")).toBe(129900);
  expect(toMinorUnits(19.99, "EUR")).toBe(1999);
});

test("treats a zero-decimal currency as whole units", () => {
  expect(toMinorUnits(150000, "JPY")).toBe(150000);
});
