# Commit Helper

汇总 git 改动、拟定结构化提交说明并安全执行提交（Conventional Commits 风格标题 + 要点正文）。

## 问题

提交信息常写成文件清单、与 diff 不符，或误用 `git commit -m` 单行、跳过钩子、`--amend` 处理失败提交。

Commit Helper 约束：**并行采集 → 向用户摘要 → 按规范拟稿 → 按需暂存提交 → 报告结果**，且遵守 git 安全红线。

## 内含内容

| 步骤 | 内容 |
| ---- | ---- |
| Collect | 并行 `git status` / `diff` / `diff --staged` / `log`；扫描密钥与敏感文件 |
| Summarize | 用短文说明改了什么、为何改（对应标题与每条 `- ` 要点） |
| Draft | `{type}: {title}` + 空行 + `- ` 列表；类型见 `references/commit-message-format.md` |
| Stage & commit | 按需 `git add`；多行正文用 **heredoc**；钩子失败则修复后**新提交**（非默认 amend） |
| Report | 改动摘要、实际提交命令/全文、提交后 `git status` |

**Iron Law**：不改 `git config`；不执行 push/rebase/reset 等破坏性命令；除非用户明确要求，否则不 `--no-verify`、不 `--amend`；提交说明必须反映**真实 diff**。

细则见 `references/git-safety.md`、`commit-message-format.md`、`staging-and-hooks.md`。

## 安装

```bash
npx skills add j-show/ai-everything --path skills/commit-helper
```

## 用法

安装后通过技能名或描述中的触发词调用，例如：

```
/commit-helper
帮我提交
写提交信息
总结改动并提交
```

示例：

```
/commit-helper
只拟提交说明，先不要 commit
用 feat 类型提交
```

仅拟稿时：完成 Draft 后停止，不执行 Stage & commit。

## 提交信息格式（摘要）

```text
{type}: {title}

- {要点 1}
- {要点 2}
```

常用 `type`：`feat`、`fix`、`docs`、`refactor`、`test`、`chore` 等（完整表见 `references/commit-message-format.md`）。

## 目录结构

```
commit-helper/
├── SKILL.md
└── references/
    ├── git-safety.md              # 禁止项与并行采集
    ├── commit-message-format.md   # 类型、标题与正文结构
    └── staging-and-hooks.md       # 暂存范围、heredoc、钩子失败处理
```

## 与斜杠命令的关系

请使用 `/commit-helper` 或依赖技能描述中的触发词（如 `commit`、`提交`、`git commit`）。

## 许可证

MIT
