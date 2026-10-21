---
name: commit-helper
description: "Summarize actual Git changes, draft a structured commit message, and commit when requested. Use when the user asks to commit, summarize changes, or draft a commit message. Triggers: 'commit', 'commit-helper', 'git commit', 'commit message', '提交', '写提交信息', '创建 commit', '总结改动并提交', '帮我提交', '拟定提交说明'."
---

# Commit Helper

The message must reflect the **actual changes selected for this commit**. Preserve unrelated working-tree and staged changes. `references/git-safety.md` defines authorization and prohibited operations; hook changes never grant permission to amend.

## Workflow

```
Collect + determine mode/scope
  ├─ Summary only → summarize → stop (read-only)
  ├─ Message only → summarize + draft → stop (read-only)
  └─ Commit requested → draft → isolate scope → commit → verify + report
```

## Step 1: Collect ⚠️ REQUIRED

Load `references/git-safety.md` first. Determine whether the user requested a summary, a message, or a commit. Reuse existing explicit authorization; invoking the skill alone does not authorize a commit.

Run in **parallel**:

```bash
git status
git diff
git diff --staged
git log -n 15 --oneline
```

Use log output for **wording habit only**; message **structure** always follows `commit-message-format.md`.

Use the user's scope. For commit/message requests without an explicit scope, prefer existing staged changes; if none exist, select one clearly related change group, asking only when several unrelated groups make the scope ambiguous. Summaries cover the requested changes without staging them. Keep staged and unstaged changes distinct, including within the same file.

Inspect selected untracked files before describing or staging them: `git diff` does not show their contents. Screen sensitive paths first, and report suspected secrets by path without printing values.

If a required inspection fails, conflicts exist, or a merge/rebase/cherry-pick is in progress, stop before mutation and report the blocker. An unborn branch has no log; treat that alone as expected and inspect its initial changes. If the selected scope is empty, report that and stop.

## Step 2: Summarize for user ⚠️ REQUIRED

Short paragraph or bullets: **what** changed and **why** (intent). No file-path dump.

Content must map to the commit **title** and each `- ` bullet in Step 3.

For summary-only requests, stop here without staging or committing.

## Step 3: Draft message ⚠️ REQUIRED

Load `references/commit-message-format.md`.

- User type in message (from `{{input}}` or conversation) → use it.
- Else pick type by primary intent and weight rules in the reference.

If the user only asked to **draft** a message, show the draft and **stop** before Step 4.

Large or sensitive changes: show draft and confirm before Step 4 unless the user already asked to commit.

## Step 4: Stage and commit

Load `references/staging-and-hooks.md`.

1. Choose the index, named staged paths, or whole-file strategy in `staging-and-hooks.md`. Inspect the complete selected diff, retain a snapshot of unrelated staged/working-tree changes, and verify that the draft describes exactly what will be committed.
2. Write the exact message to a temporary UTF-8 file outside the repository. Use the PowerShell or Bash recipe in `commit-message-format.md`, adding `--only -- <paths>` only when the whole-file strategy permits it.
3. Check the exit status. After success, read `git log -1 --format=%B`, inspect the new commit's paths/diff, and run `git status`; verify the message, scope and preserved unrelated changes.

On failure, follow `staging-and-hooks.md`; do not reinterpret a failed ordinary commit as permission to amend the previous commit.

## Step 5: Report ⚠️ REQUIRED

Show the user:

1. Change summary (from Step 2)
2. Exact commit command used or full commit message text
3. Post-commit `git status` (e.g. clean working tree, or ahead of remote by N commits)

## Anti-Patterns

- Interpolating message text into a shell command instead of passing a message file
- Treating hook edits or a failed ordinary commit as amend authorization
- `--no-verify` / `--no-gpg-sign` without explicit user request
- Staging secrets or changing `git config`
- File-list messages with no intent
- Committing with empty diff without explanation
- Escaping literal quotes unnecessarily, or expanding `$()` / backticks in message text
- Assuming scoped `git add` excludes other staged files, or using `--only` for selected hunks
- Replacing the original index with a temporary one, or leaking `GIT_INDEX_FILE` into later commands
- Treating a summary/message request as permission to commit

## Pre-Delivery Checklist

- [ ] Parallel collect including `git log -n 15 --oneline`
- [ ] Selected commit scope is authorized and contains no secrets
- [ ] `{type}: {title}` + blank line + `- ` bullets; type from table or user override
- [ ] Recorded message matches the draft, including literal characters
- [ ] Post-commit `git status` shown
- [ ] Actual commit scope verified; unrelated staged and working-tree changes preserved
