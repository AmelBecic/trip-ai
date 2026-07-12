"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import type { CabinClass, Constraint, TripSearch } from "@/lib/types";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  toMinorUnits,
} from "@/lib/money";
import { tripSearchToSearchParams } from "@/lib/search-params";

const CABINS: ReadonlyArray<{ value: CabinClass; label: string }> = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

/** Label + control pair; the primitives leave the accessible label to callers. */
function Field({
  label,
  htmlFor,
  children,
}: Readonly<{ label: string; htmlFor: string; children: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

/**
 * The core trip search (TRIP-9). Controlled inputs, typed state, no `any`; on
 * submit it assembles a typed `TripSearch` and hands it to `/results` as a
 * query string. Field-level validation is TRIP-10 — here the native `required`
 * and typed controls are the only guards.
 */
export function TripSearchForm() {
  const router = useRouter();
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const constraints: Constraint[] =
      minStars > 0 ? [{ kind: "min-hotel-rating", rating: minStars }] : [];

    const search: TripSearch = {
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      dates: { start, end },
      travelers: { adults, children },
      cabin,
      budget: { amount: toMinorUnits(Number(budgetAmount), currency), currency },
      constraints,
    };

    router.push(`/results?${tripSearchToSearchParams(search)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Origin" htmlFor="origin">
          <Input
            id="origin"
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
            placeholder="SFO"
            autoComplete="off"
            required
          />
        </Field>

        <Field label="Destination" htmlFor="destination">
          <Input
            id="destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="KIX"
            autoComplete="off"
            required
          />
        </Field>

        <Field label="Start date" htmlFor="start">
          <Input
            id="start"
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            required
          />
        </Field>

        <Field label="End date" htmlFor="end">
          <Input
            id="end"
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            required
          />
        </Field>

        <Field label="Adults" htmlFor="adults">
          <Select
            id="adults"
            value={adults}
            onChange={(event) => setAdults(Number(event.target.value))}
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

        <Field label="Budget" htmlFor="budget">
          <div className="flex gap-2">
            <Input
              id="budget"
              type="number"
              min={0}
              step="1"
              inputMode="numeric"
              value={budgetAmount}
              onChange={(event) => setBudgetAmount(event.target.value)}
              placeholder="2000"
              className="flex-1"
              required
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

      <Button type="submit" className="self-start">
        Search trips
      </Button>
    </form>
  );
}
