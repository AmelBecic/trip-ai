import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

/**
 * Guards WCAG AA contrast (TRIP-21) for the text and budget-state token pairs in
 * both light and dark schemes. It reads the real tokens from globals.css and
 * resolves them (through light-dark() and var()), so a future token change that
 * quietly drops a pair below AA fails here rather than in someone's eyes.
 */

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

// First definition wins: the :root raw tokens precede the @theme re-exports.
const defs = new Map<string, string>();
for (const m of css.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
  if (!defs.has(m[1])) defs.set(m[1], m[2].trim());
}

/** Split on top-level commas, respecting the parens in var()/oklch(). */
function splitArgs(s: string): string[] {
  const out: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") depth--;
    else if (s[i] === "," && depth === 0) {
      out.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(s.slice(start).trim());
  return out;
}

/** Resolve a token or literal to a concrete oklch()/hex string for one scheme. */
function resolve(value: string, scheme: "light" | "dark"): string {
  const v = value.trim();
  if (v.startsWith("var(")) {
    const name = v.slice(4, v.lastIndexOf(")")).trim();
    const def = defs.get(name);
    if (!def) throw new Error(`unknown token ${name}`);
    return resolve(def, scheme);
  }
  if (v.startsWith("light-dark(")) {
    const [light, dark] = splitArgs(v.slice("light-dark(".length, v.lastIndexOf(")")));
    return resolve(scheme === "light" ? light : dark, scheme);
  }
  return v; // oklch(...) or #hex
}

const tok = (name: string, scheme: "light" | "dark") => resolve(`var(${name})`, scheme);

// --- colour math ------------------------------------------------------------
function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
function toLinearRgb(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    const h = color.slice(1);
    const n = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    return [0, 2, 4].map((i) => srgbToLinear(parseInt(n.slice(i, i + 2), 16) / 255)) as [number, number, number];
  }
  const m = color.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) throw new Error(`cannot parse colour ${color}`);
  const L = +m[1], C = +m[2], h = (+m[3] * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const md = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * md + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * md - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * md + 1.707614701 * s,
  ].map((c) => Math.min(1, Math.max(0, c))) as [number, number, number];
}
function luminance(color: string): number {
  const [r, g, b] = toLinearRgb(color);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fg: string, bg: string): number {
  const a = luminance(fg), b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

// [label, foreground token/literal, background token/literal]
const PAIRS: ReadonlyArray<[string, string, string]> = [
  ["foreground / background", "--foreground", "--background"],
  ["muted-foreground / background", "--muted-foreground", "--background"],
  ["muted-foreground / surface", "--muted-foreground", "--surface"],
  ["foreground / surface", "--foreground", "--surface"],
  ["brand-foreground / brand", "--brand-foreground", "--brand"],
  ["under-foreground / under-surface", "--budget-under-foreground", "--budget-under-surface"],
  ["near-foreground / near-surface", "--budget-near-foreground", "--budget-near-surface"],
  ["over-foreground / over-surface", "--budget-over-foreground", "--budget-over-surface"],
  ["budget-under as text / surface", "--budget-under", "--surface"],
  ["budget-near as text / surface", "--budget-near", "--surface"],
  ["budget-over as text / surface", "--budget-over", "--surface"],
];

const AA_NORMAL = 4.5;

for (const scheme of ["light", "dark"] as const) {
  for (const [label, fg, bg] of PAIRS) {
    test(`AA: ${label} (${scheme})`, () => {
      const fgColor = fg.startsWith("--") ? tok(fg, scheme) : fg;
      const bgColor = bg.startsWith("--") ? tok(bg, scheme) : bg;
      const ratio = contrast(fgColor, bgColor);
      expect(ratio, `${label} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_NORMAL);
    });
  }
}
