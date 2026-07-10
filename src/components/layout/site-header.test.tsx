import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { SiteHeader } from "./site-header";

// usePathname needs the app-router context, which does not exist under jsdom.
const route = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
}));

afterEach(() => {
  route.pathname = "/";
  cleanup();
});

test("links to every top-level destination", () => {
  render(<SiteHeader />);

  const nav = screen.getByRole("navigation", { name: "Main" });
  const hrefs = screen
    .getAllByRole("link")
    .filter((link) => nav.contains(link))
    .map((link) => link.getAttribute("href"));

  expect(hrefs).toEqual(["/", "/plan", "/saved"]);
});

test("marks only the current destination with aria-current", () => {
  route.pathname = "/plan";
  render(<SiteHeader />);

  expect(screen.getByRole("link", { name: "Plan" }).getAttribute("aria-current")).toBe(
    "page",
  );
  expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
});

test("keeps Plan current on its nested routes", () => {
  route.pathname = "/plan/new";
  render(<SiteHeader />);

  expect(screen.getByRole("link", { name: "Plan" }).getAttribute("aria-current")).toBe(
    "page",
  );
});

// "/" prefixes every path, so Home must match exactly or it is always current.
test("does not mark Home current on other routes", () => {
  route.pathname = "/saved";
  render(<SiteHeader />);

  expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
  expect(screen.getByRole("link", { name: "Saved" }).getAttribute("aria-current")).toBe(
    "page",
  );
});
