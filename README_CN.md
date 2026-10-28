# AI Everything

**简体中文** · [English](README.md)

**AI Everything**（包名 `ai-everything`）是一套面向编码代理的插件资源：在 **Cursor**、**Codex**、**Claude Code** 等 harness 中注册技能（skills）、命令（commands）、钩子（hooks）等路径，用于统一你的工作流自动化能力。

---

## 环境要求

- [Node.js](https://nodejs.org/) **22+**（ES 模块；`scripts/**/*.mjs` 使用 `import` 与现代 `fs` API）
- 技能和规则升级默认使用 Git 浅层稀疏检出，要求 `PATH` 中有 Git；可通过 `--fetch` 改用 HTTPS 归档下载。
- 默认 `--git` 不加载 `tar`。`--fetch` 只在提取归档时加载该开发依赖；使用前运行 `npm install --ignore-scripts` 安装。构建和部署脚本只依赖 Node 标准库。当前没有 `prepare` 脚本。`npm run upgrade:init` 需要单独执行，会联网调用 `npx skills`。
- **在 Windows 上部署**：钩子脚本需要 Git Bash 或其它 `bash`；`npm run deploy` 本身不依赖 bash

---

## 维护者工作流

`package.json` 是发布元数据的单一事实来源。修改后执行 `npm run build`，同步 `.cursor-plugin`、`.codex-plugin`、`.claude-plugin`。

| 脚本 | 等价命令 |
| ---- | -------- |
| `npm run build` | `node scripts/build.mjs` |
| `npm run deploy:project <project dir>` | `npm run deploy -t project <project dir>` |
| `npm run deploy:cursor` | `npm run deploy -- -t cursor` |
| `npm run deploy:codex` | `npm run deploy -- -t codex` |
| `npm run deploy:claude` | `npm run deploy -- -t claude` |
| `npm run deploy:qcode` | `npm run deploy -- -t qcode` |
| `npm run deploy:agent` | `npm run deploy -- -t agent` |
| `npm run upgrade:skill` | `node scripts/upgrade/skill.mjs` |
| `npm run upgrade:rule` | `node scripts/upgrade/rule.mjs` |
| `npm run upgrade:init` | `node scripts/upgrade/init.mjs` |

`npm run upgrade:init` 读取 [`scripts/init.json`](scripts/init.json)。清单是 JSON 数组，每项为 `{ skill, repo, name, groups }`。`repo` 与 `name` 可省略。有 `repo` 时执行 `npx skills add <repo> --skill <skill> --agent universal --yes`；无 `repo` 且有 `name` 时执行 `npx skills add <name> --agent universal --yes`；两者都没有则跳过该条，且不中断后续条目。`--agent universal` 且不加 `-g`，只写入当前项目的 `.agents/skills/`，不安装到 Cursor、Claude、Codex 或其他 Agent 目录。可重复 `--skill <name>`，按名称选择时忽略分组；多个 `--<group>` 取并集。当前清单的分组是 `--alchaincyf`，包含 `darwin-skill`、`huashu-nuwa` 和 `huashu-design`。`--yes` 跳过 skills CLI 的确认。校验失败或某条安装非零退出时，脚本以退出码 1 结束，且不启动后续条目。安装访问网络。

```bash
npm run upgrade:init
npm run upgrade:init -- --alchaincyf
npm run upgrade:init -- --skill darwin-skill
npm run upgrade:init -- --skill huashu-nuwa
```

```bash
# 链接到当前项目下的本地 harness 文件夹
npm run deploy -- --type cursor --mode local

# 把资源直接链接到项目目录
npm run deploy:project "D:/my project"
```

`deploy:project` 执行 `npm run deploy -t project`，用法是 `npm run deploy:project <project dir>`。它将现有 `skills/`、`commands/`、`rules/` 直接链接到该项目目录下，例如 `D:/my project/skills`。相对路径以命令工作目录为基准；不存在的目标目录会创建。已有内容会保留，等价链接会跳过。部署使用链接，因此链接资源仍指向本仓库。用户目录 `~/.agents/` 使用 `npm run deploy:agent`。

`deploy` 默认将现有资源目录链接到 `~/.cursor`、`~/.codex`、`~/.claude`、`~/.q-code` 或 `~/.agents`。Codex 只链接 `skills/`。`agent` 与 Cursor 部署相同资源，写入 `~/.agents/`（例如 `~/.agents/skills`）。缺失目录会跳过。`--mode local` 使用当前工作目录下对应目录（例如 `.cursor/` 或 `.agents/`）。这些命令只部署资源链接，不安装插件清单或钩子。若 npm 吞掉参数，请使用双横线形式。

`upgrade:skill` 默认更新配置中的全部 14 个上游 skill。可重复指定 `--skill <name>` 选择多个技能，按名称选择时忽略合法分组选项；多个分组选项取并集。设计分组是 `--design`。不传下载参数等同于 `--git`；`--fetch` 按每个所选技能的 `ref` 下载 HTTPS 分支归档。两者互斥，不影响技能选择。

| 选择参数 | 上游技能 |
| -------- | -------- |
| `--pet` | `hatch-pet` |
| `--skill skill-forge` | `skill-forge` |
| `--mattpocock` | `grilling`、`domain-modeling`、`writing-for-agents` |
| `--design` | `frontend-design`、`ui-ux-pro-max` |
| `--superpower` | `brainstorming`、`writing-plans`、`test-driven-development`、`systematic-debugging`、`requesting-code-review`、`receiving-code-review`、`verification-before-completion` |

**当前 CLI 限制：** 帮助示例仍列出 `npm run upgrade:design` 和 `npm run upgrade:tool`。`package.json` 里没有这两个脚本。`--tool` 不是分组，会报 `Unknown argument: --tool`。设计分组使用 `npm run upgrade:skill -- --design`；原先的两个技能使用 `npm run upgrade:skill -- --skill grilling --skill hatch-pet`。帮助中的分组 `--skill` 与按名称选择的选项重名，需使用 `--skill skill-forge`。

```bash
npm run upgrade:skill                                      # 默认 Git
npm run upgrade:skill -- --fetch                           # 显式归档下载
npm run upgrade:skill -- --git --skill frontend-design     # Git：单个技能
npm run upgrade:skill -- --design --pet                    # 两个分组的并集
npm run upgrade:skill -- --superpower                     # Superpowers 分组
```

并行更新多个 skill 时，交互式终端会为每个 skill 显示独立明细区：运行中空间不足时可滚动裁剪，完成后保留全部 `U`/`M`/`D` 文件行。CI 或重定向输出则自动使用带 skill 名前缀的逐行日志。共享下载工作目录位于 `.archives-upgrade-*` / `.repositories-upgrade-*` 下，按仓库命名（`owner-repo`）；`ref` 不是 `main` 时再附上分支名。

[`SKILL_SOURCES`](scripts/skills.json) 由 [`scripts/upgrade/skill.mjs`](scripts/upgrade/skill.mjs) 加载，字段为 `{ skill, repo, path, ref, groups }`。`ref` 是要下载的分支；当前每个技能都是 `main`。帮助展示 `<repo>/tree/<ref>/<path>`。下载直接读取 `repo`、`path` 和 `ref`，并按仓库和 ref 合并所选路径。报告器使用配置中的 `repo`。

[`RULE_SOURCES`](scripts/rules.json) 由 [`scripts/upgrade/rule.mjs`](scripts/upgrade/rule.mjs) 加载，字段为 `{ rule, repo, path, ref, groups }`，下载方式与技能相同。`npm run upgrade:rule` 把所选规则写入 `rules/<name>/`。下载和报告由 [`download.mjs`](scripts/upgrade/download.mjs) 与 [`report.mjs`](scripts/upgrade/report.mjs) 共用。`RULE_SOURCES` 为空时，命令因没有可选规则而退出，且不创建 `rules/`。规则的 `path` 必须是目录，不要求 `SKILL.md`，也不删除 `superpowers:`。

```text
所选技能 → 按仓库 + ref 分组
           ├─ --git（默认）：一次浅克隆 + 稀疏检出
           └─ --fetch：每个仓库和 ref 下载一次归档
         → 各技能暂存区 → 后处理 → 字节对比
         → 镜像替换 / 回滚 → 报告 → 清理
```

`--fetch` 使用配置中的 `ref`。内置 `fetch` 下载 `<repo>/archive/refs/heads/<ref>.tar.gz`（超时 60 秒），再用 `tar` 校验并提取各所选路径。同一仓库的另一个 `ref` 会单独下载。Git 也使用这个 `ref`，每组做一次深度为 1 的部分克隆和一次稀疏检出。两者均要求上游包含 `SKILL.md`，不调用 GitHub API、不需要 API 令牌，失败时不自动切换下载器。

`superpower` 分组会在比较前递归删除 `*.md` 中所有字面量 `superpowers:`。下载、校验或后处理失败时保留本地原有技能；单个路径缺失只使该技能失败。全部消费者结束后清理共享下载和检出目录。成功更新会镜像上游内容，包括删除文件，因此本地对镜像技能的编辑可能被替换。`U` 表示新增文件，`M` 表示内容变化，`D` 表示上游删除；未变化文件不显示。

### 验证

在仓库根目录执行：

```bash
node --test scripts/deploy/deploy.test.mjs
node --test scripts/upgrade/init.test.mjs
```

部署测试使用临时项目。修改部署行为后，还需用 `npm run deploy:project "<临时项目>"` 实测已有内容保护和重复执行。`upgrade:init` 测试注入安装运行器，不调用真实 `npx`，也不写入当前项目。`upgrade:skill` 与 `upgrade:rule` 的测试仍不在当前检出中。`skills/**/test-prompts.json` 是 Git 忽略的本地行为场景清单，不是自动测试运行器。各技能的回归要求见 [AGENTS.md](AGENTS.md)。

---

## 安装

**不同 harness 的安装方式不同。** 本仓库提供以下清单和本地部署入口；存在清单不代表已经上架官方市场。

| Harness | 仓库清单 | 本地资源部署 |
| ------- | -------- | ------------ |
| Claude Code | `.claude-plugin/plugin.json`；市场名称为 `ai-everything-marketplace` | `npm run deploy:claude` |
| Codex | `.codex-plugin/plugin.json` | `npm run deploy:codex` |
| Cursor | `.cursor-plugin/plugin.json` | `npm run deploy:cursor` |
| QCode | 无插件清单 | `npm run deploy:qcode` |
| `~/.agents` | 无插件清单 | `npm run deploy:agent` |

官方说明：[Claude Code plugins](https://code.claude.com/docs/en/discover-plugins.md)、[Codex plugins](https://developers.openai.com/codex/plugins)、[Cursor plugins](https://cursor.com/docs/plugins)。

---

## 内置资源

当前检出中没有 `commands/` 和 `rules/`，部署时会跳过。通过已安装的技能名称或明确的 `SKILL.md` 路径调用技能；本仓库没有定义 `/review` 或 `/skiller` 命令别名。

技能位于 `skills/`；每目录含 `SKILL.md` 与可选 `references/`：

| 技能 | 作用 |
| ---- | ---- |
| `commit-helper` | 只读总结/拟稿或限定范围 Git 提交，支持指定路径的已暂存改动；核对契约与改动版本，同类型目的直接选型，保护其他暂存内容，以 UTF-8 消息保留字面字符 |
| `clean-helper` | 限定范围清理，默认以 `.review/clean-{timestamp}.md` 留档；复用授权与报告路径，遵守严格禁写要求，局部恢复时保留有效回归和用户修改 |
| `test-helper` | 修正过时测试或补齐指定覆盖，保留回归与运行前置步骤，验证失败路径清理并如实报告未验证项 |
| `review-helper` | 限定范围的 P0–P3 审查与修复；保留用户改动，按需隔离验证被审查快照并说明阻塞 |
| `doc-helper` | 逐文件和模块路由 JS/TS、Java、Python、C/C++ 注释规则，分别限定符号文档、行内注释与 README 章节，区分未解决目标和未验证检查 |
| `coding-common` | 按目标仓库已有写法编写或修改代码；缺省规范内嵌于技能目录，覆盖不可变数据、错误处理、边界校验、测试先行与完成前自检 |
| `coding-typescript` | 在 TS/JS 文件上编写或修改代码；先走已安装的 **coding-common**，再叠加类型、Zod、异步错误收窄与 React props 等语言缺省 |
| `coding-java` | 在 `.java` 上编写或修改代码；先走已安装的 **coding-common**，再叠加命名、record/不可变、Optional、构造器注入、JUnit 5 与参数化查询等语言缺省 |
| `coding-vue` | 在 Vue 文件与相关 Composition API 模块上编写或修改代码；先走已安装的 **coding-common** 与 **coding-typescript**，再叠加 SFC、响应式、composables、Pinia、路由与组件测试等缺省 |
| `dev-requirement` | 生成 `DR-<YYYYMMDD>-<feature-name>`；委托已安装的 **grilling-requirement**（pre-tag=DR）澄清需求，再由 **brainstorming** 整理方案，写入 `docs/<dr-id>/requirement.md` 与 `proposal.md`，按本轮要求停在需求、方案或实现阶段，沿用明确的续跑选择。批准后按已确认编号执行 **test-driven-development** → **requesting-code-review** → **receiving-code-review** → **verification-before-completion**；支持实现与审查分别派发、当前会话实现加独立审查，或明确披露的自审 |
| `dev-debug` | 生成 `DD-<YYYYMMDD>-<feature-name>`，通过已安装的 **grilling-requirement**（pre-tag=DD） 在 `docs/<dd-id>/requirement.md` 确认行为编号；选择修复与审查执行方式，再走 **systematic-debugging** → **test-driven-development** → **requesting-code-review** / **receiving-code-review** → **verification-before-completion**，实验恢复只撤回本轮改动、冲突时保留用户编辑，并明确标注自审与阻塞 |
| `reviewer` | 编排 **requesting-code-review** → 独立只读 **review-helper** → **receiving-code-review**，自动循环修复、验证和复审，经 **verification-before-completion** 交付；显性检查点沿用已有授权，不逐轮审批；按需调用 **test-helper** 和 **doc-helper**，支持仅审查 |
| `skill-forge` | 创建或更新技能 |
| `skill-review` | 审查技能质量（由 `skiller` 调用） |
| `skiller` | 调用已安装的 **skill-forge** 一次，再循环执行 **skill-review** → 修复，直到无待处理建议 |
| `domain-modeling` | 梳理项目术语和领域决策 |
| `agenter` | 生成或增量更新 `AGENTS.md` 与按任务触发的领域指引；在规划、成文、验收时应用已安装的 `writing-for-agents` |
| `agent-creator` | 在 `.agents/skills/agent-<name>/SKILL.md` 创建或增量更新项目任务 Agent；依赖单独安装的 `grilling`，配套工具默认位于项目根目录的 `scripts/` |
| `grilling-requirement` | 统一需求依赖检查、固定 ID、grilling 与书面歧义澄清；ID 为 `<pre-tag>-<YYYYMMDD>-<feature-name>`（默认 TK），交付 `docs/<task-id>/requirement.md` 或返回调用方 |
| `grilling-with-docs` | 澄清后按范围更新并保留无关内容，区分明确授权的全文替换；恢复不可读来源，跨环境加载依赖，复用根目录 `GLOSSARY.md` |
| `designer` | 编排 **ui-ux-pro-max** + **frontend-design** 做差异化 UI |
| `frontend-design` | 上游镜像的视觉设计指引（`--design`） |
| `ui-ux-pro-max` | 上游镜像的 UI/UX 设计情报（`--design`） |
| `grilling` | 上游镜像的方案拷问式访谈（`--mattpocock`） |
| `writing-for-agents` | 上游镜像的面向代理的文档编写指引（`--mattpocock`） |
| `hatch-pet` | 上游镜像的 Codex 动画宠物创建、验证与打包工作流（`--pet`；视觉生成依赖已安装的 `imagegen`） |
| Superpowers 分组 | 规划、测试、调试、审查与验证等七项上游技能；名称见上方选择参数表（`--superpower`） |

上方选择参数表中的全部 14 个技能均为 Git 忽略的上游镜像；全新检出后可运行 `npm run upgrade:skill` 获取。其他技能源码随本仓库维护。本地存在文件不等于当前会话可调用；编排技能从会话登记入口解析依赖。

### 代码注释与 README

调用 `doc-helper` 时给出目标文件或符号及所需输出。它分别路由 JS/TS、Java、Python、C/C++，保留项目既有约定，并使用所属模块已有的检查环境。语言格式与边界见[使用说明](skills/doc-helper/README.md)。

| 提示词示例 | 对应行为 |
| --- | --- |
| “只给 `src/parse.ts` 的公开 API 补 JSDoc，不改函数体和 README。” | 仅更新指定范围内的符号文档 |
| “只给 `retry` 函数体补关键步骤行内注释，不加 JSDoc，不处理其他函数。” | 解释非显然的实现步骤，不补符号文档 |
| “只纠正这个 Rust 项目 README 的 Usage，保持英文。” | 只读源码取证并修改指定章节；代码注释语言未支持不阻塞 README 任务 |

已准确的目标检查后无需修改，也算已处理；仍有必需符号未解决时，即使同文件其他符号已更新，也只算部分完成。检查结果单独报告，工具缺失不会触发自动安装，也不能算验证通过。维护者的验证范围见 [doc-helper 回归指引](docs/agents/skill-regression.md#doc-helper)。

### 仓库代理说明

仅调用 `agenter`、不附加参数，即授权扫描当前工作区，新建或增量更新根 `AGENTS.md`，并按需维护 `docs/agents/` 下的关联指引；明确的范围或只读要求优先。它依赖单独安装的 `writing-for-agents`。

```text
取证 → 规划 → 明确授权 → 成文/写入 → 验收
        ↑                   ↑         ↑
        └── writing-for-agents ────────┘
```

流程加载已登记的写作技能一次，在三个节点应用；扫描覆盖根目录及发现的工作区成员来源，保留既有约束与后续编辑。最终明确报告“完成 / 完成但存在缺口 / 阻塞”：依赖缺失或必需写入、检查失败属于阻塞，可选信息缺口不触发整轮追问。根文件默认控制在 200 行以内；范围外原有超长应披露为缺口，不构成越界重写授权。维护场景见 `skills/agenter/references/acceptance-scenarios.md`，场景清单不等于自动验证通过。

### 项目 Agent 生成

使用 `agent-creator` 并提供名称和需求，例如：“创建 config-check，检查项目配置，只报告错误，不改配置。”缺少名称时，首先通过已安装的 `grilling` 明确名称。生成器调查项目事实、确认任务契约，再创建或增量更新 `.agents/skills/agent-<name>/SKILL.md` 及必要的引用文档。配套脚本默认放在目标项目根目录的 `scripts/`，Skill 记录调用方式。它不以生成 `AGENTS.md` 为目标；该任务使用 `agenter`。

`grilling` 必须已安装且当前会话可加载。缺少时，可执行 `npm run upgrade:skill -- --skill grilling` 获取，再为所用 harness 安装或部署并使会话可用。必需依赖无法加载时，生成器停止，不内置替代访谈协议，也不自动安装依赖。生成的 Agent 可以另外声明必需或可选的 Skill 依赖。

生成器提取每个任务步骤的输入、判断条件、动作、输出、验收及失败处理，并将已确认需求对应到验证场景。生成阶段包含隔离验证，不执行 Agent 的真实业务任务。`.agents/skills/agent-<name>/` 布局不保证宿主自动发现；必要时通过明确的 `SKILL.md` 路径要求宿主读取并执行。迁移时还需携带项目脚本并满足外部依赖。本地维护回归场景可保存在 `skills/agent-creator/test-prompts.json`，该文件不纳入 Git；缺失时按已确认的任务契约准备场景。它描述行为检查，不是自动测试运行器。

---

## 目录速览

| 路径                                        | 说明                                                     |
| ------------------------------------------- | -------------------------------------------------------- |
| `package.json`                              | 对外展示信息与 npm 脚本的单一来源                         |
| `scripts/build.mjs`                         | 将 `package.json` 同步到各插件 JSON                      |
| `scripts/deploy/deploy.mjs`                 | 将 `commands/`、`rules/`、`skills/` 符号链接到 harness 目录 |
| `scripts/init.json`                         | 安装清单，由 `scripts/upgrade/init.mjs` 执行                |
| `scripts/skills.json`                       | 上游技能目录，加载后为 `SKILL_SOURCES`                    |
| `scripts/rules.json`                        | 上游规则目录，加载后为 `RULE_SOURCES`（当前为空）          |
| `scripts/upgrade/skill.mjs`                 | 将 `skills.json` 同步到 `skills/<name>/`                 |
| `scripts/upgrade/rule.mjs`                  | 将 `rules.json` 同步到 `rules/<name>/`                   |
| `scripts/upgrade/download.mjs`              | 共用的 Git/`--fetch` 下载、镜像替换和 CLI 辅助函数       |
| `scripts/upgrade/report.mjs`                | 技能与规则并行升级时的终端/CI 输出报告器                 |
| `commands/`                                 | 可选的斜杠命令模板（当前不存在）                          |
| `rules/`                                    | 可选的代理规则（当前不存在）                              |
| `skills/`                                   | 仓库跟踪的技能与 Git 忽略的上游镜像                       |
| `.cursor-plugin/plugin.json`                | Cursor 插件清单                                          |
| `.codex-plugin/plugin.json`                 | Codex 插件清单                                           |
| `.claude-plugin/plugin.json`                | Claude 插件清单                                          |
| `.claude-plugin/marketplace.json`           | Claude marketplace 定义（`ai-everything-marketplace`） |
| `hooks/hooks-cursor.json`                   | Cursor 钩子配置（如 `sessionStart`）                     |
| `hooks/hooks.json`                          | Claude Code 的 `SessionStart` 钩子配置                   |
| `hooks/session-start`、`hooks/run-hook.cmd` | SessionStart 钩子实现（bash / Windows 启动器）           |

### SessionStart 钩子与环境变量

`hooks/session-start` 读取 `skills/using-ai-everything/SKILL.md` 并按宿主输出 JSON。当前检出缺少该技能文件，因此钩子会注入读取失败的回退文本。存在旧目录 `~/.config/ai-everything/skills` 时还会附加迁移警告。

`hooks/session-start` 根据宿主通常注入的环境变量（一般无需你手动 export）选择注入会话上下文的 JSON 形态：

| 变量                 | 典型注入场景 | 对输出 JSON 的影响                                                                             |
| -------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `CURSOR_PLUGIN_ROOT` | Cursor       | 输出顶层 `additional_context`（蛇形命名），供 Cursor 钩子消费。                                |
| `CLAUDE_PLUGIN_ROOT` | Claude Code  | 在 **未** 设置 `COPILOT_CLI` 时，输出 `hookSpecificOutput.additionalContext`，供 Claude 消费。 |
| `COPILOT_CLI`        | Copilot CLI  | 输出顶层 `additionalContext`（SDK 风格），供 Copilot CLI 等 harness 消费。                     |

---

## 许可证

MIT 许可证 — 详见仓库根目录 [LICENSE](LICENSE) 文件。
