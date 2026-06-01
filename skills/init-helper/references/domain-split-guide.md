# Domain Split Guide

When root `AGENTS.md` would exceed ~200 lines, split by **agent task**, not by file type.

## When to split

| Signal | Split into |
| ------ | ---------- |
| Multiple runtimes (e.g. Java + React) | `docs/agents/backend.md`, `docs/agents/frontend.md` |
| Large `skills/` or plugin tree | `docs/agents/skills.md` |
| Heavy infra (K8s, Terraform) | `docs/agents/infra.md` |
| Long API surface | `docs/agents/api.md` (link OpenAPI; no full path list in root) |

## When not to split

- Single small service (<5 top-level dirs)
- Content already in README and not agent-critical (link README only)
- Generic conventions agents already know

## File naming

- Path: `docs/agents/<topic>.md` (create `docs/agents/` if missing)
- Lowercase hyphen topics: `frontend.md`, `skill-authoring.md`
- Each file opens with one-line scope: “Load when editing …”

## Root file responsibility after split

Root keeps:
- Identity, env, **primary** commands (most common 5–15)
- Global Always / Ask first / Never do
- Verification loop entrypoint
- Document map table linking all domain files

Domain file keeps:
- Stack-specific commands, architecture trees, module rules
- Submodule test commands (`cd apps/web && pnpm test`)

## Monorepo

- Root `AGENTS.md`: workspace-wide commands + map
- `apps/foo/AGENTS.md` (optional): only if team uses nested agents.md; nearest file wins per spec
- Do not duplicate root commands in every app unless paths differ

## Plugin / harness repos (e.g. ai-everything)

Typical splits:
- `docs/agents/skills.md` — skill layout, `quick_validate.py`, skill-forge pointers
- `docs/agents/deploy.md` — `npm run deploy:*`, harness paths

Root links to `skills/skill-forge/SKILL.md` as SSOT for authoring—not full skill-forge body.
