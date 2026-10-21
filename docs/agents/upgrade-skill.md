# 升级器

修改技能或规则的升级来源、分组、下载方式或报告时阅读。从仓库根目录执行。

入口只保留各自的目录、来源和技能后处理。下载、镜像替换、参数选择和报告调用共用模块：

- [scripts/upgrade-skill.mjs](../../scripts/upgrade-skill.mjs) 的 [SKILL_SOURCES](../../scripts/upgrade-skill.mjs) 写入 `skills/<skill>/`
- [scripts/upgrade-rule.mjs](../../scripts/upgrade-rule.mjs) 的 [RULE_SOURCES](../../scripts/upgrade-rule.mjs) 写入 `rules/<rule>/`
- [scripts/common-download.mjs](../../scripts/common-download.mjs) 提供下载、镜像替换和 CLI 辅助函数
- [scripts/common-report.mjs](../../scripts/common-report.mjs) 提供并行报告

`SKILL_SOURCES` 的字段是 `{ skill, repo, ref, path, groups }`。`RULE_SOURCES` 的字段是 `{ rule, repo, ref, path, groups }`。`ref` 是要下载的分支；当前每个技能都是 `main`。`RULE_SOURCES` 为空时，`upgrade:rule` 因没有可选规则而失败，不创建 `rules/`。帮助文本拼接 `<repo>/tree/<ref>/<path>`。`--git` 和 `--fetch` 都直接使用 `repo`、`path` 和 `ref`。分组从对应配置派生。修改后同步帮助、npm 快捷入口和双语 README。

## 下载

- 默认或显式 `--git`：按仓库和 ref 合并所选 `path`，每组只克隆一次，并做一次稀疏检出。需要 Git。
- 显式 `--fetch`：按仓库和 ref 分组。每组用内置 `fetch` 下载一次 `<repo>/archive/refs/heads/<ref>.tar.gz`，提取时才异步加载开发依赖 `tar`。未安装时 `--git` 和帮助仍可运行；`--fetch` 在提取前失败。先用 `npm install --ignore-scripts` 安装 `tar`。
- `--fetch` 与 `--git` 互斥。两者共用 Promise，避免并发重复克隆或下载。工作子目录按 `owner-repo` 命名；`ref` 不是 `main` 时再附上分支名。全部消费者结束后清理。
- 两者只是下载器不同，之后都走 staging → 后处理 → 差异比较 → 镜像替换、回滚、报告与清理。成功升级会替换本地镜像，包括删除。不调用 GitHub API，失败时不自动切换下载器。
- 技能要求上游路径内有 `SKILL.md`。规则的 `path` 必须是存在的目录，不要求 `SKILL.md`。
- 技能配置的 `groups` 包含 `superpower` 时，递归删除暂存区 `*.md` 中所有字面量 `superpowers:`。规则升级不做这一步。这一步失败则保留原内容。重复升级应无差异。
- 报告器使用配置里的 `repo`，条目名取 `skill` 或 `rule`。TTY 完成后保留全部文件变更行，不因并发数量裁掉最终明细。

有规则条目后，镜像写入 `rules/`。当前仓库没有忽略该目录。

## 已知命令陷阱

| 现象 | 处理 |
| --- | --- |
| `upgrade:tool` 和帮助示例仍使用已失效的 `--tool` | 指定 `--skill grilling --skill hatch-pet`。不要把旧快捷入口写成可用命令 |
| 帮助里的 `--skill` 分组与单技能选项重名 | 使用 `--skill skill-forge`。裸 `--skill` 会缺少参数 |

## 验证

完成标准：`node --test scripts/upgrade-skill.test.mjs scripts/upgrade-rule.test.mjs` 通过。技能套件覆盖参数组合、两种完整 CLI、每个仓库只克隆或下载一次、共享失败时保留原内容，以及缺失路径不影响同仓库的有效技能。规则套件覆盖空目录时的失败、以及无 `SKILL.md` 的目录可通过两种下载器写入临时目录。

联网验证只写临时目录，使用离线归档和本地 Git 仓库完成可离线的部分。
