# AI Everything — 仓库操作约定

面向编码代理的技能与插件资源仓库。维护脚本使用 Node.js 22+ ES modules。安装、脚本表和技能概览见 [README_CN.md](README_CN.md) / [README.md](README.md)。

## 事实来源

```text
package.json ── scripts/build.mjs          ── .{cursor,codex,claude}-plugin/
skills/      ── scripts/deploy/deploy.mjs  ── harness 或项目目录的资源链接
上游仓库     ── scripts/upgrade/skill.mjs  ── skills/ 中的镜像
上游仓库     ── scripts/upgrade/rule.mjs   ── rules/ 中的镜像
scripts/init.json ── scripts/upgrade/init.mjs ── 当前项目 .agents/skills/（--agent universal，无 -g）
hooks/       ── SessionStart 配置与启动脚本
```

- 元数据与脚本入口以 [package.json](package.json) 为准。技能目录在 [scripts/skills.json](scripts/skills.json)，由 [scripts/upgrade/skill.mjs](scripts/upgrade/skill.mjs) 导出为 `SKILL_SOURCES`。规则目录在 [scripts/rules.json](scripts/rules.json)，由 [scripts/upgrade/rule.mjs](scripts/upgrade/rule.mjs) 导出为 `RULE_SOURCES`。下载与报告在 [download.mjs](scripts/upgrade/download.mjs) 和 [report.mjs](scripts/upgrade/report.mjs)。
- 安装清单在 [scripts/init.json](scripts/init.json)，字段为 `{ skill, repo, name, groups }`，由 [scripts/upgrade/init.mjs](scripts/upgrade/init.mjs) 执行。`repo` 与 `name` 可省略。有 `repo` 时执行 `npx skills add <repo> --skill <skill> --agent universal --yes`；无 `repo` 且有 `name` 时执行 `npx skills add <name> --agent universal --yes`；两者都没有则跳过该条。`--agent universal` 且不加 `-g`，只写入当前项目的 `.agents/skills/`。参数选择复用 [download.mjs](scripts/upgrade/download.mjs) 的 `createArgumentParser` 与 `createSourceSelector`。
- 需求公共流程由 `grilling-requirement` 维护，ID 为 `<pre-tag>-<YYYYMMDD>-<feature-name>`（默认 TK）；`dev-requirement` / `dev-debug` 分别传入 DR / DD，只维护后续方案、实现或修复流程。
- 技能契约以 `skills/<name>/SKILL.md` 及其 `references/` 为准。
- 审查编排由 `reviewer` 维护，范围和独立审查交接以 `review-helper/references/` 为准；显性检查点不新增逐轮审批。三个 Superpowers 审查与验证技能保持上游镜像，不在镜像中加入本地流程。
- 自有技能随仓库维护。`.gitignore` 忽略 14 个上游镜像，以及 `.agents/`、`.review/`、`skills/**/test-prompts.json`。不能假设全新检出里有这些路径。
- `commands/`、`rules/` 和 `skills/using-ai-everything/SKILL.md` 当前缺失。部署跳过缺失资源。SessionStart 读不到该技能时输出错误回退文本。

## 易错入口

从仓库根目录执行。

- 只装脚本依赖时用 `npm install --ignore-scripts`。当前没有 `prepare` 脚本；`upgrade:init` 需单独执行，会联网调用 `npx skills`。
- `npm run upgrade:init` 默认按清单顺序安装全部可执行条目，只写入当前项目的 `.agents/skills/`。它使用 `--agent universal`，不加 `-g`，不安装到其他 Agent 目录。`--skill <name>` 可重复，并覆盖 `--<group>` 的并集。缺少 `repo` 和 `name` 的条目会跳过，不中断后续条目。校验失败或某条安装非零退出时，不启动后续条目，退出码为 1。自动化验证用 `node --test scripts/upgrade/init.test.mjs`，不要运行真实 `npx`。
- `npm run deploy` 在缺少 `-t` 时以退出码 1 结束，不创建链接。
- `-t agent` 默认写入 `~/.agents/`（例如 `~/.agents/skills`）。`--mode local` 写入当前目录的同名隐藏目录。`-t project <project dir>` 把现有 `skills/`、`commands/`、`rules/` 直接链到该项目目录。Codex 只链 `skills/`。
- `npm run build` 在单个清单写入失败后仍继续。完成时除退出码外，还要看 `Failed to update` 日志和实际清单差异。
- `skills/**/test-prompts.json` 是场景清单，不是测试运行器。清单存在不等于已验证。
- 仓库里有技能文件，不等于当前会话已安装该入口。依赖缺失时核对会话可调用的技能。

## 边界

### 每次都做

- 以当前文件和调用链核对前提、逻辑和缺口。
- 修改代码或脚本时同步更新 README.md、README_CN.md，以及本文件或下表中受影响的任务文档。保留仍然有效的约束。
- 编辑前看工作区和暂存区，保留用户已有改动。改技能时核对其现有 references。
- 创建或更新 skill 时，必须同步创建或更新该技能目录下的 `README.md`；仅当该 skill 本身被 `.gitignore` 明确排除时豁免。README 面向人类读者，采用中文，措辞简洁但内容充分，说明技能用途、内部流程，以及触发技能或路由到不同流程的提示词与对应行为，让读者能据此明确理解该技能。内容以当前 `SKILL.md` 及其引用文件为准。
- 报告里分开写已执行、未执行和环境阻塞。

### 先确认

- 只在缺少必要授权时提问。本轮和此前会话已经明确的范围直接沿用。
- 创建分支要由用户指定。创建 commit 要由用户要求。
- 扩大任务范围，或全文替换某份受保护文档，要有针对该文档的授权。局部更新不能推出全文替换。

### 硬边界

- 保留用户的暂存内容和后续编辑。本仓库不做测试提交。
- 部署和联网升级的验证只写临时目录，不写入真实用户 harness。
- 只有实际跑过的检查才能写成通过。快照外的工作区结果、零测试、环境阻塞和未执行的恢复场景保持为未验证。

## 按任务阅读

| 何时阅读 | 文档 | 用途 |
| --- | --- | --- |
| 修改部署路径、链接去重或部署验证 | [部署](docs/agents/deploy.md) | 目标目录和隔离验证 |
| 修改技能或规则的升级来源、分组、下载方式或报告 | [升级器](docs/agents/upgrade-skill.md) | 共用下载、失败保留和回归 |
| 修改 doc-helper 的注释、README 或交付规则 | [doc-helper 回归](docs/agents/skill-regression.md#doc-helper) | 语言与输出范围路由、符号级完成状态、验证边界 |
| 修改 `skills/` 下其他自有技能 | [技能回归](docs/agents/skill-regression.md) | 对应技能的场景和禁止降级；含 commit-helper 混合意图识别 |

## 完成

- 本轮 diff 只覆盖授权范围。README 两种语言里的同一命令保持一致。本文件不超过 200 行。
- 改动对应的验证已经执行，或明确写成未执行。不为核对文档标题而运行真实部署、联网升级或依赖安装。
- 报告实际结果和遗留问题。用户未要求时不创建分支、不提交。
