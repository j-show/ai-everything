---
name: grilling-with-docs
description: "Orchestrate grilling + domain-modeling to clarify a requirement or design, then write agreed deliverable files. Ingests pasted requirements or linked docs, runs a relentless interview to resolve ambiguity, sharpens domain language, and writes the artifact only after shared understanding. Use when user wants grill-with-docs, grilling-with-docs, stress-test a plan into docs, clarify requirements into a file, interview then write spec, PRD grilling, design grilling with docs, or 拷问后出文档. Actions: grill, clarify, sharpen, interview, stress-test, document, write deliverable, lock output path. Objects: requirement, PRD, design, plan, CONTEXT.md, ADR, spec, brief, 产物文件, 输出路径. Triggers: 'grilling-with-docs', 'grill with docs', '拷问需求', '澄清歧义', '拷问后写文档', '先拷问再落盘', '需求访谈写文件', '产物文件名', '明确输出路径', '写到哪个文件'. Requires installed grilling and domain-modeling."
---

# Grilling With Docs

IRON LAW: **Lock deliverable path(s) before any grilling round.** Then invoke installed **grilling** + **domain-modeling** only — never freestyle the interview or substitute repo skill paths. **Do not write the primary deliverable** until the grilling frontier is empty and the user confirms shared understanding.

Red flags (stop — fix before continuing):

- Asking grilling questions before Step 1 artifact path(s) are locked
- Writing the deliverable while frontier questions remain open
- Reading `skills/grilling/` or `skills/domain-modeling/` instead of invoking installed skills
- Skipping domain-modeling while terms or decisions crystallise
- Dumping every answer into `CONTEXT.md` (glossary only — see domain-modeling)
- Inventing requirements the source docs do not support

## Workflow

Copy this checklist and track progress:

```
Grilling-With-Docs Progress:

- [ ] Step 0: Prerequisite check ⛔ BLOCKING
  - [ ] Confirm grilling and domain-modeling are installed
  - [ ] Parse {{input}} for requirement source and artifact hints
- [ ] Step 1: Lock deliverable path(s) ⛔ BLOCKING
  - [ ] Path present in {{input}} → record and continue
  - [ ] Path missing → ask once; wait for answer before Step 2
- [ ] Step 2: Ingest requirements ⚠️ REQUIRED
  - [ ] Load pasted text and/or read named docs
  - [ ] List ambiguities and open decisions (do not ask yet)
- [ ] Step 3: Grill + model ⚠️ REQUIRED
  - [ ] Invoke Skill tool twice (grilling + domain-modeling)
  - [ ] Run grilling rounds to empty frontier
  - [ ] Apply domain-modeling (glossary + ADRs inline)
- [ ] Step 4: Confirm shared understanding ⚠️ REQUIRED
- [ ] Step 5: Write deliverable file(s) ⚠️ REQUIRED
- [ ] Step 6: Summarize for user ⚠️ REQUIRED
```

**Control flow**

1. Step 0 must pass before anything else.
2. Step 1 must lock path(s) before Step 2–3. If missing, ask **one** question and wait.
3. Step 2 gathers facts from the environment; do not interview the user for look-up-able facts.
4. Step 3 runs both dependency skills in the same session until the grilling frontier is empty.
5. Step 5 runs only after Step 4 confirmation.
6. `CONTEXT.md` / ADR updates from domain-modeling may happen **during** Step 3; the **primary deliverable** from Step 1 waits until Step 5.

## Step 0: Prerequisite check ⛔ BLOCKING

Confirm these skills are **installed and callable** in the current session (available skills list / Skill tool — not repo directories):

| Required skill     | Role                                              |
| ------------------ | ------------------------------------------------- |
| `grilling`         | Step 3: design-tree interview in frontier rounds  |
| `domain-modeling`  | Step 3: sharpen terms; write CONTEXT.md / ADRs   |

Optional other installed skills (code search, docs, harness helpers) may run **only** to look up facts grilling needs. They must **not** replace `grilling` or `domain-modeling`.

**Detection**: verify each `name` in the session skill list — do not infer from `skills/` paths in the repo.

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
| Deliverable path  | Explicit file path(s) for the primary artifact (see Step 1)          |
| Extra outputs     | Optional: also refresh CONTEXT.md / ADR via domain-modeling rules    |

Load `references/ingest-and-artifact.md` when path parsing or multi-doc ingest is ambiguous.

## Step 1: Lock deliverable path(s) ⛔ BLOCKING

Ask: **Which file path(s) will hold the primary deliverable after grilling?**

