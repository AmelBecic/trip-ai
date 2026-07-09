# Tech Stack

| Thing | Version / choice |
|---|---|
| Next.js | **16.2.10** (App Router) |
| React / react-dom | 19.2.4 |
| TypeScript | ^5, `strict: true`, `noEmit: true` |
| Tailwind | **v4** (`@tailwindcss/postcss`) |
| ESLint | v9 flat config (`eslint.config.mjs`), `eslint-config-next` core-web-vitals + typescript |
| Package manager | **npm** (`package-lock.json`) |
| Node in CI | 20 |
| Test runner | **none installed** |

## Traps — these break training-data assumptions

**Next.js 16 is not the Next.js you know.** `AGENTS.md` mandates: read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Those docs are bundled and present
(`01-app/`, `02-pages/`, `03-architecture/`, `index.md`). APIs, conventions, and file structure
differ from pre-16 knowledge. Heed deprecation notices.

**Tailwind v4 is CSS-first.** There is no `tailwind.config.{js,ts}` and you should not create one.
Theme tokens are declared in `src/app/globals.css` via `@import "tailwindcss"` + an `@theme inline`
block mapping `--color-*` / `--font-*` to CSS variables. TRIP-1 extends this block with brand,
neutral, and semantic budget colors (under / near / over cap).

**Dark mode** must work via `prefers-color-scheme` *and* a `data-theme` override (TRIP-1 AC).
`globals.css` currently only does the media-query half.

## Config facts
- Path alias `@/*` → `./src/*` (tsconfig `paths`).
- `eslint.config.mjs` re-declares the default ignores via `globalIgnores` because `eslint-config-next`'s
  defaults are overridden when you pass your own — don't drop that block.
- `moduleResolution: "bundler"`, `isolatedModules: true`, `jsx: "react-jsx"`.
