---
name: grilling-with-docs
description: "Orchestrate grilling + domain-modeling to clarify a requirement or design, then write agreed deliverable files. Ingests pasted requirements or linked docs, runs a relentless interview to resolve ambiguity, sharpens domain language, and writes the artifact only after shared understanding. Use when user wants grill-with-docs, grilling-with-docs, stress-test a plan into docs, clarify requirements into a file, interview then write spec, PRD grilling, design grilling with docs, or 拷问后出文档. Actions: grill, clarify, sharpen, interview, stress-test, document, write deliverable, lock output path. Objects: requirement, PRD, design, plan, GLOSSARY.md, ADR, spec, brief, 产物文件, 输出路径. Triggers: 'grilling-with-docs', 'grill with docs', '拷问需求', '澄清歧义', '拷问后写文档', '先拷问再落盘', '需求访谈写文件', '产物文件名', '明确输出路径', '写到哪个文件'. Requires installed grilling and domain-modeling."
---

# Grilling With Docs

IRON LAW: **Lock deliverable path(s) before any grilling round.** Then load and follow installed **grilling** + **domain-modeling** only — never freestyle the interview or substitute unregistered copies. **Do not write the primary deliverable** until the grilling frontier is empty and the user confirms shared understanding.

Red flags (stop — fix before continuing):

- Asking grilling questions before Step 1 artifact path(s) are locked
- Writing the deliverable while frontier questions remain open
- Loading an unregistered repository copy instead of the session's installed dependency
- Skipping domain-modeling while terms or decisions crystallise
- Dumping every answer into `GLOSSARY.md` (glossary only — see domain-modeling)
- Inventing requirements the source docs do not support

## Workflow

Copy this checklist and track progress:

```
Grilling-With-Docs Progress:

- [ ] Step 0: Prerequisite check ⛔ BLOCKING
  - [ ] Confirm grilling and domain-modeling are installed
  - [ ] Parse {{input}} for requirement source and artifact hints
- [ ] Step 1: Lock deliverable path(s) ⛔ BLOCKING
  - [ ] Explicit output/update target in {{input}} or accepted proposal → record and continue
  - [ ] Target missing or path role ambiguous → ask once; wait before Step 2
- [ ] Step 2: Ingest requirements ⚠️ REQUIRED
  - [ ] Load pasted text and/or read named docs
  - [ ] Read existing output targets; identify sections to change and content to preserve
  - [ ] Resolve unavailable/incomplete sources through replacement or explicit omission
  - [ ] Resolve project root and read its GLOSSARY.md if present
  - [ ] List ambiguities and open decisions (do not ask yet)
- [ ] Step 3: Grill + model ⚠️ REQUIRED
  - [ ] Load both installed dependencies using the Step 0 loading contract
  - [ ] Run grilling rounds to empty frontier
  - [ ] Apply domain-modeling (glossary + ADRs inline)
- [ ] Step 4: Confirm shared understanding ⚠️ REQUIRED
- [ ] Step 5: Write deliverable file(s) ⚠️ REQUIRED
- [ ] Step 6: Summarize for user ⚠️ REQUIRED
```

**Control flow**

1. Step 0 must pass before anything else.
2. Step 1 must lock output/update target(s) before Step 2–3. If missing or ambiguous, ask **one** question and wait.
3. Step 2 gathers facts from the environment; do not interview the user for look-up-able facts.
4. Step 3 runs both dependency skills in the same session until the grilling frontier is empty.
5. Step 5 runs only after Step 4 confirmation.
6. Root `GLOSSARY.md` / ADR updates from domain-modeling may happen **during** Step 3 unless that file is a **primary deliverable** from Step 1; primary deliverables always wait until Step 5.

## Step 0: Prerequisite check ⛔ BLOCKING

Confirm these skills are **installed and loadable** from the current session's skill catalog:

| Required skill     | Role                                              |
| ------------------ | ------------------------------------------------- |
| `grilling`         | Step 3: design-tree interview in frontier rounds  |
| `domain-modeling`  | Step 3: sharpen terms; maintain root GLOSSARY.md / ADRs |

Optional other installed skills (code search, docs, harness helpers) may run **only** to look up facts grilling needs. They must **not** replace `grilling` or `domain-modeling`.

**Detection**: resolve each dependency by its catalog name (including any plugin prefix) and record its registered entrypoint or invocation identifier. A matching repository directory alone is not evidence of installation.

**Loading contract** (apply at Step 3):

