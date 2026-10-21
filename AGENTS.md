# AI Everything — 仓库操作约定

面向编码代理的技能与插件资源仓库。维护脚本使用 Node.js 22+ ES modules。安装、脚本表和技能概览见 [README_CN.md](README_CN.md) / [README.md](README.md)。

## 事实来源

```text
package.json ── scripts/build.mjs ── .{cursor,codex,claude}-plugin/
skills/      ── scripts/deploy.mjs ── harness 或项目目录的资源链接
上游仓库     ── scripts/upgrade-skill.mjs ── skills/ 中的镜像
上游仓库     ── scripts/upgrade-rule.mjs  ── rules/ 中的镜像
hooks/       ── SessionStart 配置与启动脚本
```

- 元数据与脚本入口以 [package.json](package.json) 为准。技能来源以 [SKILL_SOURCES](scripts/upgrade-skill.mjs) 为准，规则来源以 [RULE_SOURCES](scripts/upgrade-rule.mjs) 为准。两者的下载与报告调用 [common-download.mjs](scripts/common-download.mjs) 和 [common-report.mjs](scripts/common-report.mjs)。
- 技能契约以 `skills/<name>/SKILL.md` 及其 `references/` 为准。
- 自有技能随仓库维护。`.gitignore` 忽略 14 个上游镜像，以及 `.agents/`、`.review/`、`skills/**/test-prompts.json`。不能假设全新检出里有这些路径。
- `commands/`、`rules/` 和 `skills/using-ai-everything/SKILL.md` 当前缺失。部署跳过缺失资源。SessionStart 读不到该技能时输出错误回退文本。

## 易错入口

从仓库根目录执行。

- 只装脚本依赖时用 `npm install --ignore-scripts`。不加该参数会执行 `prepare` → `init:darwin`。
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
| 修改 `skills/` 下自有技能 | [技能回归](docs/agents/skill-regression.md) | 该技能的场景和禁止降级 |

## 完成

- 本轮 diff 只覆盖授权范围。README 两种语言里的同一命令保持一致。本文件不超过 200 行。
- 改动对应的验证已经执行，或明确写成未执行。不为核对文档标题而运行真实部署、联网升级或依赖安装。
- 报告实际结果和遗留问题。用户未要求时不创建分支、不提交。
