# Skill Forge

创建高质量的 Claude Code 技能，而不是 AI 随手生成的敷衍内容。

## 问题

大多数技能只是把一大段 Markdown 丢进 `SKILL.md`——没有结构、没有工作流、没有质量控制。模型面对一堵文字墙，抓不住重点，输出也不稳定。

Skill Forge 通过 **12 种经过实战检验的技能设计技巧** 来解决这些问题：如何高效管理上下文、如何逐步引导模型、以及如何防止它走捷径。

## 内含内容

| 技巧 | 解决的问题 |
|------|------------|
| Progressive Loading（渐进式加载） | 上下文膨胀——保持 `SKILL.md` 精简，按需加载细节 |
| Keyword Bombing（关键词轰炸） | 技能从不触发——编写真正能匹配用户意图的描述 |
| Workflow Checklist（工作流清单） | 执行不一致——用 ⚠️/⛔ 标记给模型一条可追踪的路径 |
| Script Encapsulation（脚本封装） | 浪费 token——把确定性操作包进脚本（零上下文成本） |
| Question-Style Instructions（提问式指令） | 输出模糊——用具体问题代替抽象指令 |
| Confirmation Gates（确认关卡） | 失控执行——在关键操作前强制模型暂停 |
| Pre-Delivery Checklist（交付前清单） | 质量缺口——在输出前加入可验证的具体检查项 |
| Parameter System（参数系统） | 灵活性不足——支持 `--flags`、部分执行、`--quick` 模式 |
| Reference Organization（参考文档组织） | 加载无关上下文——按领域组织，只加载所需内容 |
| CLI + Skill Pattern（CLI + 技能模式） | MCP 开销——用 CLI 工具替代 MCP Server |
| Iron Law（铁律） | 模型走捷径——设定一条模型绝不能违反的硬性规则 |
| Anti-Pattern Documentation（反模式文档） | 默认 AI 行为——明确列出**不要**做什么 |

## 安装

```bash
npx skills add j-show/ai-everything --path skills/skill-forge
```

## 用法

```
/skill-forge
```

按引导式工作流操作——从理解需求到打包可分发的 `.skill` 文件。

## 目录结构

```
skill-forge/
├── SKILL.md                          # 核心工作流（<250 行）
├── scripts/
│   ├── init_skill.py                 # 从模板初始化新技能
│   ├── package_skill.py              # 打包为 .skill 文件
│   └── quick_validate.py             # 校验结构与 frontmatter
└── references/                       # 按需加载，不预先全部读入
    ├── description-guide.md          # 如何编写易触发的描述
    ├── workflow-patterns.md          # 清单、确认关卡、交付前检查
    ├── writing-techniques.md         # 提问式提示、铁律、反模式
    ├── architecture-guide.md         # 渐进式加载、脚本、CLI+Skill
    ├── parameter-system.md           # $ARGUMENTS、标志位、部分执行
    └── output-patterns.md            # 模板、示例、交付清单
```

## 许可证

MIT
