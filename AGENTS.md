# AI Everything — 代理说明

面向编码代理的项目手册。人类用户请优先阅读 [README.md](README.md) / [README_CN.md](README_CN.md)。

## 项目是什么

**AI Everything**（包名 `ai-everything`）是一套**多 harness 插件资源库**：在 Cursor、Codex、Claude Code 等环境中注册 **skills**、**commands**、**hooks**。本仓库**不是**业务应用，几乎没有运行时依赖；维护重点是 Markdown 技能、斜杠命令模板、插件清单与 Node 构建/部署脚本。

## 环境要求

- **Node.js 22+**（ESM；`scripts/*.mjs` 仅用 Node 标准库，无需 `npm install`）
- 修改 `hooks/session-start` 或本地验证钩子时：Windows 需 **Git Bash** 或其它 `bash`（`hooks/run-hook.cmd` 为 Windows 入口）
- 技能校验脚本：`skills/skill-forge/scripts/quick_validate.py`（需本机 Python 3）

## 常用命令

在仓库根目录执行：

| 命令 | 作用 |
| ---- | ---- |
| `npm run build` | 以根目录 `package.json` 为单一事实来源，同步 `.cursor-plugin`、`.codex-plugin`、`.claude-plugin` 下的 JSON |
| `npm run deploy:cursor` | 将 `commands/`、`rules/`、`skills/` 符号链接到 `~/.cursor`（用户级） |
| `npm run deploy -- --type cursor --mode local` | 链接到当前项目下的 `./.cursor`（本地调试） |
| `npm run deploy:codex` / `deploy:claude` / `deploy:qcode` | 分别部署到 `~/.codex` / `~/.claude` / `~/.q-code` |

**完成标准（维护元数据时）**：改 `package.json` 后已执行 `npm run build`，且三份插件 JSON 与 `package.json` 字段一致。

**完成标准（改技能时）**：对目标目录执行 `python skills/skill-forge/scripts/quick_validate.py skills/<name>` 通过（或按 skill-forge 交付清单自检）。

## 目录与职责

| 路径 | 说明 |
| ---- | ---- |
| `package.json` | 名称、版本、描述、作者等**唯一元数据来源** |
| `scripts/build.mjs` | 同步插件清单 |
| `scripts/deploy.mjs` | 符号链接 `commands`、`rules`、`skills` 到 harness 目录 |
| `skills/<name>/` | 代理技能：`SKILL.md` + 可选 `references/`、`scripts/`、`assets/` |
| `commands/*.md` | Cursor 斜杠命令提示（文件名 → `/命令名`） |
| `hooks/hooks-cursor.json` | Cursor `sessionStart` 钩子配置 |
| `hooks/session-start` | 会话启动时注入上下文（按 `CURSOR_PLUGIN_ROOT` / `CLAUDE_PLUGIN_ROOT` / `COPILOT_CLI` 分支输出 JSON） |
| `.cursor-plugin/plugin.json` | Cursor 清单（含 `skills`、`commands`、`hooks` 路径） |
| `.codex-plugin/plugin.json` | Codex 清单 |
| `.claude-plugin/plugin.json`、`.claude-plugin/marketplace.json` | Claude 插件与市场定义 |
| `rules/`、`agents/` | README 中预留；**当前仓库可能不存在**，`deploy` 会跳过缺失目录 |

## 内置技能与命令

### 技能（`skills/`）

| 技能 | 用途 |
| ---- | ---- |
| `commit-helper` | 结构化 git 提交（勿擅自 `git config`、破坏性命令、`--no-verify`） |
| `test-helper` | 按**当前实现**重写/对齐测试 |
| `review-helper` | 变更范围内 P0–P3 审查与修复闭环 |
| `doc-helper` | JSDoc、关键注释、README（文档须反映已验证行为） |
| `skill-forge` | 创建或更新技能（本仓库扩展技能时**必读**） |
| `skill-review` | 审计技能质量 |

各技能工作流以对应 `SKILL.md` 为准；细节放在 `references/`，勿在 `SKILL.md` 中堆长文。

### 斜杠命令（`commands/`）

| 命令 | 流水线 |
| ---- | ------ |
| `/review` | `test-helper` → `review-helper` → `doc-helper`（顺序固定） |
| `/skiller` | `skill-forge` → `skill-review` 循环至 **Suggestions** 为空 |

