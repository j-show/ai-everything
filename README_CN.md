# AI Everything

**简体中文** · [English](README.md)

**AI Everything**（包名 `ai-everything`）是一套面向编码代理的插件资源：在 **Cursor**、**Codex**、**Claude Code** 等 harness 中注册技能（skills）、命令（commands）、钩子（hooks）等路径，用于统一你的工作流自动化能力。

---

## 环境要求

- [Node.js](https://nodejs.org/) **22+**（ES 模块；`scripts/*.mjs` 使用 `import` 与现代 `fs` API）
- Skill 升级默认使用 Git 浅层稀疏检出，要求 `PATH` 中有 Git；可通过 `--fetch` 改用 HTTPS 归档下载。
- 升级 skill 前运行 `npm install --ignore-scripts` 安装开发依赖 `tar`；构建和部署脚本仍只依赖 Node 标准库。
- **在 Windows 上部署**：钩子脚本需要 Git Bash 或其它 `bash`；`npm run deploy` 本身不依赖 bash

---

## 维护者工作流

`package.json` 是发布元数据的单一事实来源。修改后执行 `npm run build`，同步 `.cursor-plugin`、`.codex-plugin`、`.claude-plugin`。

| 脚本 | 等价命令 |
| ---- | -------- |
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
# 链接到当前项目下的本地 harness 文件夹
npm run deploy -- --type cursor --mode local

# 默认通用模式：部署到项目的 .agents 目录
npm run deploy:project -- "D:/my project"

# 显式指定通用模式，效果相同
npm run deploy:project -- "D:/my project" --general

# 自定义模式：直接部署到项目目录
npm run deploy:project -- "D:/my project" --custom
```

`deploy:project` 必须指定一个项目目录。默认不带参数或显式指定 `--general` 时，将现有 `skills/`、`commands/`、`rules/` 链接到项目的 `.agents/` 下，例如 `D:/my project/.agents/skills`。指定 `--custom` 时，资源直接部署到项目目录下，例如 `D:/my project/skills`。模式参数可放在项目路径前后；`--general` 与 `--custom` 互斥。相对路径以命令工作目录为基准；不存在的目标目录会创建。已有内容会保留，等价链接会跳过。部署使用链接，因此链接资源仍指向本仓库。

`deploy` 默认将现有资源目录链接到 `~/.cursor`、`~/.claude` 或 `~/.q-code`；Codex 只链接 `skills/`。缺失的目录会跳过。`--mode local` 则写入当前项目目录。若 npm 吞掉参数，请使用双横线形式。

`upgrade:skill` 默认更新配置中的全部上游 skill。使用 `npm run upgrade:skill -- --skill <name>` 更新单个 skill，使用 `--design` 更新 `frontend-design` 与 `ui-ux-pro-max`，或使用 `--tool` 更新 `grilling` 与 `hatch-pet`。存在 `--skill` 时会忽略分组选项。`upgrade:design` 与 `upgrade:tool` 是对应分组的快捷命令。 不传下载参数等同于 `--git`；使用 `--fetch` 可改用 HTTPS 归档下载。两者互斥，可放在选择参数前后，不影响 skill 的选择。

```bash
npm run upgrade:skill                                      # Git (default)
npm run upgrade:skill -- --fetch                           # explicit fetch
npm run upgrade:skill -- --git                             # Git
npm run upgrade:skill -- --git --skill frontend-design     # Git: one skill
npm run upgrade:skill -- --design --git                    # Git: design group
```

并行更新多个 skill 时，交互式终端会为每个 skill 显示独立的滚动明细区；CI 或重定向输出则自动使用带 skill 名前缀的逐行日志。

`scripts/upgrade-skill.mjs` 中的 `SKILL_SOURCES` 使用 `{ skill, repo, path, groups }`：`repo` 为仓库根 URL，`path` 为 skill 在仓库内的相对目录。帮助输出使用 `<repo>/tree/main/<path>`；实际下载按参数选择下述分支归档或 Git 检出。进度报告器同样从该配置读取 `repo`。升级回归测试通过临时项目、离线归档和真实本地 Git 仓库覆盖两种方式的完整 CLI 入口。

两种下载器共用严格镜像流程：临时目录、字节对比、目录替换、回滚、报告和清理。传入 `--fetch` 时由内置 `fetch` 将 `<repo>/archive/refs/heads/main.tar.gz` 流式下载到磁盘，再用 npm `tar` 校验并提取目标 skill；每个 skill 下载完整仓库源码快照，下载超时为 60 秒。默认或传入 `--git` 时执行深度为 1 的部分克隆和稀疏检出，将目标 skill 复制到同一个 staging 目录。两种方式均不调用 GitHub API、不需要 API 令牌，失败时不自动切换下载方式。上游必须包含 `SKILL.md`；下载或校验失败时保留本地原有内容，运行结束清理临时归档及检出目录。`U` 表示本地新增文件，`M` 表示上游文件内容发生变化，`D` 表示上游删除文件；内容未变化的文件不会显示。

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

当前检出中没有 `commands/`，因此部署时不会从本仓库提供斜杠命令。部署脚本会跳过缺失的资源目录。

## SessionStart 钩子

`hooks/session-start` 读取 `skills/using-ai-everything/SKILL.md` 并按宿主输出相应 JSON。当前检出缺少该技能文件，因此钩子会注入读取失败的回退文本，而非技能说明。若存在旧版技能目录，还会附加迁移警告。

技能位于 `skills/`；每目录含 `SKILL.md` 与可选 `references/`：

| 技能 | 作用 |
| ---- | ---- |
| `commit-helper` | 结构化 git 提交 |
| `clean-helper` | 在限定范围内、证据优先地清理死代码 |
| `test-helper` | 以实现为准重写测试（用于 `/review` 第一步） |
| `review-helper` | P0–P3 审查闭环（用于 `/review` 第二步） |
| `doc-helper` | 按范围从代码补文档，保留现有语言并核对证据（用于 `/review` 第三步） |
| `reviewer` | 编排 **test-helper** → **review-helper** → **doc-helper**（`/review`） |
| `skill-forge` | 创建或更新技能 |
| `skill-review` | 审查技能质量（用于 `/skiller`） |
| `skiller` | 编排 **skill-forge** → **skill-review** 循环（`/skiller`） |
| `domain-modeling` | 梳理项目术语和领域决策 |
| `init-helper` | 扫描仓库并生成或刷新根目录 `AGENTS.md` |
| `agent-creator` | 在 `.agents/skills/agent-<name>/SKILL.md` 创建或增量更新项目任务 Agent；依赖单独安装的 `grilling`，配套工具默认位于项目根目录的 `scripts/` |
| `grilling-with-docs` | 访谈澄清需求与领域用语，写入已确认的产物 |
| `designer` | 编排 **ui-ux-pro-max** + **frontend-design** 做差异化 UI |
| `frontend-design` | 上游镜像的视觉设计指引（`upgrade:design`） |
| `ui-ux-pro-max` | 上游镜像的 UI/UX 设计情报（`upgrade:design`） |
| `grilling` | 上游镜像的方案拷问式访谈（`upgrade:tool`） |
| `hatch-pet` | 上游镜像的 Codex 动画宠物创建、验证与打包工作流（`upgrade:tool`；视觉生成依赖已安装的 `imagegen`） |

`skill-forge`、`domain-modeling`、`frontend-design`、`ui-ux-pro-max`、`grilling`、`hatch-pet` 是被 Git 忽略的上游镜像；全新检出后可运行 `npm run upgrade:skill` 获取。

### 项目 Agent 生成

使用 `agent-creator` 并提供名称和需求，例如：“创建 config-check，检查项目配置，只报告错误，不改配置。”缺少名称时，首先通过已安装的 `grilling` 明确名称。生成器调查项目事实、确认任务契约，再创建或增量更新 `.agents/skills/agent-<name>/SKILL.md` 及必要的引用文档。配套脚本默认放在目标项目根目录的 `scripts/`，Skill 记录调用方式。它不以生成 `AGENTS.md` 为目标；该任务使用 `init-helper`。

`grilling` 必须已安装且当前会话可加载。缺少时，可执行 `npm run upgrade:skill -- --skill grilling` 获取，再为所用 harness 安装或部署并使会话可用。必需依赖无法加载时，生成器停止，不内置替代访谈协议，也不自动安装依赖。生成的 Agent 可以另外声明必需或可选的 Skill 依赖。

生成器提取每个任务步骤的输入、判断条件、动作、输出、验收及失败处理，并将已确认需求对应到验证场景。生成阶段包含隔离验证，不执行 Agent 的真实业务任务。`.agents/skills/agent-<name>/` 布局不保证宿主自动发现；必要时通过明确的 `SKILL.md` 路径要求宿主读取并执行。迁移时还需携带项目脚本并满足外部依赖。本地维护回归场景可保存在 `skills/agent-creator/test-prompts.json`，该文件不纳入 Git；缺失时按已确认的任务契约准备场景。它描述行为检查，不是自动测试运行器。

---

## 目录速览

| 路径                                        | 说明                                                     |
| ------------------------------------------- | -------------------------------------------------------- |
| `package.json`                              | 对外展示信息与 npm 脚本的单一来源                         |
| `scripts/build.mjs`                         | 将 `package.json` 同步到各插件 JSON                      |
| `scripts/deploy.mjs`                        | 将 `commands/`、`rules/`、`skills/` 符号链接到 harness 目录 |
| `scripts/upgrade-skill.mjs`                 | 通过 fetch 或可选 Git 检出同步上游 skills                |
| `scripts/upgrade-skill-reporter.mjs`        | 并行升级时的终端/CI 输出报告器                           |
| `commands/`                                 | 可选的斜杠命令模板（当前不存在）                          |
| `rules/`                                    | 可选的代理规则（当前不存在）                              |
| `skills/`                                   | 代理技能与确定性工作流 CLI                                |
| `.cursor-plugin/plugin.json`                | Cursor 插件清单                                          |
| `.codex-plugin/plugin.json`                 | Codex 插件清单                                           |
| `.claude-plugin/plugin.json`                | Claude 插件清单                                          |
| `.claude-plugin/marketplace.json`           | Claude marketplace 定义（`ai-everything-marketplace`） |
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
