# AI Everything

**简体中文** · [English](README.md)

**AI Everything**（包名 `ai-everything`）是一套面向编码代理的插件资源：在 **Cursor**、**Codex**、**Claude Code** 等 harness 中注册技能（skills）、命令（commands）、钩子（hooks）等路径，用于统一你的工作流自动化能力。

---

## 环境要求

- [Node.js](https://nodejs.org/) **22+**（ES 模块；`scripts/*.mjs` 使用 `import` 与现代 `fs` API）
- 维护脚本无需 `npm install`（仅使用 Node 标准库）
- **在 Windows 上部署**：钩子脚本需要 Git Bash 或其它 `bash`；`npm run deploy` 本身不依赖 bash

---

## 维护者工作流

`package.json` 是发布元数据的单一事实来源。修改后执行 `npm run build`，同步 `.cursor-plugin`、`.codex-plugin`、`.claude-plugin`。

| 脚本 | 等价命令 |
| ---- | -------- |
| `npm run build` | `node scripts/build.mjs` |
| `npm run deploy:cursor` | `npm run deploy -t cursor` |
| `npm run deploy:codex` | `npm run deploy -t codex` |
| `npm run deploy:claude` | `npm run deploy -t claude` |
| `npm run deploy:qcode` | `npm run deploy -t qcode` |

```bash
# 链接到当前项目下的本地 harness 文件夹
npm run deploy -- --type cursor --mode local
```

`deploy` 默认把 `commands/`、`rules/`、`skills/` 链接到 `~/.cursor`、`~/.codex`、`~/.claude` 或 `~/.q-code`；`--mode local` 则写入当前项目目录。若 npm 吞掉参数，请使用双横线形式。

---

## 安装

**不同 harness 的安装方式不同。** 若你同时使用 Claude Code、Codex、Cursor，需要在各自产品里**分别**完成安装。

| Harness | 安装入口 |
| ------- | -------- |
| Claude Code | `/plugin install ai-everything@claude-plugins-official`，或添加 `jshow-marketplace` 后从自定义市场安装 |
| Codex CLI | 打开 `/plugins`，搜索 `ai-everything`，选择 **Install Plugin** |
| Codex App | 打开 **Plugins**，找到 **AI Everything** / `ai-everything`，按应用内提示安装 |
| Cursor | 在 Cursor Agent 对话中运行 `/add-plugin ai-everything`，或从插件市场搜索安装 |

官方说明：[Claude Code plugins](https://code.claude.com/docs/en/discover-plugins.md)、[Codex plugins](https://developers.openai.com/codex/plugins)、[Cursor plugins](https://cursor.com/docs/plugins)。

---

## 内置资源

斜杠命令为 `commands/` 下的 Markdown 文件（文件名即 `/命令名`）。执行 `npm run deploy:cursor` 后可在 Cursor 中使用：

| 命令 | 源文件 | 说明 |
| ---- | ------ | ---- |
| `/review` | `commands/review.md` | 流水线：**test-helper** → **review-helper** → **doc-helper** |
| `/skiller` | `commands/skiller.md` | 用 **skill-forge** 创建技能，**skill-review** 审查至无建议 |

## 钩子注入式约束

对于需要广泛生效的规则，例如项目 TypeScript 代码规范，优先使用钩子注入。相关技能的 `description` 应保持克制，只用于显式发现和调用，避免普通 TypeScript 任务被误触发。

推荐模式：将可复用规则放在 `skills/<name>/references/`，由 `hooks/session-start` 注入简短摘要；需要时再补 Cursor `rules/` 文件，并用 lint/typecheck/脚本校验可机械检查的规则。

这样可以避免在常驻约束里依赖堆关键词的 `description`，同时通过现有 `SessionStart` 分支保持 Codex、Cursor、Claude Code 及类似 SDK 风格 harness 的行为一致。

技能位于 `skills/`；每目录含 `SKILL.md` 与可选 `references/`：

| 技能 | 作用 |
| ---- | ---- |
| `commit-helper` | 结构化 git 提交 |
| `create-project-agent` | 确保 `TODO.md` 计划并生成 `buddy-helper` 提案，再交给 `init-helper` 创建 AGENTS.md |
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
| `skills/`                                   | 代理技能与确定性工作流 CLI                                |
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