命令正文为**编排说明**：执行时必须调用**已安装**的技能，不能仅用「仓库里存在 `skills/foo`」代替 Skill 工具调用。详见 `commands/review.md`、`commands/skiller.md`。

## 在本仓库工作时的约定

### 范围与风格

- **最小改动**：只改与任务相关的技能/命令/清单/脚本；不要顺带重构无关技能。
- **单一事实来源**：插件对外名称、版本、描述等只改 `package.json`，再 `npm run build`。
- **双语 README**：用户面向说明更新 `README.md`（英文）与 `README_CN.md`（中文），保持结构对齐。
- **技能英文正文**：`SKILL.md` 与 `references/` 维持现有英文技术写作风格；`commands/` 可为中文编排说明。
- **不要提交**除非用户明确要求；勿提交 `.review/`、锁文件、`node_modules`（见 `.gitignore`）。

### 新增或修改技能

1. 阅读并遵循 `skills/skill-forge/SKILL.md`（Iron Law、frontmatter `name`/`description`、&lt;500 行、渐进加载）。
2. 目录名与 frontmatter `name` 一致（小写连字符，如 `my-helper`）。
3. `description` 含触发关键词（keyword bombing），便于代理发现。
4. 可选：`python skills/skill-forge/scripts/init_skill.py` 初始化；`package_skill.py` 打包前再确认。
5. 若改动影响 Cursor 加载路径，检查 `.cursor-plugin/plugin.json` 的 `skills` 字段（一般为 `./skills/`）。

### 新增斜杠命令

- 在 `commands/<name>.md` 增加 Markdown 模板。
- 写明：前置技能检查、步骤顺序、完成标准、常见错误表。
- 与现有命令一致：**必须**通过已安装技能执行，禁止依赖仓库内路径冒充调用。

### 修改插件清单或钩子

- 改 `package.json` → `npm run build` → 一并提交生成的 JSON。
- `hooks/session-start` 当前会读取 `skills/using-ai-everything/SKILL.md` 注入会话；若该文件不存在，钩子会回退错误文本——新增/重命名该技能时需同步更新脚本路径。
- 环境变量分支：`CURSOR_PLUGIN_ROOT` → `additional_context`；`CLAUDE_PLUGIN_ROOT` 且无 `COPILOT_CLI` → `hookSpecificOutput.additionalContext`；否则 → `additionalContext`。

## 易错点（必读）

| 问题 | 正确做法 |
| ---- | -------- |
| 只改 `.cursor-plugin/plugin.json` 不同步 `package.json` | 先改 `package.json`，再 `npm run build` |
| 在命令/技能里写「读取 `skills/xxx/SKILL.md`」代替调用 | 区分**开发本仓库**与**用户已安装技能**；命令面向终端用户时必须走已安装技能 |
| 审查/测试/文档技能用于全仓库无关文件 | 遵守各技能 Iron Law 与范围（diff、目录、`{{input}}`） |
| Windows 下直接跑 `session-start` 无 bash | 用 `hooks/run-hook.cmd` 或 Git Bash |
| `deploy` 期望同步 `hooks/` | `deploy.mjs` 仅链接 `commands`、`rules`、`skills`；钩子由插件清单 `hooks` 字段指向仓库内路径 |
| 遗留目录 `~/.config/ai-everything/skills` | 会话钩子可能注入迁移警告；自定义技能应放到各 harness 官方 skills 目录 |

## 验证清单（改完再宣称完成）

- [ ] 若动元数据：`npm run build` 已执行，三份插件 JSON 已更新
- [ ] 若动技能：`quick_validate.py` 或 skill-forge 交付清单已通过
- [ ] 若动命令：前置技能表、步骤顺序、与 `commands/*.md` 一致
- [ ] 若动钩子：bash 脚本在 Windows 下仍可通过 `run-hook.cmd` 调用
- [ ] README / README_CN 与行为一致（安装路径、命令表、目录表）

## 进一步阅读

- 安装与各 harness 说明：[README.md](README.md)
- 技能架构与写作：[skills/skill-forge/SKILL.md](skills/skill-forge/SKILL.md)、[skills/skill-forge/references/](skills/skill-forge/references/)
- Cursor 规则（可选、细粒度）：`.cursor/rules/`（本仓库可后续添加；与 `AGENTS.md` 互补）
