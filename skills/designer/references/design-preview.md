# Design Preview Generation

Load at Step 3 (after spec write) and during Option 3 detail adjustments.

## Directories

```text
designs/previews/     # generated preview images
designs/images/       # per-image prompt/spec docs (basename matches preview)
designs/specs/        # SSOT brief — previews must align with spec tokens & layout
```

**Pairing rule:** for `designs/previews/{slug}-{view}.png`, maintain `designs/images/{slug}-{view}.md`.

Example views: `{slug}-desktop.png`, `{slug}-mobile.png`, `{slug}-hero.png`.

## Image backend (pick first available)

| Harness | Primary | Fallback |
| ------- | ------- | -------- |
| **Codex** | `Image Gen` capability | model multimodal image generation |
| **Other** (Cursor, Claude Code, etc.) | `image-gen` MCP (if installed) | `GenerateImage` tool or model multimodal generation |

Do not skip previews when a backend exists. If all backends fail, report which failed and continue to user gate with spec only.

## Generation workflow

1. Read `designs/specs/{slug}.md` — tokens, layout, signature, copy tone.
2. For each planned view, write **`designs/images/{slug}-{view}.md` first** (prompt source), then generate the matching preview.

### `{slug}-{view}.md` required sections

```markdown
# {slug} — {view}

**Preview file:** designs/previews/{slug}-{view}.png
**Spec SSOT:** designs/specs/{slug}.md

## Layout
{viewport, grid, section order, whitespace, focal hierarchy}

## Modules
{each UI block: name, purpose, content, placement}

## Visual details
{colors from token table, type roles, signature element, motion intent if visible}

## Image prompt
{single consolidated English prompt for image generation — derived from above}
```

3. Generate image using the **Image prompt** section; save to `designs/previews/{slug}-{view}.png`.
4. Add/update the § Preview index table in `designs/specs/{slug}.md`.

Default: at least **desktop** and **mobile** views unless the brief is single-surface.

## Option 3 — sync updates

When user requests detail changes (spacing, module copy, layout tweak, color shade):

1. Edit the relevant `designs/images/{slug}-{view}.md` (layout, modules, visual details, image prompt).
2. Regenerate or replace `designs/previews/{slug}-{view}.png` with the updated prompt.
3. Update § Preview index in spec if filenames or view list changed.
4. Re-present Step 3 user gate (Options 1 / 2 / 3).

Never leave orphaned pairs (preview without `.md`, or `.md` without preview).

## Anti-patterns

- Generating previews before `designs/specs/{slug}.md` exists
- Prompts that ignore token hex/type from spec
- Updating preview PNG without updating matching `designs/images/*.md`
- Generic stock-UI prompts not tied to signature element in spec
