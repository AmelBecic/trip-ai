# Suggested Commands

## Scripts that exist (`package.json`)
| Purpose | Command |
|---|---|
| Dev server | `npm run dev` |
| Prod build | `npm run build` |
| Serve build | `npm start` |
| Lint | `npm run lint` |

## Scripts that are documented but DO NOT exist
`CLAUDE.md` and `docs/workflow.md` tell you to run `npm run typecheck`, `npm run test`, and
`npm run secrets`. **None of these scripts are defined.** Every caller guards them
(`npm run x --if-present` in CI, a `has()` probe in the pre-commit hook), so they silently
no-op rather than fail. Use the real equivalents until someone adds the scripts:

| Intent | Actually run |
|---|---|
| Typecheck | `npx tsc --noEmit` |
| Secret scan | `gitleaks git --staged --no-banner --redact` (staged) · `gitleaks detect` (history) |
| Tests | no runner installed — adding one means adding the dep *and* the `test` script |

## Git / workflow
- Hooks live in `.githooks` (`git config core.hooksPath` is set to it), not `.git/hooks`.
- `.gitattributes` routes `*.ts,tsx,js,json,css,yml,…` through the **mergiraf** merge driver
  (registered globally by the dev-kit setup script, outside this repo). Conflicts it can't resolve are left with markers.
- Regenerate the driver list: `mergiraf languages --gitattributes`

## Darwin (macOS) shell differences
- `sed -i` requires an explicit backup suffix: `sed -i '' 's/a/b/' file` (GNU form fails).
- BSD `find` has no `-printf`; BSD `grep` lacks `-P`. Prefer Serena's search tools or `rg`.
