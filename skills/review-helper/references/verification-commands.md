# Verification Commands

Load at Step 3. Verification follows the selected review version and authorized mode.

## Choose by coverage, not script name

1. Read repository instructions, CI, README and actual script definitions. Identify the package manager from project configuration, not the skill description.
2. List required checks and the behavior affected by the findings. Choose the smallest command set that covers both. An aggregate command that already covers them needs no redundant second run.
3. Inspect `check:all`, `check`, `test:all`, `test` as candidates, not an early-exit order. A syntax/lint/type-only check does not replace a relevant behavior test.
4. Scope to a package or file only when supported. Preserve working directory, environment setup, build steps, fixtures, runner options and lifecycle hooks. Do not append filters to a fixed glob assuming they narrow it.

Examples, only when supported by the project:

| Project | Scoped behavior verification |
| --- | --- |
| Node built-in tests | `node --test tests/cart.test.mjs` |
| pnpm workspace | Package script via `pnpm --filter <package> run <script>` |
| Python | Project's configured runner for `tests/<area>` |
| Go | `go test ./path/to/package/...` |

Read-only mode does not authorize formatters, snapshots updates, auto-fixes or other commands that modify project files. Prefer non-mutating checks; if no safe equivalent exists, report that check as not run.

Do not install dependencies or contact services without authorization. When installation is forbidden and a package-manager wrapper can auto-install/bootstrap, use an already installed runner only if the inspected script and its prerequisites are preserved. Otherwise mark that check blocked. If unexpected generated files appear, stop that command path, inspect what changed, and remove only proven task-created disposable outputs within the test/workspace boundary; preserve pre-existing files and disclose the side effect.

## When the reviewed snapshot differs from the worktree

Use a fresh task-owned temporary directory outside the source tree. Keep repository instructions in force there. A ban on **all** filesystem writes also forbids materializing a snapshot; use an allowed complete in-memory probe or report it unverified. Do not run formatters/builds against the original tree, switch branches, stash user work or replace the original index to obtain a snapshot.

1. Pin the commit SHA, or record `git ls-files --stage` for an index review. Read the snapshot's entry points, imports, package configuration, tests and setup/build steps. Copying only a changed function or file is not equivalent execution.
2. Materialize the full tracked snapshot, then scope the **commands**, not the dependency graph:
   - Commit: export the pinned tree with `git archive <sha>` and extract inside the fresh directory using available tooling.
   - Index: `git checkout-index --all --prefix=<absolute-temp-dir>/` reads the existing index into that directory; do not add `-u`, edit the index or overlay worktree files. Capture its exit code and recheck index entries. An unmerged index, missing blob or changed index invalidates the snapshot: discard only the task-owned output and report that validation blocked.
   - Verify required paths and contents against `git ls-tree -r <sha>` / pinned blobs, or the recorded index entries. Archive attributes (`export-ignore`, `export-subst`) and checkout filters can omit or transform files; a successful export is not proof of equivalent inputs. Restore ordinary files from the selected blobs with byte-preserving file APIs when sufficient. If required inputs remain unavailable (including submodule/LFS content), mark blocked; never substitute worktree files.
3. Run from the snapshot's correct package directory with its actual test/configuration files and prerequisites. Use existing authorized tooling; do not link mutable source dependencies/caches, import modules from the original checkout, copy credentials, install packages or attach real services to fill gaps without authorization. Missing ignored build inputs/dependencies are a stated blocker; they do not justify substituting current worktree files.
4. Use per-process working directories and environment overrides; do not modify persistent machine/user configuration. If an execution API requires temporarily changing the caller process's directory or environment, restore its original value **and presence** in a `finally` path, including absent versus empty variables.
5. On pass, test failure or setup error, record command exits and findings first. Then remove only the newly created directory after validating its resolved absolute boundary and ownership; never clean an existing user directory. Record cleanup failure separately, keep its path for recovery and continue independent review. Do not label a failed test or cleanup as passed.

Where full export is unavailable, an in-memory probe is only sufficient if it executes the original snapshot modules and their complete dependency closure without rewriting logic; otherwise mark the snapshot unverified. Run independent checks that do not depend on the blocked snapshot. Report snapshot identity, execution directory, actual coverage and cleanup state.

## Execute and record

State the command, working directory, purpose and reviewed version. Capture **each test process's** actual exit code immediately; a later successful command must not replace it.

Record collected/passed/failed/skipped counts when available. Zero tests, missing runner, discovery failure or a skipped suite is not successful behavior verification, even if the wrapper exits zero. Investigate discovery within scope or report the gap.

In a committed/staged review, do not claim a test of a different worktree validated the reviewed snapshot. Follow the version rules in `scope-and-diff.md`.

## Handle results without losing scope

| Result | Action |
| --- | --- |
| Confirmed in-scope defect | In repair mode fix the implementation, re-review the patch, then rerun affected checks; in review-only mode report it |
| Obsolete test | Change it only with evidence of the intended contract and authorization for that file; never weaken a valid regression to fit a bug |
| Pre-existing or unrelated failure | Preserve it, report separately, continue independent in-scope validation |
| Missing environment, dependency or credentials | Mark blocked, do not repeat unchanged attempts; continue independent checks |
| Flaky result | Record the failure; investigate within scope, and rerun only for a stated diagnostic reason; a later pass alone does not resolve it |
| No command or zero tests | Report not verified; use an allowed focused probe if meaningful, without claiming equivalent suite coverage |
| Repeated failure without progress | Stop that repair loop and report remaining evidence and the needed decision |

After a code change, re-review even if it was prompted by a test failure. Rerun checks affected by that change; broaden only when new evidence justifies it.

## Completion statement

List commands and outcomes as `通过 / 失败 / 阻塞 / 未执行`, with coverage and remaining defects. An executed integration test may exit 1 because of missing configuration: report both the actual failure and the environmental cause.

Work can be delivered with documented limits, but “all checks passed” requires all required checks to have actually passed with relevant coverage. User acceptance of a gap does not change a failed or unexecuted check into a pass.