- Use the runtime's documented skill invocation tool when available, with the resolved identifier.
- If no such tool exists, read the installed `SKILL.md` through the catalog's declared file/resource mechanism, then follow its instructions and load its referenced resources as needed. This is skill loading; a tool literally named `Skill` is not required.
- Use only catalog-resolved entries, even if an installed entry points inside the project. Do not guess a repository path or replace a failed load with a similarly named copy.
- If either dependency cannot be resolved or loaded, stop before interviewing or writing. Name the dependency and the resolution/read/invocation failure; do not claim it loaded or continue with only the other one.

If any are missing → **stop immediately** and output **only**:

```text
缺少已安装技能：<missing names>

请先安装后再运行本技能：
- AI Everything：在仓库根目录执行 `npm run upgrade:tool`，再 `npm run deploy:cursor`（或部署到当前 harness）
- 亦可单独安装：
  - npx skills add j-show/ai-everything --path skills/grilling
  - npx skills add j-show/ai-everything --path skills/domain-modeling
```

**When both are present** → parse `{{input}}` and continue to Step 1 (no "shall I start?" gate).

### Parse `{{input}}`

Extract (ask **one** clarifying question later only if Step 1 needs it):

| Item              | Rule                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| Requirement text  | Inline brief, pasted requirements, or design notes in the message    |
| Source docs       | Paths/URLs/names the user pointed at — read them in Step 2           |
| Deliverable path  | File path(s) explicitly assigned an output/update role (see Step 1) |
| Extra outputs     | Root GLOSSARY.md term updates / optional ADRs via domain-modeling rules |

Load `references/ingest-and-artifact.md` when path parsing or multi-doc ingest is ambiguous.

## Step 1: Lock deliverable path(s) ⛔ BLOCKING

Ask: **Which file path(s) will hold the primary deliverable after grilling?**

- Lock a concrete path only when the user assigns it an output/update role (e.g. "write to `docs/specs/refund.md`") or accepts a proposed target. Reuse that decision; do not ask for the same path again.
- A path mentioned only for reading, comparison, an example, or exclusion is not a target. Neither an output-related word without a path nor paths inside source documents authorize a write destination.
- If the target is missing or its role is ambiguous → ask **once**, propose a sensible default when helpful, and **wait**. Do not start Step 2 or Step 3.
- Explicit "update X" / "完善 X" permits X to be both source and target; read it in Step 2 and retain the Step 4 content-confirmation gate.
- Multiple primary files are allowed only when the user identifies each as an output/update target; otherwise prefer one SSOT file.

Do **not** treat root `GLOSSARY.md` / `docs/adr/*` as substitutes for the primary deliverable unless the user explicitly named them as the deliverable.

### Canonical glossary path

Use `<project-root>/GLOSSARY.md` as the single glossary for this workflow. Resolve the target project root from the task and repository context, not the skill installation directory or the deliverable's parent folder; if ambiguous, clarify it with the Step 1 path question.

- Read and update an existing file in place; preserve unrelated entries.
- If absent, create only this root file when the first term is settled, subject to the primary-deliverable timing rule.
- Pass this path constraint to `domain-modeling`; its mapped-context defaults do not select another glossary in this workflow.

## Step 2: Ingest requirements ⚠️ REQUIRED

1. Read every source doc named in `{{input}}` (and linked paths discovered there if clearly in scope), plus the root `GLOSSARY.md` if it exists. Track which sources were actually read, replaced, or explicitly omitted; do not count a failed or partial read as complete.
   - If a source is missing, inaccessible, or incomplete, finish reading other available sources and report the affected path/URL and actual failure or missing portion. Request a readable replacement or explicit permission to omit that source; wait before Step 3. Do not infer its contents or silently reduce scope.
   - When replacement material arrives or omission is authorized, resume this step with the already locked target and retained context. Read the replacement, record the changed source basis, and reopen only decisions affected by it.
   - Omitting a source does not authorize replacing an unreadable existing update target. Before changing that target, obtain its readable current contents or explicit authorization for full replacement; never treat a read failure as an empty/new file.
2. Read each existing locked target even when it is not a named source. Identify the sections affected by the request and the content outside that scope; apply the same read-failure safeguards.
3. Merge with pasted requirement text. Prefer written sources over guesses when they conflict — surface the conflict in Step 3.
4. Produce an internal brief (do not write the deliverable yet):
   - Goal / non-goals (as currently stated)
   - Actors and key terms (flag fuzzy ones)
   - Open decisions and ambiguities
   - Facts already answered by code or docs (mark as settled prerequisites for grilling)

Ask: What claims in the brief are still ambiguous, conflicting, or unstated? Those become grilling inputs — not assumptions. Load `references/ingest-and-artifact.md` for source-recovery details when an access failure or partial read occurs.

