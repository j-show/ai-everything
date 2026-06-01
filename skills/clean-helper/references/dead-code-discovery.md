# Dead Code Discovery

Load at Step 1.

## Search signals

| Signal | Action |
| ------ | ------ |
| `@deprecated`, `DEPRECATED`, `FIXME(remove)` | Read doc + callers; confirm replacement exists |
| `if (false)`, `if (0)`, `&& false` | Prove arm unreachable; check compile-time flags |
| Feature flag always off in all envs | Confirm config source; ask before delete |
| `export` with zero importers in repo | Check dynamic import, package.json `exports`, docs |
| Unreachable `else` after return/throw | Safe simplify candidate |
| Empty `catch` only used by dead caller | Remove with caller chain |
| Commented-out blocks | Treat as delete candidate after user ack |

## Evidence checklist

For each symbol or branch:

1. **References** — ripgrep symbol name; include string literals for dynamic names.
2. **Entry points** — CLI commands, HTTP routes, job handlers, event subscribers.
3. **External** — OpenAPI/SDK consumers, plugin interfaces, semver public API.
4. **Tests** — dedicated tests may be the only caller; remove test + impl together.

## Optional static analysis (cross-check only)

| Stack | Tool | Notes |
| ----- | ---- | ----- |
| TypeScript/JS | knip, ts-prune, depcheck | False positives on framework entry points |
| Python | vulture | Whitelist framework registrations |
| Go | `deadcode`, staticcheck | Module-scoped runs |

Always confirm tool output with ripgrep and call-graph reasoning — do not auto-delete from tool output alone.

## Do not mark dead without proof

- Reflection (`[name]()`, registry maps)
- Framework hooks (lifecycle, middleware registered by name)
- Conditional compilation / build tags
- Symbols kept for backward compatibility on a stable export surface

## Output format

```markdown
### Delete candidates
- `path:line` — `symbol` — evidence: zero refs except definition

### Needs user input
- `path:line` — `symbol` — reason: dynamic import in string template
```
