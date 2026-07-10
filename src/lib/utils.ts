import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Compose Tailwind classes so the last one wins.
 *
 * Plain string concatenation does not do this: Tailwind resolves conflicts by
 * the order rules appear in the generated stylesheet, not by the order classes
 * appear in the attribute. `"max-w-6xl" + " " + "max-w-3xl"` renders at 6xl,
 * silently ignoring the caller.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
