import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import StyleGuide from "./page";

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.theme;
});

test("renders a swatch section for every token group", () => {
  render(<StyleGuide />);

  for (const name of [
    "Brand",
    "Neutral",
    "Semantic surfaces",
    "Budget states",
    "Typography",
    "Spacing",
    "Radius",
    "Elevation",
  ]) {
    expect(screen.getByRole("heading", { level: 2, name })).toBeDefined();
  }
});

test("the budget tokens cover under, near, and over cap", () => {
  render(<StyleGuide />);

  expect(screen.getByText("budget-under")).toBeDefined();
  expect(screen.getByText("budget-near")).toBeDefined();
  expect(screen.getByText("budget-over")).toBeDefined();
});

test("the theme toggle drives the data-theme override on <html>", () => {
  render(<StyleGuide />);
  expect(document.documentElement.dataset.theme).toBeUndefined();

  fireEvent.click(screen.getByRole("button", { name: "dark" }));
  expect(document.documentElement.dataset.theme).toBe("dark");

  fireEvent.click(screen.getByRole("button", { name: "light" }));
  expect(document.documentElement.dataset.theme).toBe("light");

  fireEvent.click(screen.getByRole("button", { name: "system" }));
  expect(document.documentElement.dataset.theme).toBeUndefined();
});
