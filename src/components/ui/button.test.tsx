import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Button } from "./button";

afterEach(cleanup);

test("renders its label and defaults to type=button", () => {
  render(<Button>Save trip</Button>);

  const button = screen.getByRole("button", { name: "Save trip" });
  expect(button.getAttribute("type")).toBe("button");
});

test("fires onClick when enabled", () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Go</Button>);

  fireEvent.click(screen.getByRole("button", { name: "Go" }));

  expect(onClick).toHaveBeenCalledOnce();
});

test("loading disables the button and marks it busy without hiding the label", () => {
  const onClick = vi.fn();
  render(
    <Button loading onClick={onClick}>
      Searching
    </Button>,
  );

  const button = screen.getByRole("button", { name: "Searching" });
  expect((button as HTMLButtonElement).disabled).toBe(true);
  expect(button.getAttribute("aria-busy")).toBe("true");

  fireEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();
});

test("disabled blocks interaction", () => {
  const onClick = vi.fn();
  render(
    <Button disabled onClick={onClick}>
      Nope
    </Button>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Nope" }));
  expect(onClick).not.toHaveBeenCalled();
});
