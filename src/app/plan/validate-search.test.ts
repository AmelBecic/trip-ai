import { expect, test } from "vitest";
import {
  hasErrors,
  type SearchFormValues,
  validateSearchForm,
} from "./validate-search";

const valid: SearchFormValues = {
  origin: "SFO",
  destination: "KIX",
  start: "2026-11-01",
  end: "2026-11-10",
  adults: 2,
  children: 1,
  budgetAmount: "2000",
  currency: "USD",
  cabin: "economy",
  minStars: 0,
};

test("a complete, consistent form has no errors", () => {
  expect(validateSearchForm(valid)).toEqual({});
  expect(hasErrors(validateSearchForm(valid))).toBe(false);
});

test("flags every missing required field", () => {
  const errors = validateSearchForm({
    ...valid,
    origin: "  ",
    destination: "",
    start: "",
    end: "",
    budgetAmount: "",
  });

  expect(errors.origin).toBeDefined();
  expect(errors.destination).toBeDefined();
  expect(errors.start).toBeDefined();
  expect(errors.end).toBeDefined();
  expect(errors.budget).toBeDefined();
});

test("rejects an end date before the start date", () => {
  const errors = validateSearchForm({
    ...valid,
    start: "2026-11-10",
    end: "2026-11-01",
  });

  expect(errors.end).toMatch(/before the start date/i);
});

test("accepts an end date equal to the start date", () => {
  const errors = validateSearchForm({
    ...valid,
    start: "2026-11-05",
    end: "2026-11-05",
  });

  expect(errors.end).toBeUndefined();
});

test("rejects a zero or negative budget", () => {
  expect(validateSearchForm({ ...valid, budgetAmount: "0" }).budget).toBeDefined();
  expect(
    validateSearchForm({ ...valid, budgetAmount: "-50" }).budget,
  ).toBeDefined();
});

test("requires at least one adult", () => {
  expect(validateSearchForm({ ...valid, adults: 0 }).adults).toBeDefined();
});
