# AGENTS.md Structure

Root file skeleton. Keep **≤200 lines**. Expand via `docs/agents/*.md`, not longer root sections.

## Recommended sections (order)

1. **Title + audience** — one line: AI agents; humans → README.
2. **Project** — what it is, stack, repo shape (≤10 lines).
3. **Environment** — versions, required tools, env file location + priority.
4. **Commands** — bullet list: `` `exact command` — effect ``.
5. **Structure** — table or ASCII tree of top-level paths.
6. **Boundaries** — Always do / Ask first / Never do (see below).
7. **Verification** — change → build → test → run sequence with commands.
8. **Known fixes** — optional `| Symptom | Fix |` for recurring agent errors.
9. **Document map** — links to `docs/agents/*.md`, README, specs.
10. **Quality gate** — checklist agents run before claiming done (project-specific).

Omit sections with no project-specific content.

## Merge vs replace (existing AGENTS.md)

| User choice | Behavior |
| ----------- | -------- |
| **Replace** | New file from template; copy over only user-named sections from old file after confirm |
| **Merge** | Keep: Commands, Known fixes, Never do. Refresh: Structure, Document map. Dedupe identical bullets |
| **Create** | No prior file; use template only |

⚠️ Never drop project-specific **Never do** or **Known fixes** rows without listing them in Step 3 diff.

## Boundaries format

```markdown
### Always do

- Run `pnpm run lint` before claiming UI work complete.
- Scope edits to paths under `{{user scope}}` unless asked otherwise.

### Ask first

- Create or overwrite `AGENTS.md`, delete files, change CI workflows.
- Add dependencies or change lockfiles.

### Never do

- `git push --force` to `main` / `master`.
- Commit `.env`, credentials, or `node_modules`.
- `git config` changes on the user's machine.
```

Rules must be **falsifiable** (agent can check compliance). Avoid “write high-quality code”.

## Commands format

```markdown
## Commands

Run from repository root:

- `pnpm run dev` — Vite dev server (port 5173)
- `pnpm exec vitest run src/foo.test.ts` — single test file
- `pnpm run build` — production build; fails on type errors
```

Bad: “Run the test suite using the project test runner.”

## SSOT format

```markdown
## Document map

| Doc | Purpose |
| --- | ------- |
| [README.md](README.md) | Human install and overview |
| [docs/agents/frontend.md](docs/agents/frontend.md) | React routes, component conventions |
| [OpenAPI spec](docs/openapi.yaml) | HTTP API (do not duplicate paths here) |
```

Link only. If agents need one invariant from a doc, quote **one line**, not a chapter.

## Known fixes format

```markdown
## Known fixes

| Symptom | Fix |
| ------- | --- |
| `EADDRINUSE` on 8080 | `lsof -ti:8080 \| xargs kill` then `./scripts/start-server.sh` |
| Tests fail with missing DB | `docker compose up -d postgres` then `pnpm run db:migrate` |
```

## Line budget

| Lines | Action |
| ----- | ------ |
| ≤180 | OK |
| 181–200 | Trim prose; tighten tables |
| >200 | Move sections to `docs/agents/`; keep index in root |
