# Verification

Load at Step 5.

## Pick command

| Scope | Run |
| ----- | --- |
| Single file | File-scoped test/lint |
| Directory | Package or folder test target |
| API surface change | Broader `check` / `test` for package |

Discover from `package.json` scripts, `Makefile`, CI, or README — same order as other helpers: `pnpm check` → `pnpm test` → `npm test` → language default.

## After deletions

| Failure type | Action |
| ------------ | ------ |
| Missing import/export | Fix call sites and barrels |
| Type errors from removed types | Update types or narrow imports |
| Test referred to removed helper | Remove or rewrite test if behavior gone |
| Test failed but production correct | User decision — do not restore dead code silently |

## Done criteria

- Scoped check/test **pass**, or
- User accepts documented gap (e.g. no tests for module)

Report: commands run, pass/fail, files touched count, items deferred.
