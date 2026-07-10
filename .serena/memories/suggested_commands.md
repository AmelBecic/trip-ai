# Suggested Commands

## Scripts that exist (`package.json`)
| Purpose | Command |
|---|---|
| Dev server | `npm run dev` |
| Prod build | `npm run build` |
| Serve build | `npm start` |
| Lint | `npm run lint` |
| Typecheck | `npm run typecheck` (`tsc --noEmit`) |
| Tests | `npm run test` (`vitest run`) |
| Secret scan | `npm run secrets` (`gitleaks detect` over history) |

All three quality gates named in `CLAUDE.md` are defined and enforced — see `mem:task_completion`.

## Tests
Vitest + jsdom + Testing Library, configured in `vitest.config.mts`. Tests are colocated and
matched by `src/**/*.test.{ts,tsx}`. Import test fns explicitly from `vitest` (globals are off).

## Dependencies
Regenerate the lockfile rather than patching it, and validate it for the platform CI runs on:

```bash
rm -rf node_modules package-lock.json && npm install
npm ci --dry-run --os=linux --cpu=x64   # must exit 0
```

An incremental `npm install` on darwin/arm64 demotes the hoisted top-level `@emnapi/core` and
`@emnapi/runtime` lock entries that `@tailwindcss/oxide` and `sharp` resolve against on linux/x64.
`npm ci` then fails on the runner while passing locally — a bare local `npm ci` is a false pass.

## Git / workflow
- Hooks live in `.githooks` (`git config core.hooksPath` is set to it), not `.git/hooks`.
- `.gitattributes` routes `*.ts,tsx,js,json,css,yml,…` through the **mergiraf** merge driver
  (registered globally by the dev-kit setup script, outside this repo). Conflicts it can't resolve are left with markers.
- Regenerate the driver list: `mergiraf languages --gitattributes`

## Darwin (macOS) shell differences
- `sed -i` requires an explicit backup suffix: `sed -i '' 's/a/b/' file` (GNU form fails).
- BSD `find` has no `-printf`; BSD `grep` lacks `-P`. Prefer Serena's search tools or `rg`.
