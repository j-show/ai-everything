# Verification

Load before Step 4; reuse after each logical cleanup.

## Pick command

| Scope | Run |
| ----- | --- |
| Single file | File-scoped test/lint |
| Directory | Package or folder test target |
| API surface change | Broader `check` / `test` for package |

Read the actual package scripts, test configuration, Makefile, CI or README. Use the project's runner and required working directory/setup/build steps; do not invent a `pnpm check` or replace a configured command with a bare runner that skips prerequisites. Run independent checks even if another cannot run.

## Establish a baseline

Before editing, record the current diff, staged entries and contents of files to edit, including user changes. Run the relevant checks and record each actual process exit code, test counts and failures. If a check is unavailable, record why; never assume the starting state was green.

## Classify and recover

| Trigger | Action | If unresolved |
| ------- | ------ | ------------- |
| A new import/type error follows cleanup | Repair only authorized call sites/imports; rerun | Undo the responsible cleanup hunks; defer edits needing wider scope |
| A valid behavior test fails after cleanup | Treat it as counter-evidence to the deletion/simplification; preserve the assertion and locally undo the responsible change | Record the remaining failure; do not claim cleanup is verified |
| The same failure existed before cleanup | Retain the valid failing test and compare the failure, not just its count | Report it separately; continue independent safe cleanup/checks |
| Missing dependency, service, configuration or unavailable runner | Record the actual blocked/failed command; run checks that do not depend on it | Report the unverified area; no unrequested install or real-service access |
| Exit 0 but zero relevant test bodies ran, or command still running | Check selection/configuration or wait for completion | Record zero coverage/pending, never “passed”; use a valid scoped entry point if available |
| Failure has no reliable baseline or attribution | Inspect the changed path, contract and failure evidence | Mark attribution unknown; defer the affected item rather than rewrite expectations |

Recovery requires no fresh approval when undoing your own proven regression. Reverse only the responsible hunks against the current contents. Preserve original staged entries, pre-existing user edits and any later edits. A snapshot is comparison evidence, not permission to overwrite a file. If edits overlap or ownership is uncertain, leave the current content intact, explain the conflict, and ask a targeted question while continuing independent work. Never use whole-file checkout/reset, index replacement or broad stash/revert for this recovery.

Tests are not disposable fallout: remove or rewrite a test only for an explicitly retired contract, within the authorized write scope. Do not delete/skip a valid regression, change its expected result to the broken implementation, or label a test “wrong” merely because cleanup caused it to fail.

## Completion and report

- Claim **verified** only for the affected behavior actually exercised by completed checks. Lint/type checks alone do not prove behavioral equivalence.
- Separate verified cleanup, restored/deferred items, pre-existing failures, environment blockers, zero coverage, pending runs and unknown attribution. Unresolved items need not block independent work, but cannot be reported as passed or user-accepted.
- Report commands with their working directories, actual exit codes/counts, files changed, restored hunks and remaining gaps. After recovery, rerun the affected tests. A repeated cleanup request should leave already-correct code unchanged.
