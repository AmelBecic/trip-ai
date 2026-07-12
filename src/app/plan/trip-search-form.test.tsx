import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { TripSearchForm } from "./trip-search-form";

// useRouter needs the app-router context, absent under jsdom; capture push().
const nav = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push }),
}));

afterEach(() => {
  nav.push.mockReset();
  cleanup();
});

test("builds a TripSearch query and navigates to /results on submit", () => {
  render(<TripSearchForm />);

  fireEvent.change(screen.getByLabelText(/origin/i), {
    target: { value: "sfo" },
  });
  fireEvent.change(screen.getByLabelText(/destination/i), {
    target: { value: "kix" },
  });
  fireEvent.change(screen.getByLabelText(/start date/i), {
    target: { value: "2026-11-01" },
  });
  fireEvent.change(screen.getByLabelText(/end date/i), {
    target: { value: "2026-11-10" },
  });
  fireEvent.change(screen.getByLabelText(/^budget$/i), {
    target: { value: "2000" },
  });
  fireEvent.change(screen.getByLabelText(/minimum hotel rating/i), {
    target: { value: "4" },
  });

  fireEvent.click(screen.getByRole("button", { name: /search trips/i }));

  expect(nav.push).toHaveBeenCalledTimes(1);
  const url = nav.push.mock.calls[0][0] as string;
  expect(url.startsWith("/results?")).toBe(true);

  const params = new URLSearchParams(url.slice(url.indexOf("?") + 1));
  expect(params.get("origin")).toBe("SFO");
  expect(params.get("destination")).toBe("KIX");
  expect(params.get("start")).toBe("2026-11-01");
  expect(params.get("end")).toBe("2026-11-10");
  // 2000 USD normalized to integer minor units.
  expect(params.get("budget")).toBe("200000");
  expect(params.get("currency")).toBe("USD");
  expect(params.get("minStars")).toBe("4");
  // Defaults come through for untouched controls.
  expect(params.get("adults")).toBe("1");
  expect(params.get("cabin")).toBe("economy");
});

test("blocks submit and shows an accessible error when required fields are empty", () => {
  render(<TripSearchForm />);

  fireEvent.click(screen.getByRole("button", { name: /search trips/i }));

  expect(nav.push).not.toHaveBeenCalled();

  const origin = screen.getByLabelText(/origin/i);
  expect(origin.getAttribute("aria-invalid")).toBe("true");
  const describedBy = origin.getAttribute("aria-describedby");
  expect(describedBy).toBe("origin-error");
  expect(document.getElementById(describedBy!)?.textContent).toMatch(
    /enter an origin/i,
  );
  // Focus lands on the first invalid control, not the submit button.
  expect(document.activeElement).toBe(origin);
});

test("clears a field's error as soon as the user corrects it", () => {
  render(<TripSearchForm />);

  fireEvent.click(screen.getByRole("button", { name: /search trips/i }));
  const origin = screen.getByLabelText(/origin/i);
  expect(origin.getAttribute("aria-invalid")).toBe("true");

  fireEvent.change(origin, { target: { value: "sfo" } });

  expect(origin.getAttribute("aria-invalid")).toBeNull();
  expect(screen.queryByText(/enter an origin/i)).toBeNull();
});

test("blocks submit when the end date precedes the start date", () => {
  render(<TripSearchForm />);

  fireEvent.change(screen.getByLabelText(/origin/i), {
    target: { value: "sfo" },
  });
  fireEvent.change(screen.getByLabelText(/destination/i), {
    target: { value: "kix" },
  });
  fireEvent.change(screen.getByLabelText(/start date/i), {
    target: { value: "2026-11-10" },
  });
  fireEvent.change(screen.getByLabelText(/end date/i), {
    target: { value: "2026-11-01" },
  });
  fireEvent.change(screen.getByLabelText(/^budget$/i), {
    target: { value: "2000" },
  });

  fireEvent.click(screen.getByRole("button", { name: /search trips/i }));

  expect(nav.push).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/end date/i).getAttribute("aria-invalid")).toBe(
    "true",
  );
});
