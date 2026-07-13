import { expect, test } from "vitest";
import { formatMoney, toMinorUnits } from "./money";

test("converts major units to minor units for a two-decimal currency", () => {
  expect(toMinorUnits(1299, "USD")).toBe(129900);
  expect(toMinorUnits(19.99, "EUR")).toBe(1999);
});

test("treats a zero-decimal currency as whole units", () => {
  expect(toMinorUnits(150000, "JPY")).toBe(150000);
});

// Compare against the same Intl call the formatter trusts, so the assertions
// verify the minor-unit *scaling* (the real logic) without pinning a locale.
const currency = (value: number, code: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(
    value,
  );

test("scales a two-decimal amount down by its minor unit", () => {
  expect(formatMoney({ amount: 129900, currency: "USD" })).toBe(
    currency(1299, "USD"),
  );
});

test("leaves a zero-decimal currency unscaled", () => {
  expect(formatMoney({ amount: 150000, currency: "JPY" })).toBe(
    currency(150000, "JPY"),
  );
});
