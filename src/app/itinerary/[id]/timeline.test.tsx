import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { TimelineDay } from "@/lib/itinerary";
import { Timeline } from "./timeline";

afterEach(cleanup);

test("renders a numbered node per day in the given order", () => {
  const days: TimelineDay[] = [
    { date: "2026-11-03", title: "First day", events: [] },
    { date: "2026-11-04", title: "Second day", events: [] },
  ];
  render(<Timeline days={days} />);

  const list = screen.getByRole("list");
  const nodes = within(list).getAllByRole("listitem");
  expect(nodes).toHaveLength(2);

  expect(within(nodes[0]).getByText(/Day 1/)).not.toBeNull();
  expect(within(nodes[0]).getByText("First day")).not.toBeNull();
  expect(within(nodes[1]).getByText(/Day 2/)).not.toBeNull();
});

test("renders flight, hotel, and activity events with time, detail, and cost", () => {
  const days: TimelineDay[] = [
    {
      date: "2026-11-03",
      title: "Arrival",
      events: [
        {
          id: "arr",
          kind: "flight",
          time: "17:30",
          title: "Arrive KIX",
          detail: "ANA NH107",
        },
        {
          id: "checkin",
          kind: "hotel",
          time: "",
          title: "Check in — Hotel Kanra",
          detail: "Shimogyo, Kyoto",
        },
        {
          id: "a1",
          kind: "activity",
          time: "19:30",
          title: "Evening stroll",
          cost: { amount: 400, currency: "USD" },
        },
      ],
    },
  ];
  render(<Timeline days={days} />);

  expect(screen.getByText("Arrive KIX")).not.toBeNull();
  expect(screen.getByText("ANA NH107")).not.toBeNull();
  expect(screen.getByText("Check in — Hotel Kanra")).not.toBeNull();
  expect(screen.getByText("17:30")).not.toBeNull();
  expect(screen.getByText("$4.00")).not.toBeNull();

  // Logistics events are labelled for assistive tech; activities are plain rows.
  expect(screen.getByRole("img", { name: "Flight" })).not.toBeNull();
  expect(screen.getByRole("img", { name: "Hotel" })).not.toBeNull();
});

test("renders a titleless travel day with just its eyebrow and events", () => {
  const days: TimelineDay[] = [
    {
      date: "2026-11-02",
      events: [{ id: "dep", kind: "flight", time: "13:40", title: "Depart SFO" }],
    },
  ];
  render(<Timeline days={days} />);

  expect(screen.getByText(/Day 1/)).not.toBeNull();
  expect(screen.getByText("Depart SFO")).not.toBeNull();
  expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
});

test("shows a note and no list when there is no plan", () => {
  render(<Timeline days={[]} />);

  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.getByText(/day-by-day plan/i)).not.toBeNull();
});
