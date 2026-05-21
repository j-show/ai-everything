# Staging, Commit, Hooks

Load at Step 4.

## Staging

1. Prefer explicit paths: `git add <paths…>`
2. `git add -A` only when **every** pending change belongs to this commit
3. Goal: smallest scope that still fully represents the intent of this commit
4. Re-check: staged set matches the message you wrote

## Commit

Use heredoc from `commit-message-format.md`. On PowerShell, use an equivalent multiline commit form the environment supports; prefer Git Bash heredoc when available.

## After commit

```bash
git status
```

Report clean tree, or remaining intentional unstaged/untracked files, or **ahead of remote by N commits**.

Do **not** `git push` unless the user explicitly asks in the same turn.

## Hook failure

| Situation | Action |
| --------- | ------ |
| Commit failed / hook rejected | **No** `--amend` on that attempt |
| Hook auto-fixed files (lint/format) | Fix remaining issues, re-stage, **new** commit |
| Tests failed | Fix or report; do not commit broken state unless user insists |

Re-run what the hook enforced before retrying.
