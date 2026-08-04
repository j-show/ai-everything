# Scope and Diff

Load at Step 0.

## Resolve scope from `{{input}}`

Combine user text with **staged changes** unless the user explicitly excludes staging.

| `{{input}}` | Review scope |
| ----------- | -------------- |
| `all` | All code in the current project |
| `self` | All code on the current branch |
| commit hash | That commit's changes + **staging area** |
| _(empty)_ | Local commits not on `origin` + **staging area** |
| other path/ref | Interpret per user intent; still include staging unless excluded |

Notes:

- `self` vs _(empty)_: `self` is the full branch delta; _(empty)_ is unpushed commits relative to `origin` plus staging.
- Directory paths are scope hints — narrow the file list when the user names a path; do not expand to unrelated packages.
- For `all` or very large scope, confirm with the user before scanning the entire tree.

## Build the file list

Discover branch and remote:

```bash
git rev-parse --abbrev-ref HEAD
git rev-parse --abbrev-ref @{upstream}   # if set
```

| Scope mode | Typical commands |
| ---------- | ---------------- |
| _(empty)_ unpushed + staging | `git log origin/<branch>..HEAD --oneline` then `git diff --name-only origin/<branch>...HEAD`; add `git diff --cached --name-only` |
| `self` (current branch) | `git merge-base origin/<branch> HEAD` then diff from merge-base to HEAD; add staged |
| commit hash | `git show --name-only --pretty=format: <hash>`; add `git diff --cached --name-only` |
| `all` | Enumerate source files per project norms (e.g. `src/`, `lib/`, exclude `node_modules`, `dist`, `vendor`) |
| path hint | User path + descendants; intersect with diff when a diff exists |

If `origin/<branch>` is missing, use `git log @{upstream}..HEAD` when upstream exists; otherwise ask which baseline to compare against.

## Diff boundaries

| In scope | Out of scope (unless user extends) |
| -------- | ----------------------------------- |
| Changed lines in resolved files | Unchanged files "for consistency" |
| Staged hunks when staging is included | Drive-by refactors in untouched modules |
| Imports read-only to judge a changed call site | Full-repo style sweeps |

Review **only hunks inside the resolved scope**. Do not file findings on lines outside the diff unless the user widened scope.

## Ignored paths (findings)

Do not report P0–P3 issues on lockfiles:

- `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lockb`

Still list them in the file inventory if they appear in the diff; skip finding rows for those paths.

## Stop and ask

- Monorepo change with cross-package impact unclear from the diff alone
- Generated or vendor trees (`vendor/`, `third_party/`, `*.gen.ts`) — note in report; do not demand hand-edits without source fix
- Ambiguous `{{input}}` that could mean `all` vs unpushed vs a path

## Deliverable for Step 0

Before Step 1, state in one short block:

1. Resolved scope mode (`all` / `self` / hash / empty / path)
2. Baseline ref used (branch, upstream, or hash)
3. File count and whether staging is included
