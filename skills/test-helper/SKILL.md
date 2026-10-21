---
name: test-helper
description: "Find implementation code, update outdated tests or add requested coverage, and preserve valid regressions. 检索实现，修正过时测试或补齐用户要求的覆盖，区分测试过期与实现缺陷. Traces public APIs and call chains, checks confirmed requirements, and reports verified results and blockers. Use when user wants to add tests, rewrite tests, fix outdated tests, align tests with implementation, invoke test-helper, refresh test suite, or test a specific directory. Triggers: 'test', 'test-helper', 'add tests', 'rewrite tests', 'update tests', 'fix tests', 'test cases', 'unit tests', '重写测试', '测试用例', '补测试', '对齐测试', '实现为准', '检索实现', '重新实现测试'."
---

# Test Helper

Read source and call chains to establish **actual behavior**, then distinguish outdated tests from implementation defects. An implementation is evidence of what happens, not proof of what is correct. Do not rewrite test bodies before completing discovery and the contract checklist (Steps 2–3).

## Workflow

Copy this checklist and check off items as you complete them:

```
Test Helper Progress:

- [ ] Step 1: Scope ⚠️ REQUIRED
  - [ ] 1.1 Resolve scope from user path, failure output, or relevant changes
  - [ ] 1.2 List test files and matching implementation modules
  - [ ] 1.3 Resolve test files, package working directory and command prerequisites
- [ ] Step 2: Discover implementation ⚠️ REQUIRED
  - [ ] Load references/implementation-discovery.md
  - [ ] Trace entry points to core logic; record I/O, side effects, errors
- [ ] Step 3: Contract checklist ⚠️ REQUIRED
  - [ ] Load references/contract-checklist.md
  - [ ] Record behavior, contract evidence, stale cases and requested coverage gaps
- [ ] Step 4: Rewrite tests
  - [ ] Load references/test-rewrite-patterns.md
  - [ ] Repair stale cases or add requested coverage; isolate effects per project norms
- [ ] Step 5: Verify ⚠️ REQUIRED
  - [ ] Load references/verification.md
  - [ ] Run scoped test command; classify failures
- [ ] Step 6: Self-check ⚠️ REQUIRED
  - [ ] Run pre-delivery checklist below
```

## Step 1: Scope ⚠️ REQUIRED

Resolve whether the request is to repair existing tests or add coverage. An explicit test-addition request does not require an existing failure.

### Directory scope

| User input | Test scope |
| ---------- | ---------- |
| Specifies a directory (e.g. `src/auth`, `tests/unit/foo`) | Rewrite tests **only** under/for that directory |
| No directory given | Infer the smallest relevant scope from failure output or changes; ask only if it cannot be determined |
| Explicit full-suite request | Inspect all relevant suites; repair stale cases or fill requested coverage gaps |

Check existing edits before writing. Preserve user changes and valid regressions, including tests outside the source directory. Do not repeat questions already resolved by the request or repository evidence.

Discover:
1. Test file locations (`test/`, `tests/`, `__tests__/`, `*.test.*`, `*.spec.*`).
2. Corresponding implementation paths (mirror layout or imports).
3. Test runner and scripts — package working directory, runner config, setup and build hooks. Record `source → test files → cwd → prerequisite + command`; use the command-selection procedure in `references/verification.md`.

### Scope confirmation

🔴 CHECKPOINT: If work requires expanding the authorized scope, list affected files and ask for that decision. Continue independent work within scope; reuse existing authorization.

## Step 2: Discover implementation ⚠️ REQUIRED

Load `references/implementation-discovery.md` before reading code deeply.

Do not infer actual behavior from existing tests alone. Read the active implementation, and retain any explicit requirement or public contract that conflicts with it for Step 3.

## Step 3: Contract checklist ⚠️ REQUIRED

Load `references/contract-checklist.md`.

Produce a short checklist of externally visible behavior (happy path, errors, empty/null, idempotency) **before** editing test bodies.

**CHECKPOINT — classify each mismatch before replacing its assertion.**

For requested behaviors with no test, record the coverage gap instead of inventing a stale assertion. Establish the public contract before adding a case; unclear expectations follow the evidence-gap branch below.

```text
Mismatch
├─ Test is stale; current behavior has no unresolved contract conflict
│  └─ Update the test; retain valid regression coverage
├─ Implementation violates an explicit requirement or public contract
│  └─ Preserve the failing assertion; report the defect
└─ Evidence cannot establish which side is wrong
   └─ Leave that assertion unchanged; state the evidence gap
```

For the last two branches, continue independent test repairs within scope. Ask only for the unresolved decision needed to proceed; reuse existing authorization. A test-only request does not authorize production changes.

## Step 4: Rewrite tests

Load `references/test-rewrite-patterns.md` before writing.

Principles:
- Repair cases classified as stale, or add missing coverage requested by the user. Preserve valid cases and user edits; a repair-only request does not authorize unrelated coverage expansion.
- **Minimum effective coverage** — behavior and boundaries first; replace obsolete API cases with equivalent current-API coverage.
- One test case → one behavior or one error path.

## Step 5: Verify ⚠️ REQUIRED

Load `references/verification.md`.

Run tests at the appropriate scope (single file, directory, or full suite). Use the failure branches in `references/verification.md`: distinguish stale tests, implementation defects, uncertain contracts, unstable tests, and environment blocks. Continue independently runnable work; report executed results separately from blocked or unrun checks.

## Anti-Patterns

- Changing a valid failing assertion to match a defect, deleting it, or skipping it merely to get green tests.
- Copying actual output into expectations without classifying the mismatch, or replacing valid regressions during a rewrite.
- Changing production code outside the authorized scope.
- Reporting blocked, unrun, or zero-collected tests as passing.
- Using the last shell command's status as the test result when the test process itself failed.
- Expanding the authorized scope without confirmation (Step 1).

## Pre-Delivery Checklist

- [ ] Authoritative implementation located (not types/comments alone)
- [ ] Assertions map to implementation branches or omissions are explained
- [ ] Requested coverage gaps are tested or explicitly reported as unresolved
- [ ] No fragile duplicate of implementation logic in expectations (unless intentional)
- [ ] Test-owned effects isolated; modified state/resources restored on success and failure
- [ ] Test names and layout align with module under test
- [ ] Scoped command and collected test results recorded; defects, uncertainty, and environment blocks reported separately
- [ ] User-requested directory scope respected
