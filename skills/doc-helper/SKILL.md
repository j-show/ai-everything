---
name: doc-helper
description: "Document current code behavior with language-specific comments and scoped README updates. Routes JS/TS, Java, Python, and C/C++ files to separate conventions and existing project checks. Use for doc-helper, JSDoc, Javadoc, docstrings, Doxygen, document code, add comments, write or update README, 补全文档, 写注释, 代码注释, or 完善 README."
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
  - [ ] 1.3 Read each target module's configuration and existing docs
  - [ ] 1.4 Resolve per-file language, conventions, environment, and exclusions
- [ ] Step 2: Symbol documentation (code mode)
  - [ ] Load only the language rules selected by references/language-routing.md
  - [ ] Document public APIs and complex internal symbols within scope
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

Resolve both the requested outputs and target units: files, named symbols, code regions or README sections. Explicit restrictions override the defaults below; mark excluded stages N/A. Reading surrounding code as evidence does not authorize editing it.

| Requested output | Run |
| --- | --- |
| README only | Steps 1, 4, 5; read source as evidence, do not edit it |
| Symbol documentation only (JSDoc, Javadoc, docstrings, declaration comments) | Steps 1, 2, 5; no implementation comments |
| Inline comments only | Steps 1, 3, 5; load the selected language's syntax/placement rules, but do not add symbol documentation |
| General code comments | Steps 1, 2, 3, 5; README changes only when explicitly required by applicable repository instructions and not excluded by the user's request |
| Both / general documentation | Steps 1–5, limited to the target and directly affected docs |

Mark unused checklist steps N/A. Preserve correct existing text; fix stale claims and fill necessary gaps. Do not create companion documents or expand unrelated sections unless requested or required by repository instructions.

Discover before writing:
1. **Entry points** — main, index, CLI bin, plugin manifests.
2. **Public API** — exported functions, classes, types; note internal-only symbols if user limited scope to public.
3. **Module configuration** — follow [references/language-routing.md](references/language-routing.md) to locate each file's language, owning module, toolchain/version, documentation style and available checks. README-only work needs project evidence, not symbol-comment rules.
4. **Existing docs** — identify language, structure, and any maintained translations.

### Ignore directories

Do not edit `test`, `tests`, `e2e`, `dist`, `coverage`, `.cursor`, dependencies, or generated files unless explicitly targeted. Read relevant tests and dependency files as evidence when needed.

### Scope confirmation

If the repo is large and scope is unspecified, list candidate files and ask to proceed with all or a subset. ⚠️ Do not edit hundreds of files without alignment.

## Step 2: Symbol documentation (code mode)

Load the selected rule **before editing each language group**:

| File language | Required reference | Default when no project convention exists |
| --- | --- | --- |
| JavaScript / TypeScript | [jsdoc-conventions.md](references/jsdoc-conventions.md) | JSDoc; TS signatures supply types |
| Java | [java-conventions.md](references/java-conventions.md) | Javadoc |
| Python | [python-conventions.md](references/python-conventions.md) | Google-style docstrings |
| C / C++ | [c-cpp-conventions.md](references/c-cpp-conventions.md) | Doxygen; use the resolved C or C++ section |

Work file by file within the requested units. When symbol documentation is requested, all in-scope public APIs get a short description; parameters, returns, public fields/constants and errors explain semantics missing from the signature. Cover complex internal logic or important invariants only when not excluded by a public-only or named-symbol scope. Preserve sufficient existing documentation instead of adding redundant tags.

Keep valid project formats; do not migrate plain comments to documentation tags unless requested. If a requested format belongs to another language (such as JSDoc for Java), explain the mismatch and use that language's appropriate format. Natural language for new text: explicit user request → project rule → existing file/module comments → main project docs → Chinese. Preserve valid existing text without translating it; keep identifiers and standard tags unchanged.

## Step 3: Inline comments

Load `references/inline-comments.md` before adding implementation comments; combine its shared principles with the selected language's syntax and placement rules.

Add comments only per that reference — not for comment count.

## Step 4: README

Load `references/readme-guide.md` before editing README files.

README = project-level (entry, install, config, layout, examples). Language-specific documentation = symbol-level. Link to source instead of pasting API manuals.

