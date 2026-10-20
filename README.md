# AI Everything

**English** · [简体中文](README_CN.md)

**AI Everything** (package name `ai-everything`) is a plugin bundle for coding agents. It registers paths for **skills**, **commands**, **hooks**, and related assets across **Cursor**, **Codex**, and **Claude Code** so you can reuse one workflow toolkit in multiple harnesses.

---

## Requirements

- [Node.js](https://nodejs.org/) **22+** (ES modules; `scripts/*.mjs` use `import` and modern `fs` APIs)
- Skill upgrades default to Git shallow sparse checkout and require Git on `PATH`; use `--fetch` for HTTPS archive downloads.
- Before upgrading skills, run `npm install --ignore-scripts` to install the `tar` development dependency. Build and deploy scripts use only Node standard libraries.
- **Deploy on Windows**: Git Bash or another `bash` on `PATH` is only needed for hook scripts, not for `npm run deploy`

---

## Maintainer workflow

`package.json` is the single source of truth for published metadata. After changing it, run `npm run build` to sync `.cursor-plugin`, `.codex-plugin`, and `.claude-plugin`.

| Script | Equivalent CLI |
| ------ | -------------- |
| `npm run build` | `node scripts/build.mjs` |
| `npm run deploy:project -- <project dir> [--general \| --custom]` | `node scripts/deploy.mjs --project <project dir> [--general \| --custom]` |
| `npm run deploy:cursor` | `npm run deploy -- -t cursor` |
| `npm run deploy:codex` | `npm run deploy -- -t codex` |
| `npm run deploy:claude` | `npm run deploy -- -t claude` |
| `npm run deploy:qcode` | `npm run deploy -- -t qcode` |
| `npm run upgrade:skill` | `node scripts/upgrade-skill.mjs` |
| `npm run upgrade:design` | `node scripts/upgrade-skill.mjs --design` |
| `npm run upgrade:tool` | `node scripts/upgrade-skill.mjs --tool` |

```bash
# Link commands/rules/skills into a local harness folder
npm run deploy -- --type cursor --mode local

# General mode (default): link resources under the project's .agents folder
npm run deploy:project -- "D:/my project"

# Explicitly select general mode (same result)
npm run deploy:project -- "D:/my project" --general

# Custom mode: link resources directly under the project directory
npm run deploy:project -- "D:/my project" --custom
```

`deploy:project` requires one project directory. By default (or with `--general`), it links available `skills/`, `commands/`, and `rules/` under the project's `.agents/`, for example `D:/my project/.agents/skills`. With `--custom`, resources go directly under the project directory, for example `D:/my project/skills`. Mode flags may precede or follow the project path; `--general` and `--custom` are mutually exclusive. Relative paths resolve from the command's working directory; missing target directories are created. Existing content is preserved and identical links are skipped. Deployment creates links, so linked resources continue to refer to this repository.

`deploy` links existing resource directories into `~/.cursor`, `~/.claude`, or `~/.q-code` by default; for Codex it links only `skills/`. Missing directories are skipped. `--mode local` targets the current project folder. Use the double dash form when npm swallows flags.

`upgrade:skill` updates every configured upstream skill by default. Use `npm run upgrade:skill -- --skill <name>` to update one skill, `--design` for `frontend-design` and `ui-ux-pro-max`, or `--tool` for `grilling` and `hatch-pet`. When `--skill` is present, group flags are ignored. `upgrade:design` and `upgrade:tool` are shortcuts for their corresponding groups. Omitting transport flags is equivalent to `--git`; use `--fetch` for HTTPS archive downloads. These flags are mutually exclusive and may appear before or after selection flags; they do not change which skills are selected.

```bash
npm run upgrade:skill                                      # Git (default)
npm run upgrade:skill -- --fetch                           # explicit fetch
npm run upgrade:skill -- --git                             # Git
npm run upgrade:skill -- --git --skill frontend-design     # Git: one skill
npm run upgrade:skill -- --design --git                    # Git: design group
```

When multiple skills run concurrently, interactive terminals show an independent rolling detail block for each skill. CI and redirected output automatically use append-only lines prefixed with the skill name.

`SKILL_SOURCES` in `scripts/upgrade-skill.mjs` uses `{ skill, repo, path, groups }`: `repo` is the repository root URL and `path` is the relative skill directory. Help displays `<repo>/tree/main/<path>`; downloads use either the branch archive or Git checkout described below. The progress reporter reads `repo` from the same source configuration. Upgrade regression tests run both full CLI paths in temporary projects using offline archives and a real local Git repository.

Both downloaders feed the same strict-mirror flow: staging, byte comparison, directory replacement, rollback, reporting, and cleanup. With `--fetch`, built-in `fetch` streams `<repo>/archive/refs/heads/main.tar.gz` to disk, and npm `tar` validates the archive and extracts only the target skill directory; each skill downloads a full repository source snapshot with a 60-second download timeout. By default (or with `--git`), Git performs a depth-1 partial clone and sparse checkout, then copies the target skill into the same staging directory. Neither mode calls GitHub API or requires an API token, and failures do not switch downloaders automatically. Both require an upstream `SKILL.md`; download/validation failures preserve the existing local skill. Temporary archives and checkouts are cleaned after the run. `U` means a new local file, `M` means the upstream bytes changed, and `D` means an upstream deletion; unchanged files are not listed.

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

`commands/` is absent in this checkout, so deployment currently provides no slash commands from this repository. The deploy script skips missing resource directories.

## SessionStart hook

`hooks/session-start` reads `skills/using-ai-everything/SKILL.md` and emits host-specific JSON. That skill file is absent in this checkout, so the hook currently embeds an error fallback instead of skill instructions. A legacy skills directory also adds a migration warning.

Skills live under `skills/`; each folder contains `SKILL.md` plus optional `references/`:

| Skill | Role |
| ----- | ---- |
| `commit-helper` | Structured git commits |
| `clean-helper` | Evidence-first dead-code cleanup within a scoped area |
| `test-helper` | Implementation-first test rewrite (step 1 of `/review`) |
| `review-helper` | P0–P3 review loop (step 2 of `/review`) |
| `doc-helper` | Scoped documentation from code; preserves existing language and verifies evidence (step 3 of `/review`) |
| `reviewer` | Orchestrates **test-helper** → **review-helper** → **doc-helper** (`/review`) |
| `skill-forge` | Create or update skills |
| `skill-review` | Audit skill quality (used in `/skiller`) |
| `skiller` | Orchestrates **skill-forge** → **skill-review** loop (`/skiller`) |
| `domain-modeling` | Sharpen project terminology and domain decisions |
| `init-helper` | Scan the repo and generate or refresh root `AGENTS.md` |
| `agent-creator` | Create or incrementally update a project task Agent at `.agents/skills/agent-<name>/SKILL.md`; requires separately installed `grilling`, with supporting tools under the project root's `scripts/` |
| `grilling-with-docs` | Interview, clarify domain language, and write agreed deliverables |
| `designer` | Orchestrates **ui-ux-pro-max** + **frontend-design** for distinctive UI |
| `frontend-design` | Upstream-mirrored visual design guidance (`upgrade:design`) |
| `ui-ux-pro-max` | Upstream-mirrored UI/UX intelligence (`upgrade:design`) |
| `grilling` | Upstream-mirrored plan stress-test interviews (`upgrade:tool`) |
| `hatch-pet` | Upstream-mirrored creation, validation, and packaging of Codex animated pets (`upgrade:tool`; uses installed `imagegen` for visual generation) |

`skill-forge`, `domain-modeling`, `frontend-design`, `ui-ux-pro-max`, `grilling`, and `hatch-pet` are upstream mirrors ignored by Git; run `npm run upgrade:skill` to fetch them in a fresh checkout.

### Project Agent generation

Use `agent-creator` with a name and requirement, for example: "Create config-check; validate project configuration and report errors without modifying it." If the name is missing, it is the first decision clarified through the installed `grilling` skill. The generator investigates the project, confirms the task contract, then creates or incrementally updates `.agents/skills/agent-<name>/SKILL.md` and any necessary references. Supporting scripts default to the target project root's `scripts/`; the Skill documents their invocation. It does not generate `AGENTS.md` as its primary output; use `init-helper` for that task.

`grilling` must be installed and loadable in the current session. If absent, fetch it with `npm run upgrade:skill -- --skill grilling`, then install/deploy it for your harness and make it available to the session. The generator stops when this required dependency cannot be loaded; it does not embed an interview substitute or install dependencies automatically. Generated Agents may declare additional required or optional Skill dependencies.

The generator extracts each task step's inputs, decisions, actions, outputs, acceptance criteria, and failure handling, then maps confirmed requirements to verification cases. Generation includes isolated verification, not execution of the Agent's real business task. The `.agents/skills/agent-<name>/` layout does not guarantee host auto-discovery: invoke it by asking the host to read and follow its explicit `SKILL.md` path when needed. Project scripts and external dependencies must accompany any migration. Local maintainer scenarios may be kept in `skills/agent-creator/test-prompts.json`, which is excluded from Git. If absent, prepare cases from the confirmed task contracts; the inventory describes behavioral checks, not an automated test runner.

---

## Directory overview

| Path                                        | Role                                                         |
| ------------------------------------------- | ------------------------------------------------------------ |
| `package.json`                              | Single source of truth for published metadata and npm scripts |
| `scripts/build.mjs`                         | Syncs `package.json` into plugin JSON files                  |
| `scripts/deploy.mjs`                        | Symlinks `commands/`, `rules/`, `skills/` into harness dirs  |
| `scripts/upgrade-skill.mjs`                 | Syncs upstream skills via fetch or optional Git checkout             |
| `scripts/upgrade-skill-reporter.mjs`        | Terminal/CI reporter for parallel skill upgrades             |
| `commands/`                                 | Optional slash-command templates (currently absent)          |
| `rules/`                                    | Optional agent rules (currently absent)                      |
| `skills/`                                   | Agent skills and deterministic workflow CLIs                 |
| `.cursor-plugin/plugin.json`                | Cursor plugin manifest                                       |
| `.codex-plugin/plugin.json`                 | Codex plugin manifest                                        |
| `.claude-plugin/plugin.json`                | Claude plugin manifest                                       |
| `.claude-plugin/marketplace.json`           | Claude marketplace definition (`ai-everything-marketplace`)  |
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
