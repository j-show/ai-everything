---
name: skiller
description: "ai-everything-skiller"
---

# Skiller

IRON LAW: **`{{input}}` is the requirement** — run **skill-forge** once on the first round, then repeat **skill-review → fix Suggestions** via **installed skills only** until no pending Suggestions remain; never expand scope from Strengths or substitute repo paths for skill invocation.

## Workflow

Copy this checklist and track progress:

```
Skiller Progress:

- [ ] Step 0: Prerequisite check ⛔ BLOCKING
  - [ ] Confirm skill-forge and skill-review are installed
  - [ ] Parse {{input}} for skill intent and target name
- [ ] Step 1: skill-forge ⚠️ REQUIRED (first round or user redo only)
  - [ ] Invoke skill-forge with {{input}} as requirements
  - [ ] Record target skill name and root directory
- [ ] Loop: skill-review → fix Suggestions (repeat until empty)
  - [ ] Step 2: skill-review ⚠️ REQUIRED
  - [ ] Step 3: Apply Suggestions only in target skill directory
- [ ] Step 4: Summarize for user ⚠️ REQUIRED
  - [ ] Run pre-delivery checklist below
```

**Control flow**

1. Step 0 must pass before any helper runs.
2. Run **Step 1** on the first round, or when the user asks to redo from scratch.
3. Repeat **Step 2 → Step 3** until Step 2 reports **no pending Suggestions**.
4. Do not skip re-review after Step 3 fixes.

## Step 0: Prerequisite check ⛔ BLOCKING

Confirm these skills are **installed and callable** in the current session (available skills list / Skill tool — not repo directories):

| Required skill | Role                                       |
| -------------- | ------------------------------------------ |
| `skill-forge`  | Step 1: create or update the target skill  |
| `skill-review` | Step 2: audit target skill; drive fix loop |

If any are missing → **stop immediately** and output only:

```text
缺少已安装技能：<missing names>
请先安装后再运行本技能（Cursor 插件市场，或 npx skills add …）。
```

### Parse `{{input}}`

Extract from user text (ask **one** clarifying question if a single item is missing — do not chain questions):

| Item         | Rule                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------- |
| Skill intent | Problem solved, who uses it, typical input/output                                                   |
| Skill name   | Lowercase hyphen directory name (e.g. `my-helper`); derive from intent and tell the user if omitted |

Target skill **location** follows skill-forge rules and the install environment (skip init when updating an existing same-name skill).

## Step 1: skill-forge ⚠️ REQUIRED

Run on **first round only**, or when the user explicitly requests a full redo.

1. Invoke installed **skill-forge** with `{{input}}` as the requirement source.
2. Complete its workflow at minimum:
   - Understand the skill (≥3 usage examples and trigger keywords)
   - Plan architecture (`scripts/` / `references/` / `assets/`, progressive loading)
   - Initialize new skills per skill-forge; iterate when the skill already exists
   - Write description (keyword bombing), `SKILL.md` body, resources, pre-delivery checklist
3. Record **target skill name** and **skill root directory** for Steps 2–3.
4. Briefly tell the user the skill name and purpose, then enter Step 2 (unless `{{input}}` asked to confirm first).

## Step 2: skill-review ⚠️ REQUIRED

1. Invoke installed **skill-review**.
2. Review **only** the target skill root directory from Step 1 — not the whole repo.
3. Produce a report **in Chinese** with:
   - **Strengths**
   - **Suggestions** (impact-sorted; each with What / Where / Fix)
4. Optional: save a copy to `.review/skill-<skill-name>-{timestamp}.md`.

**Exit Loop when**: **Suggestions** is empty or explicitly states no further improvements.

## Step 3: Fix Suggestions only

- Handle each **Suggestions** entry: What / Where / Fix — edit **only** files under the target skill directory.
- Do **not** act on Strengths-only "nice to have" items unless they also appear in Suggestions.
- After fixes, **return to Step 2** — never skip re-review.

## Step 4: Summarize for user ⚠️ REQUIRED

When the final Step 2 has no pending Suggestions, report:

- Target skill name and skill root directory
- Final Strengths summary (brief)
- Confirmation that the last review round had no Suggestions
- Optional: run skill-forge `package_skill.py` if the user did not forbid packaging

## Anti-Patterns

- Creating the target skill or running review before Step 0 prerequisite check passes
- Creating or reviewing without confirming skill-forge and skill-review are installed
- Reading `skills/skill-forge/SKILL.md` (or siblings) instead of invoking installed skills
- Reviewing the entire repository instead of the target skill root
- Rewriting from Strengths when Suggestions is already empty
- Ending before Suggestions is cleared and re-reviewed
- Replacing `{{input}}` intent with an unrelated skill goal
- Skill directory name not matching `SKILL.md` frontmatter `name`

## Pre-Delivery Checklist

- [ ] skill-forge and skill-review were confirmed installed before execution
- [ ] Target skill was created/updated via skill-forge and passed its pre-delivery checklist
- [ ] At least one full skill-review report (Strengths + Suggestions) was produced
- [ ] Final review round has no pending Suggestions
- [ ] Every fixed Suggestion was verified absent on re-review (or marked N/A with reason)
- [ ] No repo skill paths were used as a substitute for installed skill invocation
