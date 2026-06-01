# Discovery Checklist

Use during Step 1. Goal: facts from the repo, not assumptions.

## Manifests (read in order)

| Source | Extract |
| ------ | ------- |
| `package.json` | `name`, `scripts`, `engines`, workspaces |
| `pnpm-workspace.yaml` / `turbo.json` | monorepo layout |
| `Makefile` / `justfile` / `Taskfile.yml` | `make help` targets |
| `pyproject.toml` / `Cargo.toml` / `go.mod` | toolchains, test commands |
| `docker-compose*.yml` | local services, ports |
| `.github/workflows/*.yml` | CI build/test/lint commands |
| `README.md` / `README_CN.md` | purpose paragraph, install (link only) |

## Directory scan

List top-level entries with one-line role each. Prefer README “Project structure” if present; else infer from names (`src/`, `apps/`, `packages/`, `skills/`, `scripts/`).

For monorepos: note whether task targets a subpackage (working directory matters).

## Existing agent context

| File | Action |
| ---- | ------ |
| `AGENTS.md` | Merge vs replace per user; preserve good commands/rules |
| `CLAUDE.md` | If duplicate of AGENTS.md, suggest symlink after user confirms |
| `.cursor/rules/*` | Link from Document map; do not copy full rule bodies |
| `skills/*/SKILL.md` | List names + one-line purpose in Document map (plugin repos) |

## Verification loop

Document the shortest path agents should run after code changes:

1. Format/lint (if non-default)
2. Build
3. Test (full vs single-file command)
4. Local run / health check (if app has server)

Record log paths, default ports, env file locations (`~/.project_env` vs `.env.example`) without committing secrets.

## Questions to ask user (pick at most one if blocked)

- Monorepo: which package is in scope?
- Overwrite existing AGENTS.md or merge?
- Any private commands not in repo (CI-only)?