## Step 5: Self-check ⚠️ REQUIRED

Review the diff against the resolved scope. Verify referenced paths, commands, and documented branches. Run relevant existing documentation/syntax/type checks in the owning module and its available environment; inspect command targets and side effects first. Do not install tools, switch global environments, or run deployment/services merely to validate command names. No mandatory coding-skill dependency.

Fix failures caused by the new comments. Report missing tools/dependencies or unrelated pre-existing failures without changing implementation or configuration. Available static inspection can support delivery but is not a substitute for an unexecuted environment check.

Account for every requested unit at the granularity resolved in Step 1: **edited**, **reviewed and already sufficient**, or **unresolved/skipped** with its reason. Already sufficient units count as handled; no-change results are not automatically partial. If any requested unit remains unresolved, label the result **partial** even when another symbol in the same file was edited. Excluded outputs and files read only as evidence do not count as missing deliverables.

Report actual checks separately from coverage. Completed edits or no-change reviews with blocked verification must say **edited/reviewed; environment validation unverified**, not fully verified. A passed check cannot turn unresolved requested units into completion.

Stop when the requested facts are accurate: a repeat run on unchanged inputs should produce no edits just to rephrase, reorder, or add examples.

## Evidence and fallback

| Trigger | Action | If unresolved |
| --- | --- | --- |
| Third-party behavior needs verification | Match the installed/locked version; inspect local implementation and declarations. Use Context7 or version-matched official docs for missing facts | Report the exact evidence gap; omit unsupported claims and continue independent work |
| Context7 unavailable | Use the same local evidence or accessible official documentation | Do not invent behavior or install tooling to bypass the limitation |
| Existing docs conflict with code | Trace current implementation, callers, and relevant tests; correct stale docs | If the contract remains ambiguous, ask about that claim only; do not silently fix code |
| Manifest, command target, or dependency runtime missing | Inspect available project evidence and name the missing item | Do not invent commands or claim successful execution from declarations alone |
| Language ambiguous | Use module configuration, syntax, and callers per language-routing.md | Ask only about unresolved files; leave them untouched and continue independent files |
| Code-comment editing requested for an unsupported language (including Ruby/Rust) | Record detected language and unsupported status | Skip that requested code unit and report partial completion; continue independent work. README-only tasks may read such source as evidence and are judged on requested README coverage |
| Python docstring used as runtime configuration | Trace its consumer before editing | Leave the affected symbol untouched, explain the impact and ask; continue independent symbols |

## Anti-Patterns

- Describing unimplemented or planned behavior
- Speculative comments ("might", "probably", "I think")
- Duplicating symbol documentation inside function bodies
- Commenting every trivial line
- Full API reference inside README
- Processing ignored directories
- Library API from memory or mismatched-version documentation
- Changing existing language, creating translations, or expanding scope without a request or repository requirement
- Treating a declared command or dependency contract as a successful runtime test
- Restructuring code only to fit comments
- Inferring every file's language from the repository root, or applying JSDoc tags across languages
- Editing directive comments, macro continuations or runtime-consumed docstrings as ordinary prose

## Pre-Delivery Checklist

### Symbol documentation & comments
- [ ] Every code unit requested for editing has a resolved language/rule or an explicit unresolved/unsupported status
- [ ] Documentation matches branches, optional params, nullability, ownership and the language's error model
- [ ] Required public symbols/fields covered; signatures not redundantly restated
- [ ] No speculative wording; non-trivial callbacks have key constraints documented without changing code structure
- [ ] No false unimplemented API descriptions

### README
- [ ] Name, positioning, env requirements (if any), install/commands match actual module configuration
- [ ] Config/env vars and directory overview when applicable
- [ ] Usage examples for main exports or workflows
- [ ] Existing language and unrelated sections preserved; translations follow repository/user requirements
- [ ] Paths and script names verified in repo

### Scope
- [ ] Only requested outputs and units changed; excluded steps marked N/A, unresolved units distinguished from already sufficient ones
- [ ] No signature, control-flow or business-expression changes; Python documentation metadata changes are allowed only per its rule
- [ ] Validation results and unresolved evidence gaps reported; unchanged inputs need no second-run edits
