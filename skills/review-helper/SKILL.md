---
name: review-helper
description: "Code review, report, and fix loop for changed code only. Produces Chinese P0-P3 findings with file:line ranges, applies fixes, runs pnpm check/test until pass. Scope: all branch, unpushed vs origin, or commit hash plus staging. Use when user wants code review, audit changes, fix review findings, invoke review-helper, PR review, or review before commit. Triggers: 'review', 'review-helper', 'code review', '审查', '代码审查', 'review code', 'audit', 'PR review', '检查改动', '修复审查问题'."
---

# Review Helper

IRON LAW: Review and fix **only the in-scope diff** — do not wander into unrelated files or speculative refactors. Report findings in Chinese with relative path + line range; suggestions must be short and actionable, not pasted code blocks.

## Workflow

Copy this checklist and track the outer loop:

```
Review Helper Progress:

- [ ] Step 0: Scope ⚠️ REQUIRED
  - [ ] Load references/scope-and-diff.md
  - [ ] Resolve diff from user input + staging area
- [ ] Loop A: Report → Fix (repeat until report empty)
  - [ ] Step 1: Review report ⚠️ REQUIRED
  - [ ] Step 2: Apply fixes for each finding
- [ ] Loop B: Verify → Fix (repeat until pass)
  - [ ] Step 3: Run verification commands ⚠️ REQUIRED
  - [ ] Step 4: Fix verification failures (if any) → retry Step 3
- [ ] Step 5: Self-check
```

**Control flow** (same as `commands/review.md`):

1. Repeat **Step 1 → Step 2** until Step 1 produces **no remaining fix items**.
2. Run **Step 3**; if pass → done.
3. Else **Step 4** → retry **Step 3** until pass.

## Step 0: Scope ⚠️ REQUIRED

Load `references/scope-and-diff.md`.

Combine user `{{input}}` with **staged changes** when determining what to review.

| Input | Review scope |
| ----- | -------------- |
| `all` | All code on the current branch |
| _(empty)_ | Local commits not on `origin` + staged files |
| commit hash | That commit’s changes + staged files |
| other path/ref | Interpret per user intent; still include staging unless user excludes it |

Ask if scope is ambiguous before a large `all` review.

## Step 1: Review report ⚠️ REQUIRED

Load `references/report-format.md`.

Act as a senior reviewer (correctness, performance, security, readability). Output **in Chinese**. Grade and format each finding; save a copy under `.review/{audit-time}.md` (timestamp filename).

Ignore lockfiles: `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`, `bun.lockb`.

Do not report issues outside the resolved diff scope.

## Step 2: Fix findings

For **each** item from the latest Step 1 report, implement the suggested fix in code.

After fixes, return to Step 1 and re-review the **same scope** until no new P0–P3 items remain.

⚠️ Do not skip Step 1 between fix rounds — confirm the diff is clean of reported issues.

## Step 3: Verify ⚠️ REQUIRED

Load `references/verification-commands.md`.

Run the first available command in project order; success → end Loop B.

## Step 4: Fix verification failures

Load `references/verification-commands.md` (failure handling).

Fix causes of Step 3 failure, then **retry Step 3** only (do not skip verification).

## Step 5: Self-check

Run the pre-delivery checklist below.

## Anti-Patterns

- Reviewing files outside the resolved scope
- Vague findings without `file:start-end` location
- Pasting large code blocks instead of actionable suggestions
- Declaring done while Loop A still has open P0/P1 items
- Declaring done while Step 3 commands fail
- Reporting style-only nits on lockfiles (ignored by rule)
- Drive-by refactors unrelated to findings

## Pre-Delivery Checklist

- [ ] Scope matches user input + staging rules
- [ ] Lockfiles excluded from findings
- [ ] Report uses P0–P3 template in Chinese
- [ ] Copy saved to `.review/{timestamp}.md`
- [ ] Loop A completed (re-review after fixes shows no pending items)
- [ ] Loop B completed (verification command passed or none defined)
- [ ] No out-of-scope files modified
