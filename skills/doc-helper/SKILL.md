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
  - [ ] 1.1 Identify scope (path, module, or whole repo)
  - [ ] 1.2 Find entry files and exported public API
  - [ ] 1.3 Read package.json scripts and existing README
  - [ ] 1.4 List files to process (apply ignore rules)
- [ ] Step 2: JSDoc ⚠️ REQUIRED
  - [ ] Load references/jsdoc-conventions.md
  - [ ] Document per file: functions, classes, interfaces, types, enums, constants
- [ ] Step 3: Inline comments
  - [ ] Load references/inline-comments.md
  - [ ] Add comments only at key steps (why, not what)
- [ ] Step 4: README
  - [ ] Load references/readme-guide.md
  - [ ] Update README.md / README_CN.md per bilingual rules
- [ ] Step 5: Self-check ⚠️ REQUIRED
  - [ ] Run pre-delivery checklist below
```

## Step 1: Survey ⚠️ REQUIRED

Ask if scope is unclear:
- Which directory or files should be documented?
- README only, code only, or both?

Discover before writing:
1. **Entry points** — main, index, CLI bin, plugin manifests.
2. **Public API** — exported functions, classes, types; note internal-only symbols if user limited scope to public.
3. **package.json** — `scripts`, `engines`, env-related config for README accuracy.
4. **Existing README** — note `README_CN.md` presence (bilingual split rule).

### Ignore directories

Do **not** process files under: `test`, `tests`, `e2e`, `dist`, `coverage`, `.cursor`.

### Scope confirmation

If the repo is large and scope is unspecified, list candidate files and ask to proceed with all or a subset. ⚠️ Do not edit hundreds of files without alignment.

## Step 2: JSDoc ⚠️ REQUIRED

Load `references/jsdoc-conventions.md` before editing.

Work **file by file** (types/utilities before consumers when helpful). Default: all exported symbols plus complex reused **internal** helpers unless user restricted to public API only.

## Step 3: Inline comments

Load `references/inline-comments.md` before adding non-JSDoc comments.

Add comments only per that reference — not for comment count.

## Step 4: README

Load `references/readme-guide.md` before editing README files.

README = project-level (entry, install, config, layout, examples). JSDoc = symbol-level. Link to source instead of pasting API manuals.

## Step 5: Self-check ⚠️ REQUIRED

Run the pre-delivery checklist below.

## Core principles

- **Implementation first** — read code and callers, then write docs.
- **Less but accurate** — why, boundaries, invariants; do not restate obvious code.
- **README vs source** — split responsibilities as above.

## Anti-Patterns

- Describing unimplemented or planned behavior
- Speculative comments ("might", "probably", "I think")
- Duplicating JSDoc inside function bodies
- Commenting every trivial line
- Full API reference inside README
- Processing ignored directories
- Library API from memory — use Context7 (`resolve-library-id` → `query-docs`) when documenting third-party behavior
- Restructuring code only to fit comments

## Pre-Delivery Checklist

### JSDoc & comments
- [ ] JSDoc matches branches, optional params, and nullability
- [ ] `@param` / `@returns` / `@throws` where applicable; interface properties documented
- [ ] No speculative wording; non-trivial anonymous functions have leading body comments
- [ ] No false unimplemented API descriptions

### README
- [ ] Name, positioning, env requirements (if any), install/commands match `package.json`
- [ ] Config/env vars and directory overview when applicable
- [ ] Usage examples for main exports or workflows
- [ ] `README_CN.md` rule: English `README.md` + Chinese `README_CN.md` cross-linked; else single README (Chinese default unless user asked for English only)
- [ ] Paths and script names verified in repo

### Scope
- [ ] Ignored directories skipped; user scope respected
