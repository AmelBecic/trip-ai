"use client";

import { useEffect, useState } from "react";

const MODES = ["system", "light", "dark"] as const;

type Mode = (typeof MODES)[number];

/**
 * Drives the `data-theme` override on <html>. "system" removes the attribute
 * and lets prefers-color-scheme decide.
 */
export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    const root = document.documentElement;

    if (mode === "system") {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = mode;
    }
  }, [mode]);

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
          aria-pressed={mode === option}
          onClick={() => setMode(option)}
          className="rounded-full px-3 py-1 text-sm capitalize text-muted-foreground transition-colors hover:bg-surface-muted aria-pressed:bg-brand aria-pressed:text-brand-foreground"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
