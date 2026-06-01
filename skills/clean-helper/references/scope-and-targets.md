# Scope and Targets

Load at Step 0.

## Resolve scope

1. Parse `{{input}}` for paths, globs, or module names.
2. If empty, use `git diff --name-only` and `git diff --cached --name-only` for changed files.
3. Expand to **implementation + co-located tests** (e.g. `foo.ts` + `foo.test.ts`).

## Boundaries

| In scope | Out of scope (unless user extends) |
| -------- | ----------------------------------- |
| User path and descendants | Sibling packages “for consistency” |
| Imports **from** scoped files (read-only trace) | Rewriting consumers in other repos |
| Barrel files that re-export removed symbols | Unrelated directories |

## Staging

When user is mid-refactor, prefer **diff scope** so cleanup matches current work. Mention staged-only vs full working tree if it changes the file list.

## Stop and ask

- Monorepo package with shared types used elsewhere
- Generated files (`*.gen.ts`, protobuf) — do not hand-delete; fix generator/source
- `vendor/`, `third_party/`, minified assets
