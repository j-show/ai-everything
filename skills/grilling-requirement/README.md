# grilling-requirement：公共需求澄清

把功能或缺陷描述变成已确认、可验收的编号行为，写入目标项目的 `docs/<task-id>/requirement.md`。交付或返回调用方前，默认询问是否生成技术方案；同意后调用 brainstorming 写同目录 `proposal.md`，取得方案批准后交付。

公共入口允许被其他技能调用；dev-requirement / dev-debug 仍保留各自的显式入口。实际加载以当前会话登记为准。

## 提示词与行为

| 提示词 | 行为 |
| --- | --- |
| 使用 grilling-requirement 梳理订单退款需求 | 默认 TK，例如 TK-20261028-order-refund |
| 使用 grilling-requirement，pre-tag=OPS，梳理告警规则 | 使用自定义前缀 OPS |
| 继续 TK-20261028-order-refund | 核对文档、确认记录和本轮输入，只补缺失阶段 |
| 继续原任务，新增一个行为 | 仅澄清变更及其影响；确认后局部更新，保留旧编号和无关内容 |
| 需求确认好了，继续生成方案 | 复用需求确认，调用 brainstorming；仍需选择技术路线和批准方案 |
| 不生成方案，只要 requirement.md | 跳过方案，交付需求 |
| 使用 dev-requirement | 传入 DR / auto，自动生成方案，不询问是否生成 |
| 使用 dev-debug | 传入 DD / never，不询问、不生成方案 |

新 ID 为 `<pre-tag>-<YYYYMMDD>-<feature-name>`，日期使用本轮开始日，跨午夜不改；feature-name 使用小写英文数字和单个连字符。前缀以字母开头、仅含字母数字，保留指定大小写。历史六位日期 ID 只在明确续跑时沿用，不自动迁移。

## 内部流程

```mermaid
flowchart TD
    A[检查需求依赖] --> B[固定 task-id 与路径]
    B --> C[grilling 确认行为]
    C --> D[写 requirement.md]
    D --> E[grilling-with-docs 澄清歧义与需求变更]
    E --> M{proposal-mode}
    M -->|ask| Q{是否生成方案}
    M -->|auto| P[brainstorming 写 proposal.md 并获批准]
    M -->|never| F[交付或返回调用方]
    Q -->|是| P
    Q -->|否| F
    P --> F
```

依赖 grilling、grilling-with-docs、domain-modeling，使用会话登记入口，缺失时停止并提示部署。首次访谈与书面检查分开；确认后落盘，行为以 B1、B2 编号，未决为“无”才交付。已确认且不受变更影响的条目不重问。旧稿无歧义不代表新增行为已完成：先取得当前变更的确认，再接续编号写入，不能直接返回。术语和 ADR 不替代需求文件。

缺陷名称描述现象，用户猜测不当根因；只读技术诊断额外需要 systematic-debugging。仅在需要方案时检查 brainstorming，缺失则保留需求并报告方案阻塞。auto 只省略生成开关，不省略技术路线选择和批准；never 不触碰既有方案。续跑复用有效选择与批准，需求变化后更新受影响方案并重新批准。不调用 writing-plans 或写产品代码。冲突未解决、目标不可读或缺少确认记录时说明缺口；写前重读，保留无关内容及用户编辑。

- [SKILL.md](SKILL.md)：输入、依赖与步骤。
- [artifacts.md](references/artifacts.md)：ID、续跑、需求模板及方案契约。
- [examples.md](references/examples.md)：边界与回归场景。
