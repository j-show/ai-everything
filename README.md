# AI Everything

**English** · [简体中文](README_CN.md)

**AI Everything** (package name `ai-everything`) is a plugin bundle for coding agents. It registers paths for **skills**, **commands**, **hooks**, and related assets across **Cursor**, **Codex**, and **Claude Code** so you can reuse one workflow toolkit in multiple harnesses.

---

## Requirements

- [Node.js](https://nodejs.org/) **22+** (ES modules; `scripts/*.mjs` use `import` and modern `fs` APIs)
- [Git](https://git-scm.com/) on `PATH` for `npm run upgrade:skill` (shallow sparse checkout; no GitHub API quota)
- No `npm install` required for maintainer scripts (stdlib only)
- **Deploy on Windows**: Git Bash or another `bash` on `PATH` is only needed for hook scripts, not for `npm run deploy`

---

## Maintainer workflow

`package.json` is the single source of truth for published metadata. After changing it, run `npm run build` to sync `.cursor-plugin`, `.codex-plugin`, and `.claude-plugin`.

| Script | Equivalent CLI |
| ------ | -------------- |
| `npm run build` | `node scripts/build.mjs` |
| `npm run deploy:cursor` | `npm run deploy -t cursor` |
| `npm run deploy:codex` | `npm run deploy -t codex` |
| `npm run deploy:claude` | `npm run deploy -t claude` |
| `npm run deploy:qcode` | `npm run deploy -t qcode` |
| `npm run upgrade:skill` | `node scripts/upgrade-skill.mjs` |
| `npm run upgrade:design` | `node scripts/upgrade-skill.mjs --design` |
| `npm run upgrade:tool` | `node scripts/upgrade-skill.mjs --tool` |

```bash
# Link commands/rules/skills into a local harness folder
npm run deploy -- --type cursor --mode local
```

`deploy` links `commands/`, `rules/`, and `skills/` into `~/.cursor`, `~/.codex`, `~/.claude`, or `~/.q-code` by default; `--mode local` targets the current project folder. Use the double dash form when npm swallows flags.

`upgrade:skill` updates every configured upstream skill by default. Use `npm run upgrade:skill -- --skill <name>` to update one skill, `--design` for `frontend-design` and `ui-ux-pro-max`, or `--tool` for `grilling`. When `--skill` is present, group flags are ignored. `upgrade:design` and `upgrade:tool` are shortcuts for their corresponding groups.

When multiple skills run concurrently, interactive terminals show an independent rolling detail block for each skill. CI and redirected output automatically use append-only lines prefixed with the skill name.

Each skill is synchronized as a strict upstream mirror through a shallow Git sparse checkout, so the upgrade does not consume GitHub REST API quota. The machine must have `git` available on `PATH`. `U` means a new local file, `M` means the upstream bytes changed, and `D` means an upstream deletion; unchanged files are not listed.

---

## Installation

**Each harness has its own install flow.** If you use more than one of Claude Code, Codex, and Cursor, install this plugin **separately** in each product.

| Harness | Install entry |
| ------- | ------------- |
| Claude Code | `/plugin install ai-everything@claude-plugins-official`, or add `jshow-marketplace` and install from there |
| Codex CLI | Open `/plugins`, search `ai-everything`, then select **Install Plugin** |
| Codex App | Open **Plugins**, find **AI Everything** / `ai-everything`, then follow the in-app prompts |
| Cursor | Run `/add-plugin ai-everything` in Cursor Agent chat, or search the plugin marketplace |

Official references: [Claude Code plugins](https://code.claude.com/docs/en/discover-plugins.md), [Codex plugins](https://developers.openai.com/codex/plugins), [Cursor plugins](https://cursor.com/docs/plugins).

---

## Bundled resources

Slash commands are Markdown files under `commands/` (filename → `/name`). After `npm run deploy:cursor`, they are available in Cursor:

| Command | Source | Purpose |
| ------- | ------ | ------- |
| `/review` | `commands/review.md` | Pipeline: **test-helper** → **review-helper** → **doc-helper** |
| `/skiller` | `commands/skiller.md` | Create a skill with **skill-forge**, review with **skill-review** until no suggestions remain |

## Hook-injected guardrails

Use hooks for rules that should apply broadly, such as a project TypeScript style guide. Keep the related skill `description` narrow so the skill remains discoverable by explicit name without over-triggering on ordinary TypeScript work.

Recommended pattern: put reusable rules under `skills/<name>/references/`, inject a concise summary from `hooks/session-start`, add a Cursor `rules/` file when useful, and use lint/typecheck/scripts for mechanically checkable rules.

This avoids keyword-heavy descriptions for always-on constraints while keeping Codex, Cursor, Claude Code, and similar SDK-style harnesses aligned through the existing `SessionStart` branches.

Skills live under `skills/`; each folder contains `SKILL.md` plus optional `references/`:

| Skill | Role |
| ----- | ---- |
| `commit-helper` | Structured git commits |
| `clean-helper` | Evidence-first dead-code cleanup within a scoped area |
| `test-helper` | Implementation-first test rewrite (step 1 of `/review`) |
| `review-helper` | P0–P3 review loop (step 2 of `/review`) |
| `doc-helper` | Documentation from code (step 3 of `/review`) |
| `reviewer` | Orchestrates **test-helper** → **review-helper** → **doc-helper** (`/review`) |
| `skill-forge` | Create or update skills |
| `skill-review` | Audit skill quality (used in `/skiller`) |
| `skiller` | Orchestrates **skill-forge** → **skill-review** loop (`/skiller`) |
| `init-helper` | Scan the repo and generate or refresh root `AGENTS.md` |
| `designer` | Orchestrates **ui-ux-pro-max** + **frontend-design** for distinctive UI |
| `frontend-design` | Upstream-mirrored visual design guidance (`upgrade:design`) |
| `ui-ux-pro-max` | Upstream-mirrored UI/UX intelligence (`upgrade:design`) |
| `grilling` | Upstream-mirrored plan stress-test interviews (`upgrade:tool`) |

---

## Directory overview

| Path                                        | Role                                                         |
| ------------------------------------------- | ------------------------------------------------------------ |
| `package.json`                              | Single source of truth for published metadata and npm scripts |
| `scripts/build.mjs`                         | Syncs `package.json` into plugin JSON files                  |
| `scripts/deploy.mjs`                        | Symlinks `commands/`, `rules/`, `skills/` into harness dirs  |
| `scripts/upgrade-skill.mjs`                 | Syncs upstream skills via shallow Git sparse checkout        |
| `scripts/upgrade-skill-reporter.mjs`        | Terminal/CI reporter for parallel skill upgrades             |
| `commands/`                                 | Cursor slash-command prompt templates (Markdown)             |
| `rules/`                                    | Optional agent rules (deployed when present)                 |
| `skills/`                                   | Agent skills and deterministic workflow CLIs                 |
| `.cursor-plugin/plugin.json`                | Cursor plugin manifest                                       |
| `.codex-plugin/plugin.json`                 | Codex plugin manifest                                        |
| `.claude-plugin/plugin.json`                | Claude plugin manifest                                       |
| `.claude-plugin/marketplace.json`           | Claude marketplace definition (dev name `ai-everything-dev`) |
| `hooks/hooks-cursor.json`                   | Cursor hook wiring (e.g. `sessionStart`)                     |
| `hooks/session-start`, `hooks/run-hook.cmd` | SessionStart hook implementation (bash / Windows runner)     |

### SessionStart hook environment

`hooks/session-start` chooses the JSON shape for injected session context based on variables typically set by the host (you usually do not export these yourself):

| Variable             | When set (typical) | Effect on output                                                                       |
| -------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| `CURSOR_PLUGIN_ROOT` | Cursor             | Emits top-level `additional_context` (snake_case) for Cursor hooks.                    |
| `CLAUDE_PLUGIN_ROOT` | Claude Code        | With `COPILOT_CLI` unset, emits `hookSpecificOutput.additionalContext` for Claude.     |
| `COPILOT_CLI`        | Copilot CLI        | Emits top-level `additionalContext` (SDK-style) for Copilot CLI and similar harnesses. |

---

## License

MIT License — see [LICENSE](LICENSE).
