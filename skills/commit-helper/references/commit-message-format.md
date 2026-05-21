# Commit Message Format

Load at Step 3.

## Structure (blank line required)

```text
{type}: {title}

- {item 1}
- {item 2}
```

| Part | Rule |
| ---- | ---- |
| First line | `{type}: {title}` — one space after colon; title **short and summary-level** |
| Body | Each line `- `; a few intent bullets, not every file path |
| One change | One `- ` line is OK |
| Minimal body | Still at least **one** summary `- ` line |

## Types (exactly one)

| Type | Use when | Judgment |
| ---- | -------- | -------- |
| `fix` | Bug fix | Small business-code change |
| `feat` | New/changed feature | Business code forming a complete feature |
| `docs` | Docs only | README, JSDoc only — no business code |
| `ci` | CI only | CI scripts only — no business code |
| `refactor` | Refactor | Large business-code restructure, not a full new feature |
| `style` | Style | Style only — no business logic |
| `perf` | Performance | Perf/structure, not a new feature |
| `test` | Tests | Test changes only |
| `build` | Build/tooling | Build system or tools, no business code |
| `revert` | Revert | Reverts a commit or feature |
| `chore` | Misc | Encoding, versions, deps, other |

## Choosing type

1. User specified type in input → use it
2. Else primary **intent** of the diff
3. Multiple intents → by proportion of change
4. Tie-break weight: **`refactor` > `feat` > `fix` > `chore`**

## Heredoc (required)

Do not use a single `-m` line for title + bullets.

```bash
git commit -m "$(cat <<'EOF'
feat: Short title

- What changed in plain language
- Secondary effect or scope
EOF
)"
```

Escape `"` in the message body if needed; avoid raw unescaped `"` inside the heredoc.

## Map from Step 2 summary

- Summary headline → `{title}`
- Each intent bullet → one `- ` line in the commit body
