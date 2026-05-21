# Test Helper

检索实现代码并按当前行为重写测试用例（原 `commands/test.md` 能力，已迁移为本技能）。

## 问题

测试常与实现脱节：用例从旧测试或注释推断行为，断言过期，或过度 mock 导致集成路径从未执行。

Test Helper 用固定六步工作流约束模型：**定范围 → 读实现 → 建契约清单 → 重写用例 → 跑测试 → 自检**。

## 内含内容

| 步骤 | 内容 |
| ---- | ---- |
| Scope（范围） | 用户指定目录则只改该目录对应用例，否则全量；识别测试命令与文件 |
| Discover（检索实现） | 语义 + 精确搜索，从入口沿调用链记录 I/O、副作用、错误分支 |
| Contract（契约清单） | 可观察行为列表，作为重写前的对齐检查表 |
| Rewrite（重写） | 替换优于修补；隔离时间/网络/文件系统；一用例一行为 |
| Verify（验证） | 按范围跑测试；区分测试错误 vs 实现缺陷 |
| Self-check | 权威实现已定位、断言可对应分支、测试通过或失败已说明 |

细则见 `references/` 下四个文件，执行时按步骤按需加载。

## 安装

```bash
npx skills add j-show/ai-everything --path skills/test-helper
```

## 用法

```
/test-helper
```

或指定目录，例如：

```
/test-helper tests/unit/auth
只重写 src/foo 相关测试
```

## 目录结构

```
test-helper/
├── SKILL.md                              # 核心工作流、铁律、反模式与交付清单
└── references/
    ├── implementation-discovery.md         # 如何检索与追踪实现
    ├── contract-checklist.md             # 契约清单格式
    ├── test-rewrite-patterns.md          # 重写、隔离、命名与覆盖率
    └── verification.md                   # 运行测试与失败分类
```

## 与斜杠命令的关系

仓库不再提供 `/test` 斜杠命令；请使用 `/test-helper` 或依赖本技能的自动触发（描述中的关键词）。

## 许可证

MIT
