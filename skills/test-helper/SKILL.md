---
name: test-helper
description: "Find implementation code and rewrite test cases to match current behavior. 检索实现代码并重新实现测试用例. Inspects handlers, APIs, and call chains; rebuilds assertions and fixtures from the real contract. Use when user wants to rewrite tests, fix outdated tests, align tests with implementation, invoke test-helper, refresh test suite, or test a specific directory. Triggers: 'test', 'test-helper', 'rewrite tests', 'update tests', 'fix tests', 'test cases', 'unit tests', '重写测试', '测试用例', '补测试', '对齐测试', '实现为准', '检索实现', '重新实现测试'."
---

# Test Helper

IRON LAW: Assertions and fixtures must reflect **current implementation behavior** read from source and call chains — never old tests, comments, or memory. Do not rewrite large test files before finishing Step 1 discovery.

## Workflow

Copy this checklist and check off items as you complete them:

```
Test Helper Progress:

- [ ] Step 1: Scope ⚠️ REQUIRED
  - [ ] 1.1 Parse user path (directory vs full suite)
  - [ ] 1.2 List test files and matching implementation modules
  - [ ] 1.3 Identify project test command from package.json / docs
- [ ] Step 2: Discover implementation ⚠️ REQUIRED
  - [ ] Load references/implementation-discovery.md
  - [ ] Trace entry points to core logic; record I/O, side effects, errors
- [ ] Step 3: Contract checklist ⚠️ REQUIRED
  - [ ] Load references/contract-checklist.md
  - [ ] Write observable behaviors to align tests against
- [ ] Step 4: Rewrite tests
  - [ ] Load references/test-rewrite-patterns.md
  - [ ] Replace mismatched cases; isolate time/network/fs per project norms
- [ ] Step 5: Verify ⚠️ REQUIRED
  - [ ] Load references/verification.md
  - [ ] Run scoped test command; classify failures
- [ ] Step 6: Self-check ⚠️ REQUIRED
  - [ ] Run pre-delivery checklist below
```

## Step 1: Scope ⚠️ REQUIRED

**Goal wording**: 检索实现代码，并重新实现测试用例（find implementation code and rewrite test cases).

### Directory scope

| User input | Test scope |
| ---------- | ---------- |
| Specifies a directory (e.g. `src/auth`, `tests/unit/foo`) | Rewrite tests **only** under/for that directory |
| No directory given | Rewrite **all** relevant tests in the project |

Ask if ambiguous:
- Which directory or module?
- Unit only, integration/e2e included?

Discover:
1. Test file locations (`test/`, `tests/`, `__tests__/`, `*.test.*`, `*.spec.*`).
2. Corresponding implementation paths (mirror layout or imports).
3. Test runner and scripts — `package.json` `scripts.test`, config files (`vitest`, `jest`, `pytest`, etc.).

### Scope confirmation

If many suites would change, list affected test files and ask to proceed with all or a subset. ⚠️ Do not mass-rewrite without alignment.

## Step 2: Discover implementation ⚠️ REQUIRED

Load `references/implementation-discovery.md` before reading code deeply.

Do not infer behavior from existing tests alone — treat implementation as authoritative.

## Step 3: Contract checklist ⚠️ REQUIRED

Load `references/contract-checklist.md`.

Produce a short checklist of externally visible behavior (happy path, errors, empty/null, idempotency) **before** editing test bodies.

## Step 4: Rewrite tests

Load `references/test-rewrite-patterns.md` before writing.

Principles:
- **Replace over patch** when tests clearly disagree with implementation.
- **Minimum effective coverage** — behavior and boundaries first; remove redundant or obsolete cases.
- One test case → one behavior or one error path.

## Step 5: Verify ⚠️ REQUIRED

Load `references/verification.md`.

Run tests at the appropriate scope (single file, directory, or full suite). Default: tests should describe **truthful** behavior; if implementation is clearly wrong, report to the user before changing production code.

## Core principles

- **Implementation-first** — read source and call chain, then assert.
- **Locate before writing** — no bulk rewrite without discovery.
- **Minimum effective coverage** — drop tests that only duplicate implementation literals or dead APIs.

## Common errors

| Problem | Action |
| ------- | ------ |
| Infer behavior only from tests | Return to Step 2; build contract from implementation |
| Keep tests for deleted APIs | Remove or replace with equivalent new-API scenarios |
| Over-mock — integration never runs | Balance unit vs shallow integration per project norms |

## Anti-Patterns

- Patching assertions one-by-one when the suite structure is obsolete — prefer full case rewrite (Step 4)
- Changing production code silently when the user asked only to fix tests — explain first (Step 5)
- Mass-rewriting without scope confirmation when many suites change (Step 1)

## Pre-Delivery Checklist

- [ ] Authoritative implementation located (not types/comments alone)
- [ ] Assertions map to implementation branches or omissions are explained
- [ ] No fragile duplicate of implementation logic in expectations (unless intentional)
- [ ] Time/network/fs isolated using project-existing patterns
- [ ] Test names and layout align with module under test
- [ ] Scoped test command run and passing (or failures explained: test vs implementation)
- [ ] User-requested directory scope respected
