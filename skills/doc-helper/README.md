# Doc Helper

根据实现代码补全 JSDoc、关键步骤注释与 README（原 `commands/doc.md` 能力，已迁移为本技能）。

## 问题

文档滞后或写成理想设计；注释堆砌；README 重复 API 说明书。

Doc Helper 约束：**摸底 → JSDoc → 关键注释 → README → 自检**。

## 内含内容

| 步骤 | 内容 |
| ---- | ---- |
| Survey | 入口、API、`package.json`、README；跳过 test/dist/.cursor 等 |
| JSDoc | 符号级文档与 Context7 第三方核对 |
| Inline | 仅关键步骤写「为什么」 |
| README | 项目级说明与中英版本规则 |
| Self-check | 与实现一致、路径可验证 |

## 安装

```bash
npx skills add j-show/ai-everything --path skills/doc-helper
```

## 用法

```
/doc-helper
```

示例：

```
/doc-helper scripts/
只补 README
```

## 与斜杠命令的关系

请使用 `/doc-helper` 或技能自动触发。

## 目录结构

```
doc-helper/
├── SKILL.md
└── references/
    ├── jsdoc-conventions.md
    ├── inline-comments.md
    └── readme-guide.md
```

## 许可证

MIT
