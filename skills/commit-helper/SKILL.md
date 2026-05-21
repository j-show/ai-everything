---
name: commit-helper
description: "Summarize git changes and create a commit with a structured message. Parallel git status/diff/log; feat/fix/docs type with bullet body; heredoc commit; safe git only. Use when user wants to commit, write commit message, git commit, summarize changes, invoke commit-helper, or create commit. Triggers: 'commit', 'commit-helper', 'git commit', 'commit message', '提交', '写提交信息', '创建 commit', '总结改动并提交', '帮我提交', '拟定提交说明'."
---

# Commit Helper

IRON LAW: Never modify `git config`, never run destructive git commands (`push`, `rebase`, `reset`, `cherry-pick`, etc.), never skip hooks unless the user explicitly requests it, and never `git commit --amend` unless user rules clearly allow it. The commit message must reflect the **actual diff** — do not invent changes.

## Workflow

```
Commit Helper Progress:

- [ ] Step 1: Collect ⚠️ REQUIRED
  - [ ] Load references/git-safety.md
  - [ ] git status; git diff; git diff --staged; git log -n 15 --oneline (parallel)
- [ ] Step 2: Summarize for user ⚠️ REQUIRED
- [ ] Step 3: Draft message ⚠️ REQUIRED
  - [ ] Load references/commit-message-format.md
- [ ] Step 4: Stage and commit
  - [ ] Load references/staging-and-hooks.md
- [ ] Step 5: Report ⚠️ REQUIRED
- [ ] Self-check (pre-delivery checklist below)
```

## Step 1: Collect ⚠️ REQUIRED

Load `references/git-safety.md` first.

Run in **parallel**:

```bash
git status
git diff
git diff --staged
git log -n 15 --oneline
```

Use log output for **wording habit only**; message **structure** always follows `commit-message-format.md`.

Scan for secrets (`.env`, credentials, keys). ⚠️ Do not stage or commit — warn and exclude.

If nothing to commit, stop and tell the user.

## Step 2: Summarize for user ⚠️ REQUIRED

Short paragraph or bullets: **what** changed and **why** (intent). No file-path dump.

Content must map to the commit **title** and each `- ` bullet in Step 3.

## Step 3: Draft message ⚠️ REQUIRED

Load `references/commit-message-format.md`.

- User type in message (from `{{input}}` or conversation) → use it.
- Else pick type by primary intent and weight rules in the reference.

If the user only asked to **draft** a message, show the draft and **stop** before Step 4.

Large or sensitive changes: show draft and confirm before Step 4 unless the user already asked to commit.

## Step 4: Stage and commit

Load `references/staging-and-hooks.md`.

1. `git add` scoped to this change (explicit paths; `git add -A` only when all pending files belong to this commit).
2. Commit with **heredoc** multiline `-m` (required for title + bullet body).
3. `git status` after commit.

On hook failure: see `staging-and-hooks.md` — fix and **new** commit, not amend (unless user rules allow amend).

## Step 5: Report ⚠️ REQUIRED

Show the user:

1. Change summary (from Step 2)
2. Exact commit command used or full commit message text
3. Post-commit `git status` (e.g. clean working tree, or ahead of remote by N commits)

## Anti-Patterns

- Single-line `-m` for multiline `{type}: title` + bullets
- Amend after failed/rejected hook without user-rule permission
- `--no-verify` / `--no-gpg-sign` without explicit user request
- Staging secrets or changing `git config`
- File-list messages with no intent
- Committing with empty diff without explanation
- Unescaped `"` inside heredoc body

## Pre-Delivery Checklist

- [ ] Parallel collect including `git log -n 15 --oneline`
- [ ] No secrets staged
- [ ] `{type}: {title}` + blank line + `- ` bullets; type from table or user override
- [ ] Heredoc commit when body is multiline
- [ ] Post-commit `git status` shown
- [ ] No destructive git commands