## Step 3: Grill + model ⚠️ REQUIRED

1. At the **start** of this step, load **`grilling`** and **`domain-modeling`** through the Step 0 loading contract. Both instruction sets must be loaded before the first question round; follow the failure branch if either load fails.
2. Follow **`grilling`** fully: design tree, frontier rounds, numbered questions with recommended answers, wait between rounds; look up facts yourself (optional other skills only for lookups).
3. Apply **`domain-modeling`** throughout the same session: challenge glossary conflicts, sharpen overloaded terms, stress-test scenarios, cross-check code, update root `GLOSSARY.md` inline, offer ADRs only when all three gates pass. If the glossary or ADR is a locked primary deliverable, keep its proposed changes in the conversation until Step 5.
4. Feed Step 2 ambiguities into the grilling frontier. Keep domain language consistent with root `GLOSSARY.md` and any settled changes pending Step 5.
5. Continue rounds until the grilling frontier is empty.

⚠️ Do not write the Step 1 primary deliverable in this step.

## Step 4: Confirm shared understanding ⚠️ REQUIRED

Present a short recap:

- Settled decisions (bullets)
- Canonical terms introduced or changed
- ADR offers accepted / skipped
- Exact path(s) that will be written in Step 5
- Actual source basis, including replacements and user-approved omissions or scope reductions
- For each path: state **create** if absent or **update in place**, naming affected sections and preserved content. For ordinary documents, **full replacement** is allowed only when the user explicitly authorized it for that path; merely choosing a path or saying "update" does not authorize discarding the rest. The glossary retains its merge-and-preserve rule.

Ask: Confirm we have shared understanding and may write the deliverable? Options: proceed / revise specific points / continue grilling.

⚠️ Do not write primary deliverable files until the user confirms (or explicitly waived confirmation in `{{input}}` with clear "write without asking" intent).

## Step 5: Write deliverable file(s) ⚠️ REQUIRED

1. Write only locked paths covered by Step 4 confirmation. Re-read each target immediately before editing; if it appeared or changed since ingestion, preserve unrelated new content and revisit only conflicting edits before writing. A newly appeared file is not an empty target.
2. Update only agreed sections, preserving unrelated text, metadata, links, and formatting. Remove obsolete material only within the agreed change scope; replace an ordinary document wholesale only under the explicit full-replacement authorization from Step 4.
3. Content must reflect settled answers only — no unresolved TODOs for decisions already grilled. Keep implementation detail out of `GLOSSARY.md`; merge settled glossary terms into the root file and preserve unrelated entries.
4. Read back the result and compare with the pre-write contents: verify agreed changes and preservation outside scope. If the agreed result is already present, leave the file unchanged. Report create, scoped update, or authorized full replacement in Step 6.

Load `references/deliverable-quality.md` when updating an existing target or when the artifact type is unclear.

## Step 6: Summarize for user ⚠️ REQUIRED

Report:

- Prerequisite check: both skills present
- Requirement sources actually ingested, replacements used, and user-approved omissions
- Deliverable path(s) written
- Root GLOSSARY.md / ADR changes (if any)
- Remaining follow-ups explicitly deferred by the user

## Anti-Patterns

- Starting grilling before the artifact path gate
- Freestyle Q&A dump instead of invoking `grilling`
- Glossary-only session when the user asked for a spec/brief file
- Writing the deliverable mid-interview "to save time"
- Treating an unregistered repository copy as an installed skill
- Stuffing the deliverable into `GLOSSARY.md` or creating a duplicate glossary
- Asking the user for facts readable from the repo or named docs
- Expanding scope beyond `{{input}}` after Strengths-style "nice to haves"
- Using optional lookup skills as a substitute for `grilling` or `domain-modeling`
- Loading only one of the two required skills in Step 3

## Pre-Delivery Checklist

- [ ] `grilling` and `domain-modeling` confirmed installed before work
- [ ] Deliverable path(s) locked before the first grilling round
- [ ] Sources actually read; failed/partial reads resolved by replacement or explicit omission and disclosed
- [ ] Grilling frontier empty; user confirmed shared understanding (or explicit waiver)
- [ ] Locked targets re-read before writing; unrelated content preserved; full replacement explicitly authorized when used
- [ ] Both required instruction sets loaded from catalog-resolved entries at Step 3 start
- [ ] Only root `GLOSSARY.md` used for glossary writes; unrelated entries preserved; no duplicate context file created
- [ ] `GLOSSARY.md` remains glossary-only; ADRs only if three gates passed
- [ ] No unregistered copy or guessed path substituted for a catalog-resolved dependency
- [ ] No placeholder decision stubs left for already-settled questions
