import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Input } from "./input";

afterEach(cleanup);

test("associates with a label and forwards typed value", () => {
  const onChange = vi.fn();
  render(
    <>
      <label htmlFor="dest">Destination</label>
      <Input id="dest" onChange={onChange} />
    </>,
  );

  const input = screen.getByLabelText("Destination");
  fireEvent.change(input, { target: { value: "Kyoto" } });

  expect((input as HTMLInputElement).value).toBe("Kyoto");
  expect(onChange).toHaveBeenCalledOnce();
});

test("exposes invalid state to assistive tech", () => {
  render(
    <>
      <label htmlFor="dest">Destination</label>
      <Input id="dest" aria-invalid />
    </>,
  );

  expect(
    screen.getByLabelText("Destination").getAttribute("aria-invalid"),
  ).toBe("true");
});
