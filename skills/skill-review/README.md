# Skill Review

按最佳实践审查 Claude Code 技能的质量，输出可执行的改进建议。

## 问题

技能写完后往往缺少系统化验收：描述是否真能触发、工作流是否可追踪、上下文是否臃肿、是否存在反模式——全凭主观感觉，难以复现。

Skill Review 通过 **五个审查维度** 与结构化报告格式，帮你发现问题并给出「改什么、改哪里、怎么改」，而不是笼统的「可以再优化一下」。

## 内含内容

| 维度 | 审查重点 |
|------|----------|
| Structure Compliance（结构合规） | 目录布局、`SKILL.md` 行数、frontmatter、脚本与 reference 是否被正确引用 |
| Description Quality（描述质量） | 触发关键词、Keyword Bombing、描述是否自洽、能否匹配用户自然语言 |
| Workflow Design（工作流设计） | 可勾选清单、⚠️/⛔ 标记、确认关卡、流程是否线性可跟 |
| Token Efficiency（Token 效率） | 铁律、渐进式加载、祈使句指令、脚本 vs 上下文、与 reference 是否重复 |
| Anti-Pattern Detection（反模式检测） | 模糊指令、占位符残留、过度说明、缺 guardrails、单体巨文件等 |

审查细则见 `references/review-criteria.md`；执行时在 Step 2 按需加载。

## 安装

```bash
npx skills add j-show/ai-everything --path skills/skill-review
```

## 用法

```
/skill-review
```

或指定路径：

```
/skill-review path/to/skill
```

按三步工作流操作：**加载目标技能** → **五维分析** → **输出优势与按优先级排序的建议**（每条须含 What / Where / Fix）。

## 目录结构

```
skill-review/
├── SKILL.md                          # 核心审查工作流与报告格式
└── references/                       # Step 2 分析时按需加载
    └── review-criteria.md            # 各维度的详细检查项与示例
```

## 许可证

MIT
