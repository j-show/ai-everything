# AI Everything

**English** · [简体中文](README_CN.md)

**AI Everything** (package name `ai-everything`) is a plugin bundle for coding agents. It registers paths for **skills**, **commands**, **hooks**, and related assets across **Cursor**, **Codex**, and **Claude Code** so you can reuse one workflow toolkit in multiple harnesses.

---

## Requirements

- [Node.js](https://nodejs.org/) **18+** (ES modules; `scripts/*.mjs` use `import` and modern `fs` APIs)
- No `npm install` required for maintainer scripts (stdlib only)
- **Deploy on Windows**: Git Bash or another `bash` on `PATH` is only needed for hook scripts, not for `npm run deploy`

---

## Maintainer workflow

### Sync plugin metadata (`build`)

1. Edit fields in the root `package.json` (including `author`, `displayName`, `shortDescription` used by Codex and Cursor manifests).
2. From the repository root:

   ```bash
   npm run build
   ```

3. Commit the updated plugin JSON files together with `package.json` so published manifests stay consistent.

`build` writes normalized JSON to `.cursor-plugin`, `.codex-plugin`, and `.claude-plugin` from a single source of truth. See JSDoc in [`scripts/build.mjs`](scripts/build.mjs).

### Symlink resources into a harness (`deploy`)

For local development, link this repo’s `commands/`, `rules/`, and `skills/` into a harness config directory:

| Script | Equivalent CLI |
| ------ | -------------- |
| `npm run deploy:cursor` | `npm run deploy -t cursor` |
| `npm run deploy:codex` | `npm run deploy -t codex` |
| `npm run deploy:claude` | `npm run deploy -t claude` |

**Options** (see [`scripts/deploy.mjs`](scripts/deploy.mjs)):

| Flag | Values | Default | Meaning |
| ---- | ------ | ------- | ------- |
| `-t`, `--type` | `cursor`, `codex`, `claude` | _(required)_ | Target harness |
| `-m`, `--mode` | `user`, `local` | `user` | `user` → `~/.cursor` (etc.); `local` → `./.cursor` under current cwd |

Examples:

```bash
# User-wide Cursor config (links into ~/.cursor/commands, etc.)
npm run deploy:cursor

# Project-local harness folder
npm run deploy -- --type cursor --mode local

# Direct node invocation
node scripts/deploy.mjs --type codex --mode user
```

If npm swallows flags, pass a double dash: `npm run deploy -- --type cursor`.

**Behavior**: Creates symlinks (Windows directories use junctions; file symlinks may fall back to hard links on `EPERM`). Skips paths already linked to this repo; warns and skips when a non-link file or directory already exists.

---

## What’s inside (overview)

Paths are defined in each harness’s plugin manifest. This repo currently uses:

| Kind                        | Path (relative to plugin root) |
| --------------------------- | ------------------------------ |
| Skills                      | `./skills/`                    |
| Agents (Cursor)             | `./agents/`                    |
| Commands (Cursor)           | `./commands/`                  |
| Hooks (Cursor)              | `./hooks/hooks-cursor.json`    |
| Skills (Codex plugin field) | `./skills/`                    |

Metadata (name, version, description, author, homepage, etc.) is sourced from the root `package.json`. After edits, run `npm run build` to sync into JSON under `.cursor-plugin`, `.codex-plugin`, and `.claude-plugin`.

---

## Installation

**Each harness has its own install flow.** If you use more than one of Claude Code, Codex, and Cursor, install this plugin **separately** in each product.

### Claude Code

Official reference: [Discover and install plugins](https://code.claude.com/docs/en/discover-plugins.md) and [Create and distribute a plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces).

#### Official Marketplace

- Install the plugin from Anthropic's official marketplace:

  ```bash
  /plugin install ai-everything@claude-plugins-official
  ```

#### Custom Marketplace

The custom marketplace provides AI Everything and some other related plugins for Claude Code.

- Register the marketplace:

  ```bash
  /plugin marketplace add jshow-marketplace
  ```

- Install the plugin from this marketplace:

  ```bash
  /plugin install ai-everything@jshow-marketplace
  ```

### Codex CLI

AI Everything is available via the [official Codex plugin marketplace](https://github.com/openai/plugins).

- Open the plugin search interface:

  ```bash
  /plugins
  ```

- Search for AI Everything:

  ```bash
  ai-everything
  ```

- Select `Install Plugin`.

### Codex App

Official reference: [Plugins – Codex](https://developers.openai.com/codex/plugins).

1. Open **Plugins** in the app sidebar.
2. Find **AI Everything** / **`ai-everything`** in the list or marketplace.
3. Complete installation using the in-app prompts.

### Cursor

Official reference: [Plugins | Cursor Docs](https://cursor.com/docs/plugins).

- In Cursor Agent chat, install from marketplace:

  ```text
  /add-plugin ai-everything
  ```

- Or search for "ai-everything" in the plugin marketplace.

---

## Commands library

Slash commands live under `commands/` (Markdown prompts). After `npm run deploy:cursor`, they are available in Cursor as:

| Command   | Purpose |
| --------- | ------- |
| `/commit` | Summarize changes into a commit message and create a git commit |
| `/doc`    | Add JSDoc, key-step comments, and README content from the implementation |
| `/review` | Review code in a loop, suggest fixes, and apply until no further suggestions |
| `/test`   | Inspect implementation and rewrite tests for a directory or the full suite |

---

## Directory overview

| Path                                        | Role                                                         |
| ------------------------------------------- | ------------------------------------------------------------ |
| `package.json`                              | Single source of truth for published metadata and npm scripts |
| `scripts/build.mjs`                         | Syncs `package.json` into plugin JSON files                  |
| `scripts/deploy.mjs`                        | Symlinks `commands/`, `rules/`, `skills/` into harness dirs  |
| `commands/`                                 | Cursor slash-command prompt templates (Markdown)             |
| `rules/`                                    | Optional agent rules (deployed when present)                 |
| `skills/`                                   | Skill folders referenced by manifests                        |
| `.cursor-plugin/plugin.json`                | Cursor plugin manifest                                       |
| `.codex-plugin/plugin.json`                 | Codex plugin manifest                                        |
| `.claude-plugin/plugin.json`                | Claude plugin manifest                                       |
| `.claude-plugin/marketplace.json`           | Claude marketplace definition (dev name `ai-everything-dev`) |
| `hooks/hooks-cursor.json`                   | Cursor hook wiring (e.g. `sessionStart`)                     |
| `hooks/session-start`, `hooks/run-hook.cmd` | SessionStart hook implementation (bash / Windows runner)     |

### SessionStart hook environment

`hooks/session-start` chooses the JSON shape for injected session context based on variables typically set by the host (not something you usually export by hand):

| Variable             | When set (typical) | Effect on output                                                                       |
| -------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| `CURSOR_PLUGIN_ROOT` | Cursor             | Emits top-level `additional_context` (snake_case) for Cursor hooks.                    |
| `CLAUDE_PLUGIN_ROOT` | Claude Code        | With `COPILOT_CLI` unset, emits `hookSpecificOutput.additionalContext` for Claude.     |
| `COPILOT_CLI`        | Copilot CLI        | Emits top-level `additionalContext` (SDK-style) for Copilot CLI and similar harnesses. |

---

## License

MIT License — see [LICENSE](LICENSE).
