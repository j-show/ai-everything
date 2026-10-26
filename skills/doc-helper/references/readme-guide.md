# README Guide

Load during Step 4.

## README vs symbol documentation

| README | Symbol documentation |
| ------ | ----- |
| Positioning, install, run | Per-symbol behavior |
| Scripts, env vars | Params, returns, throws |
| Directory overview | Implementation detail |

Link to source; do not paste full API listings.

## Language and edit scope

Follow explicit user requirements and applicable repository instructions first. Otherwise preserve each existing document's language, headings, and unrelated text. Update only requested sections or claims directly affected by the target behavior; the checklist below is not a mandate to expand an existing README.

| Condition | Output |
| --------- | ------ |
| Existing README | Preserve its language, including English when no Chinese companion exists |
| Maintained translations exist and are in scope | Synchronize affected facts and preserve existing cross-links |
| No README exists and creation is in scope | Follow project language conventions; use Chinese only when no preference or convention exists |

Do not create translations or AGENTS files solely to complete a template. Preserve correct text instead of rephrasing it on each run.

## Checklist

- [ ] Name and one-line positioning
- [ ] Environment requirements when applicable
- [ ] Install and commands match the owning module's actual configuration, using language-routing.md for evidence sources
- [ ] Config / env vars when they exist
- [ ] Directory structure and roles
- [ ] Usage examples for exports or main workflows

## Verify

Check script names and target paths separately. If a declared command points to a missing file, report that limitation instead of presenting it as working. Do not run install, deployment, or service commands just to check documentation. No docs for unimplemented features; label examples or dependency behavior that could not be executed.

Mixed projects may have separate Node, Maven/Gradle, Python and C/C++ commands. Keep each command tied to its module and working directory; do not require package.json in non-JS projects or translate another build system's commands into npm. README-only work reads source/configuration as evidence and never edits source. Unsupported code-comment languages can still supply README evidence; do not claim their comment route is supported.
