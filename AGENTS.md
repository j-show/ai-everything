# 仓库操作约定

- 修改代码或脚本时，同步更新 README.md、README_CN.md 和本文件，删除冗余说明。
- 未经用户指定，不创建分支；只有用户要求提交时才创建 commit。
- 修改技能时同步核对其现有 references，避免主流程与细则冲突；doc-helper 的回归场景覆盖单文件注释、局部英文 README、第三方文档工具不可用及重复执行不产生改动。
- 修改 agent-creator 时同步核对本地 test-prompts.json（Git 忽略）：必须调用已安装的 grilling；产物位于目标项目的 `.agents/skills/agent-<name>/`，配套脚本默认位于项目根 `scripts/`。回归覆盖命名、依赖缺失、增量更新、任务步骤间的数据传递与失败阻断、既有确认复用及隔离验证；创建 Agent 不授权执行其真实业务任务。
- 部署入口为 `scripts/deploy.mjs`；复用现有链接与冲突保护逻辑。
- `pnpm deploy:project <project dir>` 默认采用通用模式（等价于 `--general`），部署到 `<project dir>/.agents/` 下的 `skills/`、`commands/`、`rules/`；`--custom` 直接部署到项目目录下。两种参数互斥，可放在路径前后；缺失的源目录跳过。
- 保留 `deploy --type ... --mode user|local` 的现有路径约定；Codex harness 部署仅包含 skills。
- 修改部署行为后运行 `node --test scripts/deploy.test.mjs`，并用临时目录实测 pnpm 入口。
- 验证部署不得写入真实用户 harness 目录；临时目录中应覆盖已有内容保护和重复运行。
- 升级源 `SKILL_SOURCES` 使用 `{ skill, repo, path, groups }`，展示 URL 为 `<repo>/tree/main/<path>`；默认或显式 `--git` 使用本机 Git 浅层稀疏检出；显式 `--fetch` 使用内置 `fetch` 下载分支 `.tar.gz` 并用开发依赖 `tar` 提取；`--fetch` 与 `--git` 互斥。两者仅下载器不同，复用 staging、镜像替换、回滚、报告与清理；禁止调用 GitHub API，不自动切换下载器。报告器使用配置的 `repo` 字段。回归覆盖参数组合、两种完整 CLI、Git 失败保留原内容；使用临时目录、离线归档及本地 Git 仓库验证。修改后运行 `node --test scripts/upgrade-skill.test.mjs`；联网验证仅写临时目录。
