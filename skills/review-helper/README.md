# Review Helper

对变更范围进行代码审查、输出中文报告、逐项修复并跑校验直至通过（原 `commands/review.md` 能力，已迁移为本技能）。

## 问题

审查常脱离 diff 范围、建议冗长不可执行，或修完即止、未跑 `check`/`test` 闭环。

Review Helper 用 **报告→修复** 与 **校验→修复** 双循环约束模型，只评范围内变更，报告落盘 `.review/`。

## 内含内容

| 环节 | 内容 |
| ---- | ---- |
| Scope | `all` / 未推送相对 `origin` / 指定 commit + 暂存区 |
| 报告 | P0–P3、中文、`文件:起-止行`、保存 `.review/{时间}.md` |
| 修复 | 按报告逐项改代码，再复审直至无项 |
| 校验 | `pnpm check:all` → `check` → `test:all` → `test`（按存在性择一） |
| 忽略 | 各类 lock 文件 |

细则见 `references/scope-and-diff.md`、`report-format.md`、`verification-commands.md`。

## 安装

```bash
npx skills add j-show/ai-everything --path skills/review-helper
```

## 用法

```
/review-helper
```

示例：

```
/review-helper all
/review-helper abc1234
审查未推送改动
```

## 目录结构

```
review-helper/
├── SKILL.md
└── references/
    ├── scope-and-diff.md           # 范围与 diff 解析
    ├── report-format.md            # 优先级与报告模板
    └── verification-commands.md    # check/test 顺序与失败重试
```

## 与斜杠命令的关系

仓库不再提供 `/review` 斜杠命令；请使用 `/review-helper` 或依赖本技能的自动触发（描述中的关键词）。

## 许可证

MIT
