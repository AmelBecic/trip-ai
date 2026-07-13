import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { configureData, resetDataConfig } from "@/lib/data";
import ItineraryDetail from "./page";

// Drop the fixture latency so the async page resolves instantly under test.
beforeEach(() => configureData({ latencyMs: 0 }));
afterEach(() => {
  resetDataConfig();
  cleanup();
});

test("renders the resolved itinerary's summary and budget verdict", async () => {
  render(
    await ItineraryDetail({ params: Promise.resolve({ id: "kix-lean" }) }),
  );

  expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/kyoto/i);
  // kix-lean is comfortably under its baseline $6,500 cap.
  expect(screen.getByText("Under budget")).not.toBeNull();
});

test("calls notFound for an unknown id", async () => {
  // notFound() throws a NEXT_HTTP_ERROR_FALLBACK Next intercepts to render 404.
  await expect(
    ItineraryDetail({ params: Promise.resolve({ id: "does-not-exist" }) }),
  ).rejects.toThrow();
});
