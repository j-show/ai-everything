---
name: reviewer
description: "ai-everything-reviewer"
---

# Reviewer

IRON LAW: After Step 0 confirms all three helpers are **installed**, run **test-helper → review-helper → doc-helper** automatically — no user confirmation to start. Never substitute repo paths or SKILL.md reads for skill invocation. If any prerequisite is missing, stop and output only the missing-skill message with install instructions.

Red flags (stop — fix before continuing):

- Proceeding without Step 0 install check for all three helpers
- Asking the user to confirm starting the pipeline after Step 0 passed
- Reading `skills/test-helper/` (or siblings) instead of invoking installed skills
- Skipping test verification before review-helper
- Starting doc-helper before review-helper dual loops finish

## Workflow

Copy this checklist and track progress:

```
Reviewer Progress:

- [ ] Step 0: Prerequisite check ⛔ BLOCKING
  - [ ] Confirm test-helper, review-helper, doc-helper are installed
  - [ ] Parse {{input}} for review scope (Step 2) and optional hints (Steps 1, 3)
- [ ] Step 1: test-helper ⚠️ REQUIRED
  - [ ] Invoke test-helper; complete discovery → rewrite → verify
- [ ] Step 2: review-helper ⚠️ REQUIRED
  - [ ] Invoke review-helper with resolved scope; complete report → fix → verify loops
- [ ] Step 3: doc-helper ⚠️ REQUIRED
  - [ ] Invoke doc-helper on modules touched in Steps 1–2 (or user path)
- [ ] Step 4: Summarize for user ⚠️ REQUIRED
  - [ ] Run pre-delivery checklist below
```

**Control flow**

1. Step 0 must pass before any helper runs.
2. **When Step 0 passes → proceed through Steps 1–4 without asking the user to confirm** (no "shall I start?" gate).
3. Step 1 must finish with tests verified before Step 2.
4. Step 2 must complete review-helper dual loops before Step 3.
5. Steps 1 → 2 → 3 are fixed order; no parallel shortcuts.

## Step 0: Prerequisite check ⛔ BLOCKING

Confirm these skills are **installed and callable** in the current session (available skills list / Skill tool — not repo directories):

| Required skill  | Role                                       |
| --------------- | ------------------------------------------ |
| `test-helper`   | Step 1: rewrite tests from implementation  |
| `review-helper` | Step 2: review report, fixes, verification |
| `doc-helper`    | Step 3: JSDoc, inline comments, README     |

**Detection**: verify each `name` in the session skill list — do not infer from `skills/` paths in the repo.

If any are missing → **stop immediately** and output **only**:

```text
缺少已安装技能：<missing names>

请先安装后再运行本技能：
- AI Everything 插件（含 test-helper、review-helper、doc-helper）：Cursor 插件市场安装 ai-everything，或在仓库根目录执行 `npm run deploy:cursor`
- 亦可单独安装：
  - npx skills add j-show/ai-everything --path skills/test-helper
  - npx skills add j-show/ai-everything --path skills/review-helper
  - npx skills add j-show/ai-everything --path skills/doc-helper
```

Do not run tests, review, or documentation without all three.

**When all three are present** → parse `{{input}}` and **immediately begin Step 1** (no confirmation prompt).

### Parse `{{input}}` — review scope (Step 2)

Pass the resolved value explicitly to **review-helper** in Step 2:

| `{{input}}`     | Review scope (Step 2)                            |
| --------------- | ------------------------------------------------ |
| `all`           | All code in the current project                  |
| `self`          | All code on the current branch                   |
| `{commit-hash}` | That commit's changes + **staging area**         |
| _(empty)_       | Local commits not on `origin` + **staging area** |

Notes:

- Staging area is always in scope for Step 2 unless the user explicitly excludes it.
- For `all` or very large scope, **do not ask for confirmation to start** — proceed automatically per control flow rule 2.
- Commit hash applies to **review-helper only** — not test-helper scope (see Step 1).

Directory paths in `{{input}}` are **hints** for Steps 1 and 3 only. For Step 2, treat a directory path like _(empty)_ — unpushed commits on `origin` + staging — unless the user explicitly names a different review scope.

## Step 1: test-helper ⚠️ REQUIRED

1. Invoke installed **test-helper** and follow its full workflow (scope → discover implementation → contract checklist → rewrite → verify).
2. Scope hint:
   - If `{{input}}` is a directory path (not `all`, `self`, or a commit hash), pass it as the test scope hint.
   - Otherwise use test-helper defaults (full suite or skill-internal rules).
3. Do not start Step 2 until Step 1 verification has run and failures are resolved or explicitly accepted by the user.

## Step 2: review-helper ⚠️ REQUIRED

1. Invoke installed **review-helper**.
2. Set review scope to the table value from Step 0 (`all` / `self` / hash / empty → unpushed + staging).
3. Complete review-helper control flow:
   - Loop A: report → fix until no remaining fix items.
   - Loop B: verify → fix failures → retry verify until pass.
4. Report must follow review-helper rules (Chinese, P0–P3, save under `.review/{timestamp}.md`).

Do not start Step 3 until Loop A and Loop B are complete.

## Step 3: doc-helper ⚠️ REQUIRED

1. Invoke installed **doc-helper** (survey → JSDoc → inline comments → README → self-check).
2. Prefer modules touched in Steps 1–2; if the user gave a directory in `{{input}}`, align doc scope with that path.
3. Follow doc-helper ignore directories and bilingual README rules.

## Step 4: Summarize for user ⚠️ REQUIRED

After the pipeline, briefly report:

- Prerequisite check: three skills present (one line if already verified).
- Step 1: test scope and pass/fail outcome.
- Step 2: review scope, remaining P0–P1 items (if any), verification command and result.
- Step 3: documentation updates (README, which modules received JSDoc).

## Anti-Patterns

- Asking "是否开始审查流水线？" after Step 0 already passed — proceed automatically
- Running helpers without verifying they are installed in the session
- Reading `skills/test-helper/SKILL.md` (or siblings) instead of invoking installed skills
- Skipping test verification before review
- Starting doc-helper before review-helper dual loops finish
- Passing commit hash as test-helper scope (hash is review scope only)
- Expanding or shrinking review scope beyond the Step 0 table
- Reordering steps 1 → 2 → 3 without explicit user request
- Vague missing-skill message without install commands

## Pre-Delivery Checklist

- [ ] All three helper skills were confirmed installed before execution
- [ ] Pipeline started automatically after Step 0 (no unnecessary start confirmation)
- [ ] test-helper completed with verification run
- [ ] review-helper used correct `all` / `self` / hash / empty scope and finished both loops
- [ ] doc-helper ran on touched modules (or user-specified path)
- [ ] User received a short end-to-end summary
- [ ] No step used repo skill paths as a substitute for installed skill invocation
