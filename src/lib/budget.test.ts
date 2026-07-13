import { expect, test } from "vitest";
import { budgetBarLabel, toBudgetBar } from "@/lib/budget";
import type { BudgetBreakdown, BudgetLine, Money } from "@/lib/types";

const usd = (amount: number): Money => ({ amount, currency: "USD" });

function breakdown(overrides: Partial<BudgetBreakdown> = {}): BudgetBreakdown {
  const lines: BudgetLine[] = overrides.lines ?? [
    { category: "flights", amount: usd(200000) },
    { category: "lodging", amount: usd(240000) },
    { category: "food", amount: usd(80000) },
  ];
  const total = overrides.total ?? usd(lines.reduce((n, l) => n + l.amount.amount, 0));
  return {
    cap: usd(650000),
    total,
    status: "under",
    lines,
    ...overrides,
  };
}

test("segment fractions are amount / cap while spend is within the cap", () => {
  const bar = toBudgetBar(breakdown());

  // 520000 spent of a 650000 cap: each segment is its share of the cap.
  expect(bar.segments.map((s) => s.fraction)).toEqual([
    200000 / 650000,
    240000 / 650000,
    80000 / 650000,
  ]);
  expect(bar.capFraction).toBe(1);
  expect(bar.remainingFraction).toBeCloseTo(130000 / 650000);
  expect(bar.overBy).toBeNull();
});

test("over-cap spend fills the track and pulls the cap marker back", () => {
  const bar = toBudgetBar(
    breakdown({
      total: usd(700000),
      status: "over",
      lines: [
        { category: "flights", amount: usd(300000) },
        { category: "lodging", amount: usd(400000) },
      ],
    }),
  );

  // The track now spans the total (700000), so segments sum to the full width
  // and the cap marker sits at cap / total.
  expect(bar.segments.reduce((n, s) => n + s.fraction, 0)).toBeCloseTo(1);
  expect(bar.capFraction).toBeCloseTo(650000 / 700000);
  expect(bar.remainingFraction).toBe(0);
  expect(bar.overBy).toEqual(usd(50000));
});

test("carries the category label and amount onto each segment", () => {
  const bar = toBudgetBar(breakdown());

  expect(bar.segments[0]).toMatchObject({
    category: "flights",
    label: "Flights",
    amount: usd(200000),
  });
  expect(bar.segments[1].label).toBe("Hotel");
});

test("an empty trip yields zero fractions without dividing by zero", () => {
  const bar = toBudgetBar(breakdown({ cap: usd(0), total: usd(0), lines: [] }));

  expect(bar.segments).toEqual([]);
  expect(bar.capFraction).toBe(0);
  expect(bar.remainingFraction).toBe(0);
  expect(bar.overBy).toBeNull();
});

test("label states spend, split, and the plain verdict when within cap", () => {
  expect(budgetBarLabel(breakdown())).toBe(
    "$5,200.00 of $6,500.00 budget (80%). Flights $2,000.00, Hotel $2,400.00, Food $800.00. Under budget.",
  );
});

test("label names the overage instead of the status when over cap", () => {
  const label = budgetBarLabel(
    breakdown({
      total: usd(700000),
      status: "over",
      lines: [
        { category: "flights", amount: usd(300000) },
        { category: "lodging", amount: usd(400000) },
      ],
    }),
  );

  expect(label).toBe(
    "$7,000.00 of $6,500.00 budget (108%). Flights $3,000.00, Hotel $4,000.00. Over budget by $500.00.",
  );
});
