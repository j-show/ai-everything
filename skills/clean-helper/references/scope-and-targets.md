# Scope and Targets

Load at Step 0.

## Resolve scope

1. Parse `{{input}}` for paths, globs, or module names.
2. If empty, use `git diff --name-only` and `git diff --cached --name-only` for changed files.
3. Find related tests and consumers, including those outside the target tree, as read-only evidence. Finding a related file does not authorize editing it.

## Boundaries

| In scope | Out of scope (unless user extends) |
| -------- | ----------------------------------- |
| User path and descendants | Sibling packages “for consistency” |
| Imports **from** scoped files (read-only trace) | Rewriting consumers in other repos |
| Barrel files inside the authorized write scope | Tests/barrels outside that scope, even when related |

## Staging

When user is mid-refactor, prefer **diff scope** so cleanup matches current work. Mention staged-only vs full working tree if it changes the file list.

Record existing staged and unstaged changes before editing. Preserve the index and user changes; recovery follows `verification.md` and only undoes this cleanup's hunks.

## Defer affected items

- Shared types or consumers needing edits outside scope: ask for that extension only; continue independent items.
- Generated files (`*.gen.ts`, protobuf): do not hand-delete. Locate the generator/source; defer if unavailable or outside scope.
- `vendor/`, `third_party/`, minified assets: preserve unless the relevant source change and regeneration are explicitly authorized.
