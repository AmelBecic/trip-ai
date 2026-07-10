"use client";

import { useEffect, useState } from "react";

const MODES = ["system", "light", "dark"] as const;

type Mode = (typeof MODES)[number];

/**
 * Drives the `data-theme` override on <html>. "system" removes the attribute
 * and lets prefers-color-scheme decide.
 *
 * The override is scoped to this page: nothing is written until the reader
 * picks a mode, and whatever was on <html> at mount is put back on unmount.
 * A preview here must not strand the rest of the app in a scheme that only
 * this page offers a way out of.
 */
export function ThemeToggle() {
  // null means "no choice yet" — distinct from an explicit "system", which
  // actively clears the attribute. It also keeps the first render, and so the
  // prerendered markup, free of any dependency on the DOM.
  const [choice, setChoice] = useState<Mode | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const onMount = root.dataset.theme;

    return () => {
      if (onMount === undefined) {
        delete root.dataset.theme;
      } else {
        root.dataset.theme = onMount;
      }
    };
  }, []);

  useEffect(() => {
    if (choice === null) {
      return;
    }

    const root = document.documentElement;

    if (choice === "system") {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = choice;
    }
  }, [choice]);

  return (
    <div
      role="group"
      aria-label="Color scheme"
      className="inline-flex gap-1 rounded-full border border-border bg-surface p-1"
    >
      {MODES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={(choice ?? "system") === option}
          onClick={() => setChoice(option)}
          className="rounded-full px-3 py-1 text-sm capitalize text-muted-foreground transition-colors hover:bg-surface-muted aria-pressed:bg-brand aria-pressed:text-brand-foreground"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
