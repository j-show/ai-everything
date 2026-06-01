---
name: init-helper
description: "Create or refresh root AGENTS.md for AI coding agents from the live repo. Scans package manifests, scripts, and layout; outputs command-first instructions with Always do / Ask first / Never do boundaries, SSOT links, and domain guides under docs/agents/. Use when user wants AGENTS.md, init project for AI, agent instructions, harness context, or /init-style setup. Triggers: 'init-helper', 'AGENTS.md', 'agents md', 'create AGENTS.md', 'update AGENTS.md', 'agent instructions', 'AI coding context', '项目初始化', '生成 AGENTS', '代理说明', 'harness init', 'qoder init', 'claude init'."
---

# Init Helper

IRON LAW: **AGENTS.md is a map, not a manual.** Root file stays **≤200 lines**. Put copy-paste commands and hard boundaries in AGENTS.md; put stack-specific depth in `docs/agents/*.md` with links only—never paste external docs or duplicate README prose.

## Workflow

Copy this checklist and check off items as you complete them:

```
Init Helper Progress:

- [ ] Step 1: Discover ⚠️ REQUIRED
  - [ ] 1.1 Confirm repo root and scope (monorepo subpath?)
  - [ ] 1.2 Inventory manifests, scripts, CI, existing AGENTS.md/README
  - [ ] Load references/discovery-checklist.md
  - [ ] Load references/usage-examples.md (calibrate scope)
- [ ] Step 2: Plan ⚠️ REQUIRED
  - [ ] 2.1 List commands agents get wrong without help
  - [ ] 2.2 Draft Always / Ask first / Never do rules
  - [ ] 2.3 Decide domain splits → docs/agents/
  - [ ] Load references/agents-md-structure.md
  - [ ] Load references/domain-split-guide.md (if splits needed)
  - [ ] Load references/methodology-links.md (if user wants best-practice alignment)
- [ ] Step 3: Confirm ⚠️ REQUIRED
  - [ ] Present outline + line budget; get approval before write/overwrite
- [ ] Step 4: Write AGENTS.md
  - [ ] Use assets/AGENTS.template.md as skeleton
  - [ ] Verify each command in repo (package.json, Makefile, scripts/)
- [ ] Step 5: Domain guides (conditional)
  - [ ] Create only linked docs/agents/*.md files from plan
- [ ] Step 6: Self-check ⚠️ REQUIRED
  - [ ] Run pre-delivery checklist below
```

## Step 1: Discover ⚠️ REQUIRED

Ask if unclear:
- Repo root path (default: workspace root)?
- Create new, refresh in place, or merge with existing `AGENTS.md`?

Load `references/discovery-checklist.md` and collect:

1. **Identity** — name, stack, one-sentence purpose (from README opening, not invention).
2. **Commands** — exact strings from `package.json` `scripts`, `Makefile`, `justfile`, `mise.toml`, `Taskfile`, `scripts/*`, CI workflows.
3. **Structure** — top-level dirs with one-line roles (read tree + README).
4. **Verification loop** — how to build, test, lint, run locally after changes.
5. **Gotchas** — recurring agent mistakes or fixes (from user input, issues, or existing docs).
6. **SSOT** — official docs URLs, internal wiki links; do not inline their bodies.

Skip generic knowledge (PEP 8, Prettier defaults, “write clean code”).

## Step 2: Plan ⚠️ REQUIRED

Load `references/agents-md-structure.md`.

Produce a short plan:
- Section list for root `AGENTS.md` (target **≤200 lines**).
- Table of `docs/agents/<topic>.md` files (if any) with one-line purpose each.
- **Always do** (3–10), **Ask first** (3–8), **Never do** (3–10)—each item falsifiable.

Load `references/domain-split-guide.md` when root would exceed ~180 lines or covers multiple stacks (e.g. server + web).

## Step 3: Confirm ⚠️ REQUIRED

Present to the user:
- Proposed AGENTS.md outline (headings only).
- Planned domain files under `docs/agents/`.
- Whether existing `AGENTS.md` will be **replaced**, **merged**, or **created**.

Ask:
- Proceed with full write?
- Adjust scope (e.g. commands-only pass)?
- View outline only?

⚠️ Do **not** overwrite `AGENTS.md` without explicit approval.

## Step 4: Write AGENTS.md

1. Copy structure from `assets/AGENTS.template.md`.
2. **Commands section**: every entry is `command` + effect; flags included; runnable from repo root unless noted.
3. **Boundaries**: use `### Always do`, `### Ask first`, `### Never do` (see structure reference).
4. **SSOT**: link to README, package docs, specs—one line per link, no pasted manuals.
5. **Known fixes**: `| Symptom | Fix |` table for repeated agent failures (concrete commands/paths).
6. **Document map**: table linking `docs/agents/*.md` when splits exist.
7. Human note at top: “Humans: see README.md” when README exists (one line).

Optional: `ln -s AGENTS.md CLAUDE.md` only if user uses Claude Code and asks for compatibility.

## Step 5: Domain guides (conditional)

Create `docs/agents/<name>.md` only when Step 2 planned them. Each file:
- Focused topic (frontend, backend, infra, skills, etc.).
- Same command-first style; may exceed 200 lines if needed.
- Linked from root **Document map**; root file stays the index.

Do not create empty placeholder domain files.

## Step 6: Self-check ⚠️ REQUIRED

Run pre-delivery checklist below. If root `AGENTS.md` >200 lines, move detail to `docs/agents/` and re-check.

## Core principles (apply while writing)

| Principle | Rule |
| --------- | ---- |
| Commands | Verifiable strings from repo, not “run tests” |
| Boundaries | Always / Ask first / Never do—no vague “be careful” |
| SSOT | Link authoritative sources; record fixes, not essay errors |
| Size | Root ≤200 lines; progressive disclosure to `docs/agents/` |
| Audience | AI-primary; minimal overlap with README |

## Anti-Patterns

- Pasting README install/intro into AGENTS.md
- Generic language tutorials or default style guides
- Describing commands without exact invocation (`npm test` vs `pnpm run test:unit`)
- One giant AGENTS.md (>200 lines) instead of domain splits
- Duplicating package.json script list verbatim without agent-relevant subset
- “When to use this skill” section in generated AGENTS.md (that belongs in SKILL frontmatter only)
- Overwriting AGENTS.md without Step 3 approval
- Inventing scripts or env vars not present in the repo
- Leaving `{{PLACEHOLDER}}` tokens from `assets/AGENTS.template.md` in shipped AGENTS.md

## Pre-Delivery Checklist

### AGENTS.md root
- [ ] ≤200 lines: `wc -l AGENTS.md` or `(Get-Content AGENTS.md).Count` (or user waived with reason)
- [ ] Opening: project identity + stack in ≤5 lines
- [ ] Commands: copy-pasteable, verified against manifests/scripts
- [ ] Always do / Ask first / Never do present and specific
- [ ] SSOT links only—no embedded external doc bodies
- [ ] Known-fixes table for recurring mistakes (if any identified)
- [ ] Document map lists every `docs/agents/*.md` created
- [ ] No TODO/FIXME/placeholder sections

### Domain files
- [ ] Each file linked from root; no orphans
- [ ] No duplicate content between root and domain file (root indexes, domain details)

### Process
- [ ] User approved outline in Step 3 (or user said “skip confirm”)
- [ ] Existing AGENTS.md merge/replace behavior matches user choice
