---
name: doc-helper
description: "Add JSDoc, key-step inline comments, and README from implementation code. Documents functions, classes, interfaces, types, enums, and constants; syncs README with package.json, env vars, and directory layout. Use when user wants to document code, add jsdoc, write or update readme, invoke doc-helper, or complete project documentation. Triggers: 'doc', 'doc-helper', 'jsdoc', 'readme', 'document code', 'add comments', 'write documentation', '补全文档', '写注释', '完善 README', 'JSDoc', '代码注释', '文档补全'."
---

# Doc Helper

IRON LAW: Document **current behavior** read from code and call sites — never describe planned APIs, ideal design, or behavior you have not verified. Comments must not contain guesses ("maybe", "probably", "I think").

## Workflow

Copy this checklist and check off items as you complete them:

```
Doc Helper Progress:

- [ ] Step 1: Survey ⚠️ REQUIRED
  - [ ] 1.1 Resolve scope and mode from the request or caller
  - [ ] 1.2 Find entry files and exported public API
  - [ ] 1.3 Read package.json scripts and existing README
  - [ ] 1.4 List files to process (apply ignore rules)
- [ ] Step 2: JSDoc (code mode)
  - [ ] Load references/jsdoc-conventions.md
  - [ ] Document per file: functions, classes, interfaces, types, enums, constants
- [ ] Step 3: Inline comments (code mode)
  - [ ] Load references/inline-comments.md
  - [ ] Add comments only at key steps (why, not what)
- [ ] Step 4: README (README mode)
  - [ ] Load references/readme-guide.md
  - [ ] Correct relevant content while preserving language and structure
- [ ] Step 5: Self-check ⚠️ REQUIRED
  - [ ] Run pre-delivery checklist below
```

## Step 1: Survey ⚠️ REQUIRED

Read applicable repository instructions. Reuse scope already supplied by the user or calling workflow; ask only when the target cannot be resolved from context.

| Requested output | Run |
| --- | --- |
| README only | Steps 1, 4, 5; read source as evidence, do not edit it |
| Code comments only | Steps 1, 2, 3, 5; do not edit README |
| Both / general documentation | Steps 1–5, limited to the target and directly affected docs |

Mark unused checklist steps N/A. Preserve correct existing text; fix stale claims and fill necessary gaps. Do not create companion documents or expand unrelated sections unless requested or required by repository instructions.

Discover before writing:
1. **Entry points** — main, index, CLI bin, plugin manifests.
2. **Public API** — exported functions, classes, types; note internal-only symbols if user limited scope to public.
3. **package.json** — `scripts`, `engines`, env-related config for README accuracy.
4. **Existing docs** — identify language, structure, and any maintained translations.

### Ignore directories

Do not edit `test`, `tests`, `e2e`, `dist`, `coverage`, `.cursor`, dependencies, or generated files unless explicitly targeted. Read relevant tests and dependency files as evidence when needed.

### Scope confirmation

If the repo is large and scope is unspecified, list candidate files and ask to proceed with all or a subset. ⚠️ Do not edit hundreds of files without alignment.

## Step 2: JSDoc (code mode)

Load `references/jsdoc-conventions.md` before editing.

Work **file by file** (types/utilities before consumers when helpful). Default: all exported symbols plus complex reused **internal** helpers unless user restricted to public API only.

## Step 3: Inline comments

Load `references/inline-comments.md` before adding non-JSDoc comments.

Add comments only per that reference — not for comment count.

## Step 4: README

Load `references/readme-guide.md` before editing README files.

README = project-level (entry, install, config, layout, examples). JSDoc = symbol-level. Link to source instead of pasting API manuals.

## Step 5: Self-check ⚠️ REQUIRED

Review the diff against the resolved scope. Verify referenced paths, commands, and documented branches. Use existing documentation lint/type checks when affected; do not install tools or execute deployment/service commands merely to validate their names. Distinguish inspected, executed, and unverified claims in the final report. If verification fails, correct documentation errors and report unrelated failures without changing implementation.

Stop when the requested facts are accurate: a repeat run on unchanged inputs should produce no edits just to rephrase, reorder, or add examples.

## Evidence and fallback

| Trigger | Action | If unresolved |
| --- | --- | --- |
| Third-party behavior needs verification | Match the installed/locked version; inspect local implementation and declarations. Use Context7 or version-matched official docs for missing facts | Report the exact evidence gap; omit unsupported claims and continue independent work |
| Context7 unavailable | Use the same local evidence or accessible official documentation | Do not invent behavior or install tooling to bypass the limitation |
| Existing docs conflict with code | Trace current implementation, callers, and relevant tests; correct stale docs | If the contract remains ambiguous, ask about that claim only; do not silently fix code |
| Manifest, command target, or dependency runtime missing | Inspect available project evidence and name the missing item | Do not invent commands or claim successful execution from declarations alone |

## Anti-Patterns

- Describing unimplemented or planned behavior
- Speculative comments ("might", "probably", "I think")
- Duplicating JSDoc inside function bodies
- Commenting every trivial line
- Full API reference inside README
- Processing ignored directories
- Library API from memory or mismatched-version documentation
- Changing existing language, creating translations, or expanding scope without a request or repository requirement
- Treating a declared command or dependency contract as a successful runtime test
- Restructuring code only to fit comments

## Pre-Delivery Checklist

### JSDoc & comments
- [ ] JSDoc matches branches, optional params, and nullability
- [ ] Parameters, returns, and escaping errors match implementation; distinguish throws, rejections, and caught-error fallbacks per `references/jsdoc-conventions.md`; interface properties documented
- [ ] No speculative wording; non-trivial anonymous functions have leading body comments
- [ ] No false unimplemented API descriptions

### README
- [ ] Name, positioning, env requirements (if any), install/commands match `package.json`
- [ ] Config/env vars and directory overview when applicable
- [ ] Usage examples for main exports or workflows
- [ ] Existing language and unrelated sections preserved; translations follow repository/user requirements
- [ ] Paths and script names verified in repo

### Scope
- [ ] Only resolved outputs changed; skipped steps marked N/A
- [ ] No executable behavior changed; validation results and unresolved evidence gaps reported
