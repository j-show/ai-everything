# Verification

Load at Step 5 (Verify).

## Pick command scope

| Change scope | Run |
| ------------ | --- |
| Single file | Existing runner's one-shot file command (e.g. `vitest run path`, `pytest path`, `node --test path`) |
| Directory | Directory-scoped command |
| Full suite | `npm test`, `pnpm test`, `pytest`, etc. |

Resolve the command from the owning package's scripts, runner config, Makefile or CI before running:

1. Map the requested source to actual test files via imports/config; a source directory is not necessarily a test selector. Record the package working directory and quote paths containing spaces.
2. Prefer an existing scoped script. Inspect its expansion and lifecycle hooks: appending a filename does not remove an existing glob or chained full-suite command.
3. If no scoped script exists, use the installed runner with an explicit test-file selector **and preserve required config, setup/preload, environment and build/generation steps**. Do not bypass hooks merely to narrow the command, or execute stale generated tests. Do not install a runner implicitly.
4. Check output for the intended files/cases and actual process status. If selection cannot be narrowed without losing prerequisites or expanding authorization, report the limitation and run other independent scopes.

Example: if `test` expands to `node --import ./test/setup.mjs --test tests/*.test.mjs`, `npm test -- tests/catalog.test.mjs` still includes the original glob. After checking lifecycle hooks, a scoped command from that package directory is `node --import ./test/setup.mjs --test tests/catalog.test.mjs`. This is a Node example, not a replacement for another project's runner/config.

Capture existing failures before editing when runnable. Avoid watch mode and unrelated suites unless needed to validate changed shared fixtures; scope expansion still follows SKILL.md Step 1.

If edits change shared-state setup or cleanup, verify the affected cases together with relevant existing isolation checks, within scope. Check that cleanup also runs when the action/assertion fails; use an existing failure path or an isolated probe, not a permanent deliberate failure. A test passing alone does not establish isolation. If this cannot be verified, report that limit.

## Classify failures

| Trigger | First action | If unresolved |
| ------- | ------------ | ------------- |
| Test disagrees with current behavior, with no unresolved requirement or contract conflict | Fix the stale test and rerun its scope | Recheck the active call chain; do not repeatedly copy actual values until green |
| Implementation violates an explicit requirement or public contract | Preserve the valid failing assertion; report expected vs actual and source evidence | Continue independent repairs; request a decision only for work outside existing authorization |
| Evidence cannot establish whether the test or implementation is wrong | Keep the disputed assertion unchanged and list missing evidence | Continue independent work; ask the focused contract question |
| Flaky time/network behavior | Diagnose and isolate with existing project patterns | Report remaining instability; do not skip the test or weaken its assertion to hide failure |
| Required DB, environment, or tool is unavailable | Record the blocker; run independently available tests | Report what was not verified; do not install tools or connect services outside the authorized scope |
| Command succeeds but collects zero intended tests | Check the runner, working directory, and filter; rerun the intended scope | Report verification as incomplete, not passing |

## Report to user

Include:

1. Working directory, prerequisite steps and command(s) actually run
2. Test process exit status and collected, passed, failed, and skipped counts from actual output; label unavailable counts and identify checks not run
3. For failures: test name, expected vs actual, classification, evidence, and remaining action

Do not use the last shell command's status as the test result. Collection failures and unexecuted suites are unverified even if another command succeeds.

## Done criteria

- Claim verified success only when the intended tests were collected and passed; disclose skips or unrun checks.
- For added coverage, confirm the requested behaviors map to executed cases, including the new ones; existing tests passing alone does not fulfill the request.
- When defects, uncertainty, or environment blocks remain, deliver completed independent repairs and label validation as partial or blocked. Do not claim the whole suite passed.
