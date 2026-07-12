import type { CabinClass } from "@/lib/types";
import type { SupportedCurrency } from "@/lib/money";

/** Raw, still-stringy values straight off the search form controls. */
export interface SearchFormValues {
  origin: string;
  destination: string;
  start: string;
  end: string;
  adults: number;
  children: number;
  budgetAmount: string;
  currency: SupportedCurrency;
  cabin: CabinClass;
  minStars: number;
}

/** Fields that can carry a validation message. */
export type SearchField =
  | "origin"
  | "destination"
  | "start"
  | "end"
  | "adults"
  | "budget";

export type SearchFormErrors = Partial<Record<SearchField, string>>;

/**
 * Pure, component-free validation for the trip search form. Returns a map of
 * field → message; an empty map means the form is submittable.
 *
 * ISO `YYYY-MM-DD` dates are fixed-width, so a plain string compare orders them
 * correctly — no Date parsing (and no timezone surprises) needed.
 */
export function validateSearchForm(values: SearchFormValues): SearchFormErrors {
  const errors: SearchFormErrors = {};

  if (!values.origin.trim()) errors.origin = "Enter an origin.";
  if (!values.destination.trim()) errors.destination = "Enter a destination.";
  if (!values.start) errors.start = "Choose a start date.";
  if (!values.end) errors.end = "Choose an end date.";
  if (values.start && values.end && values.end < values.start) {
    errors.end = "End date can't be before the start date.";
  }

  const budget = Number(values.budgetAmount);
  if (!values.budgetAmount.trim() || Number.isNaN(budget) || budget <= 0) {
    errors.budget = "Enter a budget greater than 0.";
  }

  if (values.adults < 1) errors.adults = "At least one adult is required.";

  return errors;
}

export function hasErrors(errors: SearchFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
