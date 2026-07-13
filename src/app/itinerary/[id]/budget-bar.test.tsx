import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { BudgetBreakdown, BudgetLine, Money } from "@/lib/types";
import { BudgetBar } from "./budget-bar";

afterEach(cleanup);

const usd = (amount: number): Money => ({ amount, currency: "USD" });

function budget(overrides: Partial<BudgetBreakdown> = {}): BudgetBreakdown {
  const lines: BudgetLine[] = overrides.lines ?? [
    { category: "flights", amount: usd(200000) },
    { category: "lodging", amount: usd(240000) },
    { category: "food", amount: usd(80000) },
  ];
  const total = overrides.total ?? usd(lines.reduce((n, l) => n + l.amount.amount, 0));
  return { cap: usd(650000), total, status: "under", lines, ...overrides };
}

test("shows the total, cap, and status verdict", () => {
  render(<BudgetBar budget={budget()} />);

  expect(screen.getByText("$5,200.00")).not.toBeNull();
  expect(screen.getByText("of $6,500.00 budget")).not.toBeNull();
  expect(screen.getByText("Under budget")).not.toBeNull();
});

test("lists each category with its formatted amount in the legend", () => {
  render(<BudgetBar budget={budget()} />);

  expect(screen.getByText("Flights")).not.toBeNull();
  expect(screen.getByText("Hotel")).not.toBeNull();
  expect(screen.getByText("$2,400.00")).not.toBeNull();
});

test("gives the bar a text alternative describing spend, split, and verdict", () => {
  render(<BudgetBar budget={budget()} />);

  expect(
    screen.getByRole("img", {
      name: "$5,200.00 of $6,500.00 budget (80%). Flights $2,000.00, Hotel $2,400.00, Food $800.00. Under budget.",
    }),
  ).not.toBeNull();
});

test("flags the overage in words when spend is over the cap", () => {
  render(
    <BudgetBar
      budget={budget({
        total: usd(700000),
        status: "over",
        lines: [
          { category: "flights", amount: usd(300000) },
          { category: "lodging", amount: usd(400000) },
        ],
      })}
    />,
  );

  expect(screen.getByText("$500.00 over")).not.toBeNull();
  expect(screen.getByText("Over budget")).not.toBeNull();
});

test("does not flag an overage when spend is within the cap", () => {
  render(<BudgetBar budget={budget()} />);

  expect(screen.queryByText(/over$/)).toBeNull();
});
