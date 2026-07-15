"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import type { CabinClass, Constraint, TripSearch } from "@/lib/types";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  toMinorUnits,
} from "@/lib/money";
import { tripSearchToSearchParams } from "@/lib/search-params";
import {
  hasErrors,
  type SearchField,
  type SearchFormErrors,
  type SearchFormValues,
  validateSearchForm,
} from "./validate-search";

// Top-to-bottom control order, so a failed submit can focus the first offender.
const FIELD_ORDER: readonly SearchField[] = [
  "origin",
  "destination",
  "start",
  "end",
  "adults",
  "budget",
];

const CABINS: ReadonlyArray<{ value: CabinClass; label: string }> = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

/** Label + control + inline error; the primitives leave the label to callers. */
function Field({
  label,
  htmlFor,
  error,
  children,
}: Readonly<{
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-budget-over">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Wire a control to its inline error message when one is present. */
function ariaFor(id: string, message?: string) {
  return message
    ? ({ "aria-invalid": true, "aria-describedby": `${id}-error` } as const)
    : {};
}

/**
 * The core trip search (TRIP-9) with validation (TRIP-10). Controlled inputs,
 * typed state, no `any`. Submit runs the pure `validateSearchForm`; if anything
 * fails it renders inline, `aria-describedby`-linked messages and blocks
 * navigation. On success it assembles a typed `TripSearch` for `/results`.
 */
export function TripSearchForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [currency, setCurrency] = useState<SupportedCurrency>("USD");
  const [cabin, setCabin] = useState<CabinClass>("economy");
  const [minStars, setMinStars] = useState(0);
  const [errors, setErrors] = useState<SearchFormErrors>({});

  // Drop a field's error the moment the user starts correcting it, so a stale
  // message never lingers on a value that is no longer the one that failed.
  function clearError(field: SearchField) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values: SearchFormValues = {
      origin,
      destination,
      start,
      end,
      adults,
      children,
      budgetAmount,
      currency,
      cabin,
      minStars,
    };

    const nextErrors = validateSearchForm(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      // Move focus to the first invalid control so keyboard and screen-reader
      // users land on the problem (and hear its aria-describedby message)
      // instead of being left on a submit button that appears to do nothing.
      const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstInvalid) {
        formRef.current
          ?.querySelector<HTMLElement>(`#${firstInvalid}`)
          ?.focus();
      }
      return;
    }

    const constraints: Constraint[] =
      minStars > 0 ? [{ kind: "min-hotel-rating", rating: minStars }] : [];

    const search: TripSearch = {
      origin: values.origin.trim().toUpperCase(),
      destination: values.destination.trim().toUpperCase(),
      dates: { start, end },
      travelers: { adults, children },
      cabin,
      budget: { amount: toMinorUnits(Number(budgetAmount), currency), currency },
      constraints,
    };

    router.push(`/results?${tripSearchToSearchParams(search)}`);
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Origin" htmlFor="origin" error={errors.origin}>
          <Input
            id="origin"
            value={origin}
            onChange={(event) => {
              setOrigin(event.target.value);
              clearError("origin");
            }}
            placeholder="SFO"
            autoComplete="off"
            required
            {...ariaFor("origin", errors.origin)}
          />
        </Field>

        <Field
          label="Destination"
          htmlFor="destination"
          error={errors.destination}
        >
          <Input
            id="destination"
            value={destination}
            onChange={(event) => {
              setDestination(event.target.value);
              clearError("destination");
            }}
            placeholder="KIX"
            autoComplete="off"
            required
            {...ariaFor("destination", errors.destination)}
          />
        </Field>

        <Field label="Start date" htmlFor="start" error={errors.start}>
          <Input
            id="start"
            type="date"
            value={start}
            onChange={(event) => {
              setStart(event.target.value);
              clearError("start");
              clearError("end");
            }}
            required
            {...ariaFor("start", errors.start)}
          />
        </Field>

        <Field label="End date" htmlFor="end" error={errors.end}>
          <Input
            id="end"
            type="date"
            value={end}
            onChange={(event) => {
              setEnd(event.target.value);
              clearError("end");
            }}
            required
            {...ariaFor("end", errors.end)}
          />
        </Field>

        <Field label="Adults" htmlFor="adults" error={errors.adults}>
          <Select
            id="adults"
            value={adults}
            onChange={(event) => {
              setAdults(Number(event.target.value));
              clearError("adults");
            }}
            {...ariaFor("adults", errors.adults)}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Children" htmlFor="children">
          <Select
            id="children"
            value={children}
            onChange={(event) => setChildren(Number(event.target.value))}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Cabin class" htmlFor="cabin">
          <Select
            id="cabin"
            value={cabin}
            onChange={(event) => setCabin(event.target.value as CabinClass)}
          >
            {CABINS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Minimum hotel rating" htmlFor="minStars">
          <Select
            id="minStars"
            value={minStars}
            onChange={(event) => setMinStars(Number(event.target.value))}
          >
            <option value={0}>Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+ stars
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Budget" htmlFor="budget" error={errors.budget}>
          <div className="flex gap-2">
            <Input
              id="budget"
              type="number"
              min={0}
              step="1"
              inputMode="numeric"
              value={budgetAmount}
              onChange={(event) => {
                setBudgetAmount(event.target.value);
                clearError("budget");
              }}
              placeholder="2000"
              className="flex-1"
              required
              {...ariaFor("budget", errors.budget)}
            />
            <Select
              aria-label="Budget currency"
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value as SupportedCurrency)
              }
              className="w-24"
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Select>
          </div>
        </Field>
      </div>

      <Button type="submit" className="w-full sm:w-auto sm:self-start">
        Search trips
      </Button>
    </form>
  );
}
