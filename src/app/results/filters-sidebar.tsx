"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  toMajorUnits,
  toMinorUnits,
} from "@/lib/money";
import type { CabinClass } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The filters / constraints sidebar (TRIP-17). Every control writes its value
 * into the `/results` query string; the route is a server component keyed on
 * that query, so a change re-queries the data layer and the results list
 * re-suspends behind its skeleton. The sidebar itself lives outside that
 * boundary, so it stays mounted (and the mobile drawer stays open) across a
 * re-query.
 *
 * State is the URL, not React: reading `useSearchParams` keeps the controls in
 * step with a shared or back-navigated link, and committing merges into the
 * existing params so the untouched search fields (origin, dates, travellers)
 * ride along untouched.
 */

const CABINS: ReadonlyArray<{ value: CabinClass; label: string }> = [
  { value: "economy", label: "Economy" },
  { value: "premium_economy", label: "Premium economy" },
  { value: "business", label: "Business" },
  { value: "first", label: "First" },
];

const MAX_STOPS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "", label: "Any number" },
  { value: "0", label: "Nonstop only" },
  { value: "1", label: "Up to 1 stop" },
  { value: "2", label: "Up to 2 stops" },
];

const STAR_VALUES = [1, 2, 3, 4, 5] as const;
const CABIN_VALUES = new Set(CABINS.map((c) => c.value));

function toCurrency(value: string | null): SupportedCurrency {
  return value && (SUPPORTED_CURRENCIES as readonly string[]).includes(value)
    ? (value as SupportedCurrency)
    : "USD";
}

function toCabin(value: string | null): CabinClass {
  return value && CABIN_VALUES.has(value as CabinClass)
    ? (value as CabinClass)
    : "economy";
}

/** Label + control, mirroring the search form's field so the two screens read
 *  the same. Ids are prefixed so the desktop and drawer copies never collide. */
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

export function FiltersSidebar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const currency = toCurrency(params.get("currency"));
  const budgetMinor = Number(params.get("budget"));
  const cabin = toCabin(params.get("cabin"));
  const minStars = params.get("minStars") ?? "0";
  const maxStops = params.get("maxStops") ?? "";

  // The budget field is edited freely and committed on blur/Enter, so it holds
  // local text rather than round-tripping every keystroke through the URL.
  const [budgetInput, setBudgetInput] = useState(() =>
    Number.isFinite(budgetMinor) && budgetMinor > 0
      ? String(toMajorUnits(budgetMinor, currency))
      : "",
  );

  /** Merge changes into the current query and re-query without a scroll jump. */
  function commit(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") sp.delete(key);
      else sp.set(key, value);
    }
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  function commitBudget() {
    const major = Number(budgetInput);
    // Ignore an empty or malformed entry rather than re-querying against $NaN;
    // the last valid budget stands until the user types a usable one.
    if (budgetInput.trim() === "" || !Number.isFinite(major) || major < 0) {
      return;
    }
    commit({ budget: String(toMinorUnits(major, currency)) });
  }

  function controls(idPrefix: string) {
    return (
      <div className="flex flex-col gap-4">
        <Field label={`Budget cap (${currency})`} htmlFor={`${idPrefix}-budget`}>
          <Input
            id={`${idPrefix}-budget`}
            type="number"
            min={0}
            step="1"
            inputMode="numeric"
            value={budgetInput}
            onChange={(event) => setBudgetInput(event.target.value)}
            onBlur={commitBudget}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            placeholder="2000"
          />
        </Field>

        <Field label="Cabin class" htmlFor={`${idPrefix}-cabin`}>
          <Select
            id={`${idPrefix}-cabin`}
            value={cabin}
            onChange={(event) => commit({ cabin: event.target.value })}
          >
            {CABINS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Minimum hotel rating" htmlFor={`${idPrefix}-minStars`}>
          <Select
            id={`${idPrefix}-minStars`}
            value={minStars}
            onChange={(event) =>
              commit({
                minStars: event.target.value === "0" ? null : event.target.value,
              })
            }
          >
            <option value="0">Any</option>
            {STAR_VALUES.map((n) => (
              <option key={n} value={n}>
                {n}+ stars
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Maximum stops" htmlFor={`${idPrefix}-maxStops`}>
          <Select
            id={`${idPrefix}-maxStops`}
            value={maxStops}
            onChange={(event) =>
              commit({ maxStops: event.target.value || null })
            }
          >
            {MAX_STOPS.map(({ value, label }) => (
              <option key={value || "any"} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: a button opens the filters as a drawer. */}
      <div className="md:hidden">
        <Button
          variant="secondary"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          Filters
        </Button>
      </div>

      {/* Desktop: the sidebar sits beside the results. */}
      <aside
        aria-label="Filters"
        className={cn(
          "hidden rounded-lg border border-border bg-surface p-5 md:block",
          className,
        )}
      >
        <h2 className="mb-4 text-sm font-semibold text-foreground">Filters</h2>
        {controls("desktop")}
      </aside>

      {/* Mobile drawer, mounted only while open so its duplicate ids don't
          shadow the desktop copy in the tab order. */}
      {open ? (
        <div
          className="fixed inset-0 z-30 md:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-neutral-950/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col gap-4 overflow-y-auto bg-background p-6 shadow-overlay"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Filters
              </h2>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            {controls("drawer")}
          </div>
        </div>
      ) : null}
    </>
  );
}