- If `{{input}}` already names path(s) (e.g. `docs/specs/refund.md`, `designs/briefs/checkout.md`) → record them and proceed.
- If missing → ask **once**, propose a sensible default path when helpful, and **wait**. Do not start Step 2 or Step 3.
- Multiple primary files are allowed only when the user lists them; otherwise prefer one SSOT file.

Do **not** treat `CONTEXT.md` / `docs/adr/*` as substitutes for the primary deliverable unless the user explicitly named them as the deliverable.

## Step 2: Ingest requirements ⚠️ REQUIRED

1. Read every source doc named in `{{input}}` (and linked paths discovered there if clearly in scope).
2. Merge with pasted requirement text. Prefer written sources over guesses when they conflict — surface the conflict in Step 3.
3. Produce an internal brief (do not write the deliverable yet):
   - Goal / non-goals (as currently stated)
   - Actors and key terms (flag fuzzy ones)
   - Open decisions and ambiguities
   - Facts already answered by code or docs (mark as settled prerequisites for grilling)

Ask: What claims in the brief are still ambiguous, conflicting, or unstated? Those become grilling inputs — not assumptions.

## Step 3: Grill + model ⚠️ REQUIRED

1. At the **start** of this step, invoke the Skill tool **twice**: once for **`grilling`**, once for **`domain-modeling`**. Both must load before the first question round. If either fails to load, stop and report which skill did not load.
2. Follow **`grilling`** fully: design tree, frontier rounds, numbered questions with recommended answers, wait between rounds; look up facts yourself (optional other skills only for lookups).
3. Apply **`domain-modeling`** throughout the same session: challenge glossary conflicts, sharpen overloaded terms, stress-test scenarios, cross-check code, update `CONTEXT.md` inline, offer ADRs only when all three gates pass.
4. Feed Step 2 ambiguities into the grilling frontier. Keep domain language consistent with `CONTEXT.md` as it updates.
5. Continue rounds until the grilling frontier is empty.

⚠️ Do not write the Step 1 primary deliverable in this step.

## Step 4: Confirm shared understanding ⚠️ REQUIRED

Present a short recap:

- Settled decisions (bullets)
- Canonical terms introduced or changed
- ADR offers accepted / skipped
- Exact path(s) that will be written in Step 5
- For each path that already exists: state **will overwrite** (or create new if absent)

Ask: Confirm we have shared understanding and may write the deliverable? Options: proceed / revise specific points / continue grilling.

⚠️ Do not write files until the user confirms (or explicitly waived confirmation in `{{input}}` with clear "write without asking" intent).

## Step 5: Write deliverable file(s) ⚠️ REQUIRED

1. Write only the locked path(s) from Step 1.
2. Content must reflect settled answers only — no unresolved TODOs for decisions already grilled.
3. Keep implementation detail out of `CONTEXT.md`; put design/spec content in the primary deliverable.
4. Overwrite only after Step 4 confirmation covered that path; note create vs overwrite in Step 6.

Load `references/deliverable-quality.md` before writing if the artifact type is unclear (spec vs brief vs ADR-only).

## Step 6: Summarize for user ⚠️ REQUIRED

Report:

- Prerequisite check: both skills present
- Requirement sources ingested
- Deliverable path(s) written
- CONTEXT.md / ADR changes (if any)
- Remaining follow-ups explicitly deferred by the user

## Anti-Patterns

- Starting grilling before the artifact path gate
- Freestyle Q&A dump instead of invoking `grilling`
- Glossary-only session when the user asked for a spec/brief file
- Writing the deliverable mid-interview "to save time"
- Treating repo `skills/` markdown as skill invocation
- Stuffing the deliverable into `CONTEXT.md`
- Asking the user for facts readable from the repo or named docs
- Expanding scope beyond `{{input}}` after Strengths-style "nice to haves"
- Using optional lookup skills as a substitute for `grilling` or `domain-modeling`
- Loading only one of the two required skills in Step 3

## Pre-Delivery Checklist

- [ ] `grilling` and `domain-modeling` confirmed installed before work
- [ ] Deliverable path(s) locked before the first grilling round
- [ ] Source docs / pasted requirements actually read
- [ ] Grilling frontier empty; user confirmed shared understanding (or explicit waiver)
- [ ] Primary deliverable written only to locked path(s); overwrite confirmed when applicable
- [ ] Both required skills loaded at Step 3 start (not only one)
- [ ] `CONTEXT.md` remains glossary-only; ADRs only if three gates passed
- [ ] No repo skill path substituted for installed skill invocation
- [ ] No placeholder decision stubs left for already-settled questions
