# Git Safety

Load at Step 1.

## Forbidden

| Action | Notes |
| ------ | ----- |
| `git config` (any set/unset) | Do not alter user environment |
| `git push`, `git pull --force`, `git rebase`, `git reset`, `git cherry-pick` | Destructive or out of scope |
| `--no-verify`, `--no-gpg-sign` | Unless user explicitly requests |
| Default `git commit --amend` | See amend rules below |
| Staging `.env`, credentials, keys, tokens | Warn user; exclude from `git add` |

## Allowed

- `git status`, `git diff`, `git log`
- `git add` (scoped)
- `git commit` (heredoc message)

## Amend (only when user rules permit)

All required:

1. User explicitly requested amend, **or** commit succeeded but pre-commit hook modified files that must be included
2. HEAD was created in this session by you (verify author if needed)
3. Commit **not** pushed to remote

**Never** amend if commit **failed** or hook **rejected** — fix issues, re-stage, create a **new** commit.

## Secrets

Flag before `git add`: `.env`, `.env.*`, `*credentials*`, `*.pem`, `id_rsa`, and paths the user marked sensitive.
