# Design Brief Output Format

Use when building Step 1 → Step 2 content and when writing **`designs/specs/{slug}.md`** at Step 3.

## Header

```markdown
# Design Brief — {Project or page name}

**Slug:** {kebab-case slug}
**User brief (verbatim summary):** {one line from {{input}}}
**Stack:** {from user or inferred once, then confirmed}
**Iteration:** {ISO timestamp}
```

## § Base System (Step 1 — ui-ux-pro-max)

| Dimension             | Content                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| Product / industry    |                                                                          |
| Page structure        | Sections and hierarchy                                                   |
| Color tokens          | 4–6 named hex + role (background, surface, primary, accent, text, muted) |
| Typography            | Display + body (+ utility if needed); scale notes                        |
| Interaction           | Key states, motion intent, primary CTA                                   |
| Anti-patterns (avoid) | From ui-ux-pro-max output                                                |

Optional ASCII wireframe (one screen) when layout is non-obvious.

## § Revised Direction (Step 2 — frontend-design)

Answer inline:

1. **Subject grounding** — What concrete subject, audience, and single page job?
2. **Memory point (signature)** — One element this page will be remembered by.
3. **Aesthetic risk** — One deliberate choice and why it fits this brief.
4. **Detemplating changes** — What changed from Base System and why (palette, type, layout, copy).
5. **Rejected defaults** — Which generic AI clusters were avoided (cream/terracotta, dark+acid accent, broadsheet, etc.)?

### Token table (final)

Same columns as Base System but **final** values after revision.

### Layout concept

One sentence + optional ASCII wireframe if revised.

### Copy tone

Register, vocabulary, empty/error state voice (one line each).

## § Preview index (Step 3 — after image generation)

| Preview | Spec doc | Description |
| ------- | -------- | ----------- |
| `designs/previews/{slug}-desktop.png` | `designs/images/{slug}-desktop.md` | … |

## § Implementation Notes (Step 4 handoff)

- Primary CTA label (exact string)
- Components to build (ordered)
- Explicit non-goals (out of scope for this pass)

May live in `designs/specs/{slug}-implementation.md` when the main spec is long.
