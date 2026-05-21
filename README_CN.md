# AI Everything

**简体中文** · [English](README.md)

**AI Everything**（包名 `ai-everything`）是一套面向编码代理的插件资源：在 **Cursor**、**Codex**、**Claude Code** 等 harness 中注册技能（skills）、命令（commands）、钩子（hooks）等路径，用于统一你的工作流自动化能力。

---

## 环境要求

- [Node.js](https://nodejs.org/) **18+**（ES 模块；`scripts/*.mjs` 使用 `import` 与现代 `fs` API）
- 维护脚本无需 `npm install`（仅使用 Node 标准库）
- **在 Windows 上部署**：钩子脚本需要 Git Bash 或其它 `bash`；`npm run deploy` 本身不依赖 bash

---

## 维护者工作流

### 同步插件元数据（`build`）

1. 编辑根目录 `package.json` 中的字段（含 Codex/Cursor 清单会用到的 `author`、`displayName`、`shortDescription`）。
2. 在仓库根目录执行：

   ```bash
   npm run build
   ```

3. 将更新后的各 harness 插件 JSON 与 `package.json` 一并提交，保证发布清单一致。

`build` 以根目录 `package.json` 为单一事实来源，写入 `.cursor-plugin`、`.codex-plugin`、`.claude-plugin`。细节见 [`scripts/build.mjs`](scripts/build.mjs) 中的 JSDoc。

### 将资源符号链接到 harness（`deploy`）

本地开发时，可将本仓库的 `commands/`、`rules/`、`skills/` 链接到对应 harness 配置目录：

| 脚本 | 等价命令 |
| ---- | -------- |
| `npm run deploy:cursor` | `npm run deploy -t cursor` |
| `npm run deploy:codex` | `npm run deploy -t codex` |
| `npm run deploy:claude` | `npm run deploy -t claude` |

**参数**（详见 [`scripts/deploy.mjs`](scripts/deploy.mjs)）：

| 参数 | 取值 | 默认 | 含义 |
| ---- | ---- | ---- | ---- |
| `-t`, `--type` | `cursor`、`codex`、`claude` | 必填 | 目标 harness |
| `-m`, `--mode` | `user`、`local` | `user` | `user` → 用户主目录下的 `~/.cursor` 等；`local` → 当前工作目录下的 `./.cursor` 等 |

示例：

```bash
# 用户级 Cursor 配置（链接到 ~/.cursor/commands 等）
npm run deploy:cursor

# 仅当前项目目录下的 harness 文件夹
npm run deploy -- --type cursor --mode local

# 直接调用 Node
node scripts/deploy.mjs --type codex --mode user
```

若 npm 吞掉参数，请使用双横线：`npm run deploy -- --type cursor`。

**行为说明**：创建符号链接（Windows 目录使用 junction；文件在 `EPERM` 时可能回退为硬链接）。已指向本仓库的路径会跳过；若目标已存在且不是链接，则警告并跳过。

---

## 内含能力（概览）

实际加载路径由各 harness 的插件清单决定，当前仓库约定为：

| 类型                     | 路径（相对插件根）          |
| ------------------------ | --------------------------- |
| Skills                   | `./skills/`                 |
| Agents（Cursor）         | `./agents/`                 |
| Commands（Cursor）       | `./commands/`               |
| Hooks（Cursor）          | `./hooks/hooks-cursor.json` |
| Skills（Codex 插件字段） | `./skills/`                 |

元数据（名称、版本、描述、作者、主页等）以根目录 `package.json` 为准；修改后请执行 `npm run build` 同步到 `.cursor-plugin`、`.codex-plugin`、`.claude-plugin` 下的 JSON。

---

## 安装

**不同 harness 的安装方式不同。** 若你同时使用 Claude Code、Codex、Cursor，需要在各自产品里**分别**完成安装。

### Claude Code

官方说明：[发现与安装插件](https://code.claude.com/docs/en/discover-plugins.md)、[创建与分发插件市场](https://code.claude.com/docs/en/plugin-marketplaces)。

#### 官方市场

- 从 Anthropic 官方市场安装插件：

  ```bash
  /plugin install ai-everything@claude-plugins-official
  ```

#### 自定义市场

自定义市场提供 AI Everything 及若干相关插件，供 Claude Code 使用。

- 注册市场：

  ```bash
  /plugin marketplace add jshow-marketplace
  ```

- 从该市场安装插件：

  ```bash
  /plugin install ai-everything@jshow-marketplace
  ```

### Codex CLI

AI Everything 可通过 [Codex 官方插件市场](https://github.com/openai/plugins) 获取。

- 打开插件搜索界面：

  ```bash
  /plugins
  ```

- 搜索 AI Everything：

  ```bash
  ai-everything
  ```

- 选择 **安装插件（Install Plugin）**。

### Codex App

官方说明：[Plugins – Codex](https://developers.openai.com/codex/plugins)。

1. 在应用中打开侧栏 **Plugins（插件）**。
2. 在列表或市场中找到 **AI Everything** / **`ai-everything`**。
3. 按界面提示完成安装。

### Cursor

官方说明：[Plugins | Cursor 文档](https://cursor.com/docs/plugins)。

- 在 Cursor Agent 对话中，从市场安装：

  ```text
  /add-plugin ai-everything
  ```

- 或在插件市场中搜索 **「ai-everything」**。

---

## 命令库

斜杠命令为 `commands/` 下的 Markdown 文件（文件名即 `/命令名`）。执行 `npm run deploy:cursor` 后可在 Cursor 中使用：

| 命令 | 源文件 | 说明 |
| ---- | ------ | ---- |
| `/review` | `commands/review.md` | 流水线：**test-helper** → **review-helper** → **doc-helper** |
| `/skiller` | `commands/skiller.md` | 用 **skill-forge** 创建技能，**skill-review** 审查至无建议 |

## 内置技能

技能位于 `skills/`，安装到代理后自动加载（市场或 `npm run deploy`）。每目录含 `SKILL.md` 与可选 `references/`：

| 技能 | 作用 |
| ---- | ---- |
| `commit-helper` | 结构化 git 提交 |
| `doc-helper` | 从代码补文档（用于 `/review` 第三步） |
| `test-helper` | 以实现为准重写测试（用于 `/review` 第一步） |
| `review-helper` | P0–P3 审查闭环（用于 `/review` 第二步） |
| `skill-forge` | 创建或更新技能 |
| `skill-review` | 审查技能质量（用于 `/skiller`） |

---

## 目录速览

| 路径                                        | 说明                                                     |
| ------------------------------------------- | -------------------------------------------------------- |
| `package.json`                              | 对外展示信息与 npm 脚本的单一来源                         |
| `scripts/build.mjs`                         | 将 `package.json` 同步到各插件 JSON                      |
| `scripts/deploy.mjs`                        | 将 `commands/`、`rules/`、`skills/` 符号链接到 harness 目录 |
| `commands/`                                 | Cursor 斜杠命令提示模板（Markdown）                      |
| `rules/`                                    | 可选的代理规则（存在时由 deploy 同步）                   |
| `skills/`                                   | 代理技能（`*-helper`、`skill-forge`、`skill-review`）    |
| `commands/skiller.md`                       | 创建技能并审查的元命令                                   |
| `.cursor-plugin/plugin.json`                | Cursor 插件清单                                          |
| `.codex-plugin/plugin.json`                 | Codex 插件清单                                           |
| `.claude-plugin/plugin.json`                | Claude 插件清单                                          |
| `.claude-plugin/marketplace.json`           | Claude 用 marketplace 定义（开发名 `ai-everything-dev`） |
| `hooks/hooks-cursor.json`                   | Cursor 钩子配置（如 `sessionStart`）                     |
| `hooks/session-start`、`hooks/run-hook.cmd` | SessionStart 钩子实现（bash / Windows 启动器）           |

### SessionStart 钩子与环境变量

`hooks/session-start` 根据宿主通常注入的环境变量（一般无需你手动 export）选择注入会话上下文的 JSON 形态：

| 变量                 | 典型注入场景 | 对输出 JSON 的影响                                                                             |
| -------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `CURSOR_PLUGIN_ROOT` | Cursor       | 输出顶层 `additional_context`（蛇形命名），供 Cursor 钩子消费。                                |
| `CLAUDE_PLUGIN_ROOT` | Claude Code  | 在 **未** 设置 `COPILOT_CLI` 时，输出 `hookSpecificOutput.additionalContext`，供 Claude 消费。 |
| `COPILOT_CLI`        | Copilot CLI  | 输出顶层 `additionalContext`（SDK 风格），供 Copilot CLI 等 harness 消费。                     |

---

## 许可证

MIT 许可证 — 详见仓库根目录 [LICENSE](LICENSE) 文件。
