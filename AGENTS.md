# 仓库操作约定

- 修改代码或脚本时，同步更新 README.md、README_CN.md 和本文件，删除冗余说明。
- 未经用户指定，不创建分支；只有用户要求提交时才创建 commit。
- 部署入口为 `scripts/deploy.mjs`；复用现有链接与冲突保护逻辑。
- `pnpm deploy:project <project dir>` 默认采用通用模式（等价于 `--general`），部署到 `<project dir>/.agents/` 下的 `skills/`、`commands/`、`rules/`；`--custom` 直接部署到项目目录下。两种参数互斥，可放在路径前后；缺失的源目录跳过。
- 保留 `deploy --type ... --mode user|local` 的现有路径约定；Codex harness 部署仅包含 skills。
- 修改部署行为后运行 `node --test scripts/deploy.test.mjs`，并用临时目录实测 pnpm 入口。
- 验证部署不得写入真实用户 harness 目录；临时目录中应覆盖已有内容保护和重复运行。
- 修改升级脚本后运行 `node --test scripts/upgrade-skill.test.mjs`。
