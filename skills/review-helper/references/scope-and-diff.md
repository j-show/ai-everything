# Scope and Diff

Load at Step 0. Resolve four separate choices: mode, paths, baseline and version layers. Explicit user choices override defaults.

## Inspect before interpreting

Read repository instructions and inspect `git status --short`, branch/ref information, staged and unstaged diffs. Use `git ls-files --stage` to record index entries when protecting staged work. Quote refs such as `'@{upstream}'` for the active shell.

Resolve refs to commit IDs before reviewing so a moving branch does not silently change scope. No automatic fetch, checkout, staging or stash. Missing remote data is a limit, not permission to choose a different comparison.

| Input | Baseline and reviewed content |
| --- | --- |
| `self` | Full branch delta from merge-base with the target/base branch to HEAD, including pushed commits |
| empty | Unpushed delta from the configured upstream to HEAD, plus staged hunks |
| commit | That commit against its parent, plus staged hunks |
| path / “current changes” | Staged and unstaged changes within the named path; inspect relevant untracked files when current changes include them |
| `all` | Full current source tree, excluding dependencies, generated output and vendor code by project convention |
| other ref/range | Resolve the user's exact comparison; do not silently substitute HEAD |

For `self`, commit and empty modes, include staged hunks by default; exclude them when requested. Do not silently include unstaged or untracked content in a committed-version review. Explicit paths filter **every** layer, including staging. Directly related tests may be read; changing tests outside an explicit path requires existing authorization for those tests.

## Select the correct base

- `self`: use the user's named target or known PR base. Otherwise inspect local remote-default metadata (e.g. `git symbolic-ref refs/remotes/origin/HEAD`) and repository conventions. If these identify one intended base, state it and continue; if missing or ambiguous, ask. Never substitute the remote tracking copy of the same feature branch.
- Empty: use the configured upstream, not an assumed `origin/<branch>`. Without an upstream, an explicitly supplied comparison ref is valid; otherwise ask. If upstream is not an ancestor of HEAD, disclose divergence and clarify whether the request concerns net branch changes or a commit set.
- Commit: resolve the parent; a root commit has an empty-tree parent (`git show --root`). For a merge commit, obtain the intended parent/comparison unless already specified.
- `all`: an explicit whole-project request already authorizes that breadth; ask only when the input is ambiguous.

Examples below use placeholders, not literal refs:

```text
self:
  git merge-base <target> HEAD
  git diff --find-renames <merge-base-sha> HEAD -- <paths>
empty, upstream ancestor:
  git diff <upstream-sha> HEAD -- <paths>
commit:
  git diff --find-renames <parent-sha> <commit-sha> -- <paths>
staged layer:
  git diff --cached -- <paths>
unstaged layer:
  git diff -- <paths>
untracked inventory:
  git ls-files --others --exclude-standard -- <paths>
```

Read full hunks and relevant calling code, not just file names. Keep each layer labelled: a staged version can differ from both HEAD and the worktree. Do not concatenate overlapping hunks and pretend they describe one file version.

## Version, location and repair

For committed findings, read `git show <sha>:<path>`; for staged findings, read `git show :<path>`; for worktree findings, read the file. Line numbers must refer to that same version. Track renames and deletions explicitly.

Read-only review never requires checking out a historical ref. Read-only verification must exercise the reviewed version: if imports would read a different worktree, follow the snapshot procedure in `verification-commands.md` or disclose that the version was not executed. A worktree pass cannot validate a different committed or staged dependency graph.

In repair mode, inspect current worktree context before applying a finding. If the same defect exists there and the patch preserves unrelated edits, repair that defect. If the historical/staged defect is already corrected in the worktree, report that distinction; do not reintroduce it or stage the fix. If the intended repair target is uncertain or conflicts with user work, pause only that repair.

After repair, re-review the resulting worktree and the actual task patch. Keep the original comparison as the audit baseline; an unchanged index containing the original defect must not trigger an endless fix loop.

## Boundaries and Step 0 output

Summarize mode, paths, resolved baseline IDs, layers, file count and report destination in one short block. If no in-scope changes exist, report that result; do not expand to all code.

Imports and consumers may be read to establish impact. Findings must be grounded in the selected changes, except for explicit `all` reviews. Cross-package impact alone is not a reason to stop reading; ask only when a necessary repair exceeds authorized paths or intent remains uncertain.

Do not file findings on `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lockb` or `bun.lock`. Inventory them if changed. For generated/vendor defects, locate the editable source and report the relationship; do not hand-edit generated output or expand scope without authorization.
