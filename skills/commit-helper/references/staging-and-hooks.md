# Staging, Commit, Hooks

Load at Step 4.

## Select a strategy before staging

A normal `git commit` records **all staged content**. Scoped `git add` does not remove unrelated staged changes.

| Requested scope | Strategy | Stop condition |
| --- | --- | --- |
| Current staged changes, including a partially staged file | Review `git diff --cached`; commit the index without `git add`, `-a`, path arguments or `--only`. Unstaged hunks must remain unstaged. | Index contains unauthorized content or secrets. |
| All staged changes of named paths, with other paths also staged | Use the temporary-index procedure below. Commit only the selected paths' existing index content; leave their unstaged changes and other staged paths intact. | User selected only some staged hunks within a path, or the prepared patch/tree does not match the authorized scope. |
| Entire working-tree changes of named files | Read their staged and unstaged diffs (and untracked contents). Stage only authorized new files if necessary, then use `git commit --only --cleanup=verbatim -F <message-file> -- <paths…>` to exclude unrelated staged paths. | Any selected file contains hunks the user did not authorize. `--only` takes its working-tree content, not just its staged hunks. |
| Selected hunks mixed with unrelated staged content | Preserve the existing index and working tree; isolate only the approved hunks using a reviewed patch/temporary index if supported. | If safe isolation cannot be verified, **STOP** and describe the exact overlap; do not broaden scope or unstage others' changes. |

Quote each path for the current shell, use `--`, and use Git's `--literal-pathspecs` option for names containing pathspec metacharacters. For a normal index commit, `git add -- <paths…>` is allowed only when all changes in those paths belong in the commit. Use `git add -A` only if every pending change is authorized and inspected.

Before mutation, record HEAD (or its absence) and unrelated staged diffs/working-tree state. Before committing, inspect the full selected diff again; for the whole-file strategy, inspect both index and working-tree versions. Refresh the draft if the selected content changed.

## Temporary index for named staged paths

Use this only for **all currently staged changes of each selected path**, not arbitrary hunk selection. The original index already contains the selected content, so it needs no rewriting after a matching commit.

1. Capture the original HEAD, active index entries (`git ls-files --stage -z`), and working-tree state. Resolve paths from the repository root. Create a unique directory outside the repository for a patch and an **initially nonexistent**, absolute temporary index path; an empty index file is not a valid index.
2. Export the selected staged diff with Git writing directly to the patch file, avoiding shell redirection that may change bytes:
   ```text
   git --literal-pathspecs diff --cached --binary --full-index --no-renames --no-ext-diff --no-textconv --output=<patch-file> <original-HEAD> -- <selected-paths…>
   ```
   On an unborn branch, omit `<original-HEAD>`. An empty patch means stop without committing. Read the patch and verify its paths/content. Renames are represented as deletion/addition: include both paths only when both are authorized.
3. Scope `GIT_INDEX_FILE` to the temporary index for the following commands only. Check every exit code and stop on failure:
   ```text
   git read-tree <original-HEAD>
   git apply --cached --check <patch-file>
   git apply --cached <patch-file>
   git diff --cached --binary --full-index --no-renames --no-ext-diff --no-textconv <original-HEAD>
   git write-tree
   ```
   For an unborn branch use `git read-tree --empty` and omit HEAD in the diff. The complete temporary diff must equal the exported selected diff. Record the temporary `write-tree` result as the expected commit tree. Never run `read-tree` against the original index.
4. With the original index environment restored, recheck HEAD, original index entries and working-tree state for concurrent changes; stop if they changed. Then run the message-file commit **in the temporary-index environment**, without `-a`, `--only` or path arguments.
5. Restore the previous index environment in all outcomes. Check HEAD even if the command reported failure. On success verify the new commit's parent (none for the initial commit), tree, message, original index entries and working-tree state against the snapshots. Do not copy the temporary index over the original, unstage files, or “resynchronize” it: a matching commit naturally leaves only the other paths staged.
6. After recording diagnostics, remove only this attempt's temporary artifacts. On failure or hook edits, stop automatic retries, report actual HEAD/index/work-tree changes, and rebuild a fresh temporary index only after the selected staged source has been reviewed again. Never absorb the selected file's whole working-tree content to repair the attempt.

Scope the environment using the runtime's per-child-process environment map when available. Otherwise use the current shell's protected scope; `<commands>` includes initialization, inspection and commit, with the original-environment recheck in step 4 performed between scopes:

| Shell | Environment scope |
| --- | --- |
| PowerShell | Save `$indexWasSet = Test-Path Env:GIT_INDEX_FILE` and `$previousIndex = $env:GIT_INDEX_FILE`; `try { $env:GIT_INDEX_FILE = $temporaryIndex; <commands> } finally { if ($indexWasSet) { $env:GIT_INDEX_FILE = $previousIndex } else { Remove-Item Env:GIT_INDEX_FILE -ErrorAction SilentlyContinue } }`. Check `$LASTEXITCODE` after each Git command. |
| Bash | `( export GIT_INDEX_FILE="$temporary_index"; <commands> )`; stop on any failed command and never export the temporary value into the caller's shell. |

Hooks inherit the temporary index and may still change its content or the working tree. If a hook is known to stage outside the selected scope, stop before running it. If the actual committed tree differs from the expected tree, report the unexpected commit and stop; do not claim successful isolation or automatically amend/reset it.

Verify both environment-variable presence and value after restoration. In PowerShell, passing `$null` to `[Environment]::SetEnvironmentVariable` can leave an empty variable; Git may then resolve the index path as `./`. Explicitly remove an originally absent variable as above, and verify `git rev-parse --git-path index` resolves to the original index before continuing.

## Commit

Use the native-shell message-file recipe in `commit-message-format.md`. Preserve literal message text and check the commit exit status before continuing.

## After commit

```bash
git log -1 --format=%B
git status
```

Verify the recorded message matches the draft. Report clean tree, or remaining intentional unstaged/untracked files, or **ahead of remote by N commits**.

Inspect the new commit's paths and patch against the selected scope, including hook edits, and compare unrelated staged/working-tree changes with the saved state. On mismatch, report the actual commit and remaining changes; do not claim success or silently rewrite it. Push/amend authorization is defined only in `git-safety.md`.

## Hook failure

Temporary-index attempts follow their dedicated stop-and-rebuild procedure above; the automatic retry rows below apply only to original-index and whole-file strategies.

| Trigger | First action | Retry / stop |
| --- | --- | --- |
| Ordinary commit fails; HEAD unchanged | Read the error and inspect staged/unstaged diffs, including hook edits. | After fixing the identified cause and running its checks, retry an ordinary commit with the same scope strategy; never amend the preceding HEAD. |
| Hook formats only authorized content | Review the exact edits and rerun the hook's checks. | Stage only approved edits when using the index strategy; preserve excluded hunks. For whole-file commits, re-inspect selected files before retrying. |
| Hook touches unrelated paths/hunks, or selected content changes unexpectedly | Preserve the resulting state and report the unexpected changes. | **STOP** before retrying; do not auto-stage, revert or expand scope. |
| Error returned but HEAD changed | Inspect the new HEAD and its diff before taking action. | Do not blindly retry: that could create a duplicate commit. Report the observed result. |
| Commit succeeds but hook edits remain | Compare the commit with the remaining diff and report both. | Do not auto-amend or create an extra commit to absorb them; obtain scope authorization if needed. |
| Required inspection, identity/signing, lock or tests fail without an in-scope fix | Report the specific failure without changing user configuration or bypassing checks. | **STOP**; do not repeatedly retry the same failure. |
