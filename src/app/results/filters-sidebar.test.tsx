import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { FiltersSidebar } from "./filters-sidebar";

// next/navigation needs the app-router context, absent under jsdom. Capture
// replace() and feed the component a query it reads its current values from.
const nav = vi.hoisted(() => ({
  replace: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => "/results",
  useSearchParams: () => nav.params,
}));

/** The query a search lands on: destination + dates + budget + defaults. */
function setQuery(overrides: Record<string, string> = {}) {
  nav.params = new URLSearchParams({
    origin: "SFO",
    destination: "KIX",
    start: "2026-11-02",
    end: "2026-11-09",
    adults: "2",
    cabin: "economy",
    budget: "650000",
    currency: "USD",
    ...overrides,
  });
}

/** The query string of the last replace() call, as URLSearchParams. */
function lastReplaceParams() {
  const url = nav.replace.mock.calls.at(-1)?.[0] as string;
  return new URLSearchParams(url.slice(url.indexOf("?") + 1));
}

beforeEach(() => setQuery());
afterEach(() => {
  nav.replace.mockReset();
  cleanup();
});

test("reflects the current query in its controls", () => {
  setQuery({ cabin: "business", minStars: "4" });
  render(<FiltersSidebar />);

  expect((screen.getByLabelText(/cabin class/i) as HTMLSelectElement).value).toBe(
    "business",
  );
  expect(
    (screen.getByLabelText(/minimum hotel rating/i) as HTMLSelectElement).value,
  ).toBe("4");
  // Budget shows major units (650000 minor USD → 6500).
  expect((screen.getByLabelText(/budget cap/i) as HTMLInputElement).value).toBe(
    "6500",
  );
});

test("changing cabin re-queries while preserving the rest of the search", () => {
  render(<FiltersSidebar />);

  fireEvent.change(screen.getByLabelText(/cabin class/i), {
    target: { value: "business" },
  });

  expect(nav.replace).toHaveBeenCalledTimes(1);
  const params = lastReplaceParams();
  expect(params.get("cabin")).toBe("business");
  // Untouched search fields ride along.
  expect(params.get("destination")).toBe("KIX");
  expect(params.get("budget")).toBe("650000");
  expect(params.get("adults")).toBe("2");
  // Committed without a scroll jump.
  expect(nav.replace.mock.calls[0][1]).toEqual({ scroll: false });
});

test("selecting a star floor sets minStars; choosing Any clears it", () => {
  setQuery({ minStars: "4" });
  render(<FiltersSidebar />);

  fireEvent.change(screen.getByLabelText(/minimum hotel rating/i), {
    target: { value: "5" },
  });
  expect(lastReplaceParams().get("minStars")).toBe("5");

  fireEvent.change(screen.getByLabelText(/minimum hotel rating/i), {
    target: { value: "0" },
  });
  expect(lastReplaceParams().has("minStars")).toBe(false);
});

test("editing the budget commits minor units on blur, not per keystroke", () => {
  render(<FiltersSidebar />);
  const budget = screen.getByLabelText(/budget cap/i);

  fireEvent.change(budget, { target: { value: "7000" } });
  expect(nav.replace).not.toHaveBeenCalled();

  fireEvent.blur(budget);
  expect(nav.replace).toHaveBeenCalledTimes(1);
  // 7000 USD → 700000 minor units.
  expect(lastReplaceParams().get("budget")).toBe("700000");
});

test("an empty or malformed budget does not re-query", () => {
  render(<FiltersSidebar />);
  const budget = screen.getByLabelText(/budget cap/i);

  fireEvent.change(budget, { target: { value: "" } });
  fireEvent.blur(budget);

  expect(nav.replace).not.toHaveBeenCalled();
});

test("the mobile drawer opens the filters in a dialog", () => {
  render(<FiltersSidebar />);

  fireEvent.click(screen.getByRole("button", { name: /^filters$/i }));

  const dialog = screen.getByRole("dialog", { name: /filters/i });
  // The drawer carries its own copy of the controls.
  expect(within(dialog).getByLabelText(/cabin class/i)).not.toBeNull();

  fireEvent.click(within(dialog).getByRole("button", { name: /^close$/i }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
