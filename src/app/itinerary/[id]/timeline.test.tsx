import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { ItineraryDay } from "@/lib/types";
import { Timeline } from "./timeline";

afterEach(cleanup);

function day(
  date: string,
  title: string,
  activities: ItineraryDay["activities"] = [],
): ItineraryDay {
  return { date, title, activities };
}

test("renders a numbered node per day, in calendar order", () => {
  render(
    <Timeline
      days={[
        day("2026-11-04", "Second day"),
        day("2026-11-03", "First day"),
      ]}
    />,
  );

  const list = screen.getByRole("list");
  const nodes = within(list).getAllByRole("listitem");
  expect(nodes).toHaveLength(2);

  expect(within(nodes[0]).getByText(/Day 1/)).not.toBeNull();
  expect(within(nodes[0]).getByText("First day")).not.toBeNull();
  expect(within(nodes[1]).getByText(/Day 2/)).not.toBeNull();
  expect(within(nodes[1]).getByText("Second day")).not.toBeNull();
});

test("shows an activity's time, name, location, and cost", () => {
  render(
    <Timeline
      days={[
        day("2026-11-04", "Southern temples", [
          {
            id: "a1",
            name: "Kiyomizu-dera",
            start: "2026-11-04T11:00:00+09:00",
            location: "Higashiyama",
            cost: { amount: 400, currency: "USD" },
          },
        ]),
      ]}
    />,
  );

  expect(screen.getByText("11:00")).not.toBeNull();
  expect(screen.getByText("Kiyomizu-dera")).not.toBeNull();
  expect(screen.getByText("Higashiyama")).not.toBeNull();
  expect(screen.getByText("$4.00")).not.toBeNull();
});

test("renders a single-day trip without a day-2 node", () => {
  render(<Timeline days={[day("2026-11-03", "Just the one day")]} />);

  expect(screen.getByText(/Day 1/)).not.toBeNull();
  expect(screen.queryByText(/Day 2/)).toBeNull();
});

test("shows a note and no list when there is no plan", () => {
  render(<Timeline days={[]} />);

  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.getByText(/day-by-day plan/i)).not.toBeNull();
});
