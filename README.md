# AI Everything

**English** · [简体中文](README_CN.md)

**AI Everything** (package name `ai-everything`) is a plugin bundle for coding agents. It registers paths for **skills**, **commands**, **hooks**, and related assets across **Cursor**, **Codex**, and **Claude Code** so you can reuse one workflow toolkit in multiple harnesses.

---

## Requirements

- [Node.js](https://nodejs.org/) **22+** (ES modules; `scripts/*.mjs` use `import` and modern `fs` APIs)
- Skill and rule upgrades default to Git shallow sparse checkout and require Git on `PATH`; use `--fetch` for HTTPS archive downloads.
- Default `--git` upgrades do not load `tar`. `--fetch` loads that development dependency only when extracting an archive; install it with `npm install --ignore-scripts` before using `--fetch`. Build and deploy scripts use only Node standard libraries. A regular install also runs `prepare` → `init:darwin` (`npx skills add alchaincyf/darwin-skill`); use `npm run init:darwin` separately when that skill is wanted.
- **Deploy on Windows**: Git Bash or another `bash` on `PATH` is only needed for hook scripts, not for `npm run deploy`

---

## Maintainer workflow

`package.json` is the single source of truth for published metadata. After changing it, run `npm run build` to sync `.cursor-plugin`, `.codex-plugin`, and `.claude-plugin`.

| Script | Equivalent CLI |
| ------ | -------------- |
| `npm run build` | `node scripts/build.mjs` |
| `npm run deploy:project <project dir>` | `npm run deploy -t project <project dir>` |
| `npm run deploy:cursor` | `npm run deploy -- -t cursor` |
| `npm run deploy:codex` | `npm run deploy -- -t codex` |
| `npm run deploy:claude` | `npm run deploy -- -t claude` |
| `npm run deploy:qcode` | `npm run deploy -- -t qcode` |
| `npm run deploy:agent` | `npm run deploy -- -t agent` |
| `npm run upgrade:skill` | `node scripts/upgrade-skill.mjs` |
| `npm run upgrade:rule` | `node scripts/upgrade-rule.mjs` |
| `npm run upgrade:design` | `node scripts/upgrade-skill.mjs --design` |
| `npm run init:darwin` | `npx skills add alchaincyf/darwin-skill` |

```bash
# Link commands/rules/skills into a local harness folder
npm run deploy -- --type cursor --mode local

# Link resources directly under a project directory
npm run deploy:project "D:/my project"
```

`deploy:project` runs `npm run deploy -t project` and requires one project directory: `npm run deploy:project <project dir>`. It links available `skills/`, `commands/`, and `rules/` directly under that directory, for example `D:/my project/skills`. Relative paths resolve from the command's working directory; missing target directories are created. Existing content is preserved and identical links are skipped. Deployment creates links, so linked resources continue to refer to this repository. User-level `~/.agents/` is `npm run deploy:agent`.

`deploy` links existing resource directories into `~/.cursor`, `~/.codex`, `~/.claude`, `~/.q-code`, or `~/.agents` by default. Codex links only `skills/`. `agent` uses the same resources as Cursor and writes them under `~/.agents/` (for example `~/.agents/skills`). Missing directories are skipped. `--mode local` uses the corresponding directory under the current working directory (for example `.cursor/` or `.agents/`). These commands deploy resource links, not plugin manifests or hooks. Use the double dash form when npm swallows flags.

`upgrade:skill` updates all 14 configured upstream skills by default. Repeat `--skill <name>` to select specific skills; named selections override valid group flags. Multiple group flags select their union. `upgrade:design` is the shortcut for `--design`. Omitting transport flags is equivalent to `--git`; `--fetch` downloads the HTTPS branch archive for each selected skill's `ref`. The two transport flags are mutually exclusive and do not affect skill selection.

| Selection | Upstream skills |
| --------- | --------------- |
| `--pet` | `hatch-pet` |
| `--skill skill-forge` | `skill-forge` |
| `--mattpocock` | `grilling`, `domain-modeling`, `writing-for-agents` |
| `--design` | `frontend-design`, `ui-ux-pro-max` |
| `--superpower` | `brainstorming`, `writing-plans`, `test-driven-development`, `systematic-debugging`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion` |

**Current CLI limitations:** `package.json` and CLI help still advertise `upgrade:tool`, but its `--tool` flag fails with `Unknown argument: --tool`. To update the former pair, use `npm run upgrade:skill -- --skill grilling --skill hatch-pet`. Help also lists a `--skill` group flag that collides with the named-skill option; use `--skill skill-forge` explicitly.

```bash
npm run upgrade:skill                                      # Git (default)
npm run upgrade:skill -- --fetch                           # explicit fetch
npm run upgrade:skill -- --git --skill frontend-design     # Git: one skill
npm run upgrade:skill -- --design --pet                    # union of two groups
npm run upgrade:skill -- --superpower                     # Superpowers group
```

When multiple skills run concurrently, interactive terminals show an independent detail block for each skill: live updates may roll when space is tight, but finished panels keep every `U`/`M`/`D` file line. CI and redirected output automatically use append-only lines prefixed with the skill name. Shared download work directories under `.archives-upgrade-*` / `.repositories-upgrade-*` are named by repository (`owner-repo`); a ref other than `main` is appended.

[`SKILL_SOURCES`](scripts/upgrade-skill.mjs) defines `{ skill, repo, path, ref, groups }`. `ref` is the branch to download; every configured skill currently uses `main`. Help displays `<repo>/tree/<ref>/<path>`. Downloads read `repo`, `path`, and `ref` directly and group selected paths by repository and ref. The reporter uses the configured `repo`.

[`RULE_SOURCES`](scripts/upgrade-rule.mjs) defines `{ rule, repo, path, ref, groups }` and uses the same transports. `npm run upgrade:rule` writes each selected rule to `rules/<name>/`. Download and reporting are shared by [`common-download.mjs`](scripts/common-download.mjs) and [`common-report.mjs`](scripts/common-report.mjs). The rule catalog is empty until entries are added; an empty catalog exits because no rules are selected, and does not create `rules/`. A rule path must be a directory. Rules do not require `SKILL.md` and do not strip `superpowers:`.

```text
selected skills → group by repository + ref
                  ├─ --git (default): one shallow clone + sparse checkout
                  └─ --fetch: one archive download per repository and ref
                → per-skill staging → post-processing → byte comparison
                → mirror replacement / rollback → report → cleanup
```

`--fetch` uses the configured `ref`. Built-in `fetch` downloads `<repo>/archive/refs/heads/<ref>.tar.gz` (60-second timeout), then `tar` validates and extracts each selected path. The same repository on another `ref` is a separate download. Git uses that same `ref` for one depth-1 partial clone and one sparse checkout covering the group's selected paths. Both require an upstream `SKILL.md`; neither calls GitHub API, requires an API token, or automatically switches downloaders on failure.

For the `superpower` group, post-processing recursively removes every literal `superpowers:` from `*.md` before comparison. Download, validation, or post-processing failures preserve existing local skills; a missing path fails only that skill. Shared downloads/checkouts are cleaned after all consumers settle. Successful updates mirror upstream content, including deletions, so local edits to mirrored skills may be replaced. `U` means a new local file, `M` changed content, and `D` an upstream deletion; unchanged files are omitted.

### Verification

Run from the repository root:

```bash
node --test scripts/deploy.test.mjs
node --test scripts/upgrade-skill.test.mjs scripts/upgrade-rule.test.mjs
```

These suites use temporary projects; upgrade tests use offline archives and local Git repositories. After deployment changes, also exercise `npm run deploy:project "<temporary project>"` for existing-content protection and repeat runs. Skill behavior scenarios in `skills/**/test-prompts.json` are local, Git-ignored inventories, not automated test runners. See [AGENTS.md](AGENTS.md) for scoped regression requirements.

---

## Installation

**Each harness has its own install flow.** This repository contains the following manifests and local deployment shortcuts; the manifests alone do not establish availability in an official marketplace.

| Harness | Repository manifest | Local resource deployment |
| ------- | ------------------- | ------------------------- |
| Claude Code | `.claude-plugin/plugin.json`; marketplace name: `ai-everything-marketplace` | `npm run deploy:claude` |
| Codex | `.codex-plugin/plugin.json` | `npm run deploy:codex` |
| Cursor | `.cursor-plugin/plugin.json` | `npm run deploy:cursor` |
| QCode | No plugin manifest | `npm run deploy:qcode` |
| `~/.agents` | No plugin manifest | `npm run deploy:agent` |

Official references: [Claude Code plugins](https://code.claude.com/docs/en/discover-plugins.md), [Codex plugins](https://developers.openai.com/codex/plugins), [Cursor plugins](https://cursor.com/docs/plugins).

---

## Bundled resources

`commands/` and `rules/` are absent in this checkout. The deploy script skips missing resource directories. Invoke skills by their installed names or explicit `SKILL.md` paths; this repository does not define `/review` or `/skiller` command aliases.

Skills live under `skills/`; each folder contains `SKILL.md` plus optional `references/`:

| Skill | Role |
| ----- | ---- |
| `commit-helper` | Read-only summaries/drafts or scoped Git commits, including selected staged paths; preserves unrelated index content and uses literal-safe UTF-8 messages |
| `clean-helper` | Scoped cleanup with a default `.review/clean-{timestamp}.md` audit trail; reuses authorization/report paths, honors strict no-write requests, and preserves regressions/user edits during local recovery |
| `test-helper` | Repair stale tests or add requested coverage; preserve regressions, scoped prerequisites and cleanup on failure, and report unverified work |
| `review-helper` | Scoped P0–P3 review and repair; preserves user changes, verifies the reviewed snapshot in isolation when needed, and reports blockers |
| `doc-helper` | Scoped documentation from code; preserves language, verifies evidence, and distinguishes throws, rejections, and error fallbacks |
| `reviewer` | Orchestrates installed **test-helper** → **review-helper** → **doc-helper** |
| `skill-forge` | Create or update skills |
| `skill-review` | Audit skill quality (used by `skiller`) |
| `skiller` | Runs installed **skill-forge** once, then repeats **skill-review** → fixes until no suggestions remain |
| `domain-modeling` | Sharpen project terminology and domain decisions |
| `agenter` | Generate or incrementally update `AGENTS.md` and task-triggered domain guides; applies installed `writing-for-agents` during planning, drafting, and acceptance |
| `agent-creator` | Create or incrementally update a project task Agent at `.agents/skills/agent-<name>/SKILL.md`; requires separately installed `grilling`, with supporting tools under the project root's `scripts/` |
| `grilling-with-docs` | Clarify requirements and update agreed targets while preserving unrelated content; distinguish explicit full replacement, recover unreadable sources, load installed dependencies across runtimes, and reuse root `GLOSSARY.md` |
| `designer` | Orchestrates **ui-ux-pro-max** + **frontend-design** for distinctive UI |
| `frontend-design` | Upstream-mirrored visual design guidance (`upgrade:design`) |
| `ui-ux-pro-max` | Upstream-mirrored UI/UX intelligence (`upgrade:design`) |
| `grilling` | Upstream-mirrored plan stress-test interviews (`--mattpocock`) |
| `writing-for-agents` | Upstream-mirrored guidance for agent-facing documents (`--mattpocock`) |
| `hatch-pet` | Upstream-mirrored creation, validation, and packaging of Codex animated pets (`--pet`; uses installed `imagegen` for visual generation) |
| Superpowers group | Seven upstream skills for planning, testing, debugging, review, and verification; names are listed in the selection table above (`--superpower`) |

All 14 skills in the upstream selection table are mirrors ignored by Git; run `npm run upgrade:skill` to fetch them in a fresh checkout. Other skills are maintained in this repository. Having files locally does not make dependencies callable in the current session: orchestrators resolve their dependencies from the session's registered entries.

### Repository agent instructions

Invoking `agenter` without arguments authorizes scanning the current workspace and creating or incrementally refreshing root `AGENTS.md`, plus necessary linked guides under `docs/agents/`. Explicit scoped or read-only instructions take precedence. It requires separately installed `writing-for-agents`.

```text
Discover → Plan → Resolve authorization → Draft/write → Verify
             ↑                                ↑           ↑
             └──────── writing-for-agents ─────┴───────────┘
```

The workflow loads the registered writing skill once and applies it at three checkpoints. It accounts for root and discovered first-party member sources, preserves existing constraints and later edits, and reports one status: 完成 (complete), 完成但存在缺口 (complete with gaps), or 阻塞 (blocked). Missing dependencies or failed required writes/checks block completion; optional gaps do not trigger a questionnaire. Root instructions default to 200 lines; preserving pre-existing excess outside scope is a disclosed gap, not permission to rewrite unrelated content. Maintainer scenarios live in `skills/agenter/references/acceptance-scenarios.md`; they describe checks, not automatic proof of a pass.

### Project Agent generation

Use `agent-creator` with a name and requirement, for example: "Create config-check; validate project configuration and report errors without modifying it." If the name is missing, it is the first decision clarified through the installed `grilling` skill. The generator investigates the project, confirms the task contract, then creates or incrementally updates `.agents/skills/agent-<name>/SKILL.md` and any necessary references. Supporting scripts default to the target project root's `scripts/`; the Skill documents their invocation. It does not generate `AGENTS.md` as its primary output; use `agenter` for that task.

`grilling` must be installed and loadable in the current session. If absent, fetch it with `npm run upgrade:skill -- --skill grilling`, then install/deploy it for your harness and make it available to the session. The generator stops when this required dependency cannot be loaded; it does not embed an interview substitute or install dependencies automatically. Generated Agents may declare additional required or optional Skill dependencies.

The generator extracts each task step's inputs, decisions, actions, outputs, acceptance criteria, and failure handling, then maps confirmed requirements to verification cases. Generation includes isolated verification, not execution of the Agent's real business task. The `.agents/skills/agent-<name>/` layout does not guarantee host auto-discovery: invoke it by asking the host to read and follow its explicit `SKILL.md` path when needed. Project scripts and external dependencies must accompany any migration. Local maintainer scenarios may be kept in `skills/agent-creator/test-prompts.json`, which is excluded from Git. If absent, prepare cases from the confirmed task contracts; the inventory describes behavioral checks, not an automated test runner.

---

## Directory overview

| Path                                        | Role                                                         |
| ------------------------------------------- | ------------------------------------------------------------ |
| `package.json`                              | Single source of truth for published metadata and npm scripts |
| `scripts/build.mjs`                         | Syncs `package.json` into plugin JSON files                  |
| `scripts/deploy.mjs`                        | Symlinks `commands/`, `rules/`, `skills/` into harness dirs  |
| `scripts/upgrade-skill.mjs`                 | Syncs upstream skills via the shared downloader               |
| `scripts/upgrade-rule.mjs`                  | Syncs `RULE_SOURCES` into `rules/<name>/`                     |
| `scripts/common-download.mjs`               | Shared Git/`--fetch` download, mirror swap, and CLI helpers  |
| `scripts/common-report.mjs`                 | Terminal/CI reporter for parallel skill and rule upgrades    |
| `commands/`                                 | Optional slash-command templates (currently absent)          |
| `rules/`                                    | Optional agent rules (currently absent)                      |
| `skills/`                                   | Tracked skills and Git-ignored upstream mirrors              |
| `.cursor-plugin/plugin.json`                | Cursor plugin manifest                                       |
| `.codex-plugin/plugin.json`                 | Codex plugin manifest                                        |
| `.claude-plugin/plugin.json`                | Claude plugin manifest                                       |
| `.claude-plugin/marketplace.json`           | Claude marketplace definition (`ai-everything-marketplace`)  |
| `hooks/hooks-cursor.json`                   | Cursor hook wiring (e.g. `sessionStart`)                     |
| `hooks/hooks.json`                          | Claude Code `SessionStart` hook wiring                       |
| `hooks/session-start`, `hooks/run-hook.cmd` | SessionStart hook implementation (bash / Windows runner)     |

### SessionStart hook environment

`hooks/session-start` reads `skills/using-ai-everything/SKILL.md` and emits host-specific JSON. That skill file is absent in this checkout, so the hook embeds an error fallback. A legacy directory at `~/.config/ai-everything/skills` adds a migration warning.

`hooks/session-start` chooses the JSON shape for injected session context based on variables typically set by the host (you usually do not export these yourself):

| Variable             | When set (typical) | Effect on output                                                                       |
| -------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| `CURSOR_PLUGIN_ROOT` | Cursor             | Emits top-level `additional_context` (snake_case) for Cursor hooks.                    |
| `CLAUDE_PLUGIN_ROOT` | Claude Code        | With `COPILOT_CLI` unset, emits `hookSpecificOutput.additionalContext` for Claude.     |
| `COPILOT_CLI`        | Copilot CLI        | Emits top-level `additionalContext` (SDK-style) for Copilot CLI and similar harnesses. |

---

## License

MIT License — see [LICENSE](LICENSE).
