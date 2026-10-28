---
name: grilling-requirement
description: "将功能需求或缺陷描述澄清为已编号的 requirement.md；用于需求拷问、书面歧义与已授权需求变更的澄清，或由 dev-requirement / dev-debug 调用。支持自定义 pre-tag（默认 TK）和已有任务续跑。"
---

# Grilling Requirement

只负责需求阶段：检查依赖 → 固定 task-id → grilling 确认并落盘 → grilling-with-docs 澄清书面歧义。两个访谈阶段分开执行；推荐不等于用户确认。

## 输入与输出

- 输入：用户原文、目标项目、可选 pre-tag（默认 `TK`）、已有 task-id 和确认记录；缺陷调用方应注明任务类型。
- 新 ID 格式：`<pre-tag>-<YYYYMMDD>-<feature-name>`。规则与需求模板统一在 `references/artifacts.md`。
- 唯一主产物：目标项目 `docs/<task-id>/requirement.md`。domain-modeling 的根目录术语表与 ADR 不替代它。
- 本技能不检查 brainstorming，不写 proposal.md，不调用 writing-plans，不进入编码。

`pre-tag` 是调用参数，不是自动安装或命令行脚本；编排方传入的 DR / DD 覆盖默认 TK。

## Step 0: 确认依赖 ⛔ BLOCKING

确认下列需求技能已安装且当前会话可调用（以会话技能列表为准，不以仓库路径推断）。方案与编码依赖由调用方在对应阶段检查：

| 技能 | 角色 |
| --- | --- |
| `grilling` | Step 2：把用户输入问到共同理解 |
| `grilling-with-docs` | Step 3：澄清书面歧义、冲突及本轮已授权的需求变更 |
| `domain-modeling` | Step 3：由 grilling-with-docs 加载，收术语与决策 |

加载时用会话里该技能的登记入口。有技能调用工具就用它；没有就读取登记的 `SKILL.md` 并遵守，包括它点名的 references。读失败时不要改读仓库里另一份同名技能。

任一项缺失时立即停止，只输出：

```text
缺少已安装技能：<缺失名称>

请先安装后再运行本技能：
- grilling、domain-modeling：在 ai-everything 仓库根目录执行 `npm run upgrade:skill -- --skill grilling --skill domain-modeling`，再部署到当前 harness（如 `npm run deploy:cursor`）
- grilling-with-docs：随本仓库技能一起部署
```

三项都在时，把用户整段输入当作 `{{input}}`，进入 Step 1。不问「要不要开始」。

从 `{{input}}` 取出任务意图；用户点名多件可独立交付的任务时，只问一次本轮覆盖哪一件。命名和续跑边界见 `references/examples.md`。

## Step 1: 固定 task-id ⛔ BLOCKING

读取 `references/artifacts.md`，生成并宣布 `task-id`。

问自己：这句话里哪一个可交付功能会变成 feature-name？名称只称呼功能或缺陷现象，不称呼还没拍板的规则或未经证实的根因。订单退款用 `order-refund`；列表转圈用 `order-list-spinner`。名称能从原话稳定得出时直接采用，并告诉用户。得不出唯一名称时只问一次，等待回答后再进入 Step 2。

`docs/<task-id>/` 已存在时，按 `references/artifacts.md` 的「继续已有 task-id」执行。已有明确的续跑选择和确认记录直接沿用；文件存在本身不能证明澄清或批准已完成。

## Step 2: grilling → requirement.md ⚠️ REQUIRED

加载并遵守已安装的 **grilling**。输入是 `{{input}}`。

用户带进两条不能同时照字面执行的规则时，第一轮只问这一题：两条是合成一个条件（由用户说出怎样才算同时成立），还是只保留其中一条。给出一个具体推荐并等待。推荐被接受之前，不把任何一条写入「已确认行为」，也不追问用户没有提出的决定。用户再次只重复「两个都要」，却没有说出合成条件时，不写文件，把同一个推荐再问一次。第二次仍不选择时停止，不进入 Step 3。

前沿问完、用户确认共同理解之后，按 `references/artifacts.md` 写入 `docs/<task-id>/requirement.md`。已确认行为编号。进入 Step 3 前，「未决」为「无」。

此步不写 proposal.md，不改产品代码，不加载 domain-modeling。缺陷任务确认可观察行为，用户推测仍标为推测。允许只读取证；若开展技术诊断，先按 Step 0 的登记入口规则加载 systematic-debugging，缺失只暂停诊断，不阻塞独立行为澄清。插桩和修复实验交回调用方。

## Step 3: grilling-with-docs → 更新 requirement.md ⚠️ REQUIRED

加载并遵守已安装的 **grilling-with-docs**（它会加载 **domain-modeling**）。源文件与更新目标都是 `docs/<task-id>/requirement.md`。路径已经锁定，不要再问输出路径。

覆盖：将当前文档、确认记录与本轮输入对照，列出待处理清单：书面歧义或冲突、现有未决项，以及用户要求纳入的新增/变更行为。审查者建议但用户未要求采纳的行为不入清单。已有确认且不受变更影响的编号不重开。路径锁定、确认后再写、domain-modeling 仍按 grilling-with-docs 执行。

清单为空且「未决」为「无」时，不改文件；仍须实际完成书面检查及 grilling-with-docs 的适用门禁。清单非空时仅澄清其中影响验收的缺口；新行为即使措辞明确，也要纳入共同理解确认，不能因为旧稿无歧义而跳过。已有明确确认且与当前内容一致时复用，不重复询问。

🔴 写入门禁：待处理条目均有确认依据后，按 `references/artifacts.md` 就地更新对应段落与行为编号；未确认前不将推荐或新要求写入「已确认行为」。写前重读并保留不受影响的编号、无关说明和用户编辑。术语和决策写入根目录 `GLOSSARY.md` 或 ADR，不替代 requirement.md。

本轮待处理条目已确认并落实到需求文档、「未决」为「无」、书面检查完成且确认记录覆盖当前内容，才完成 Step 3。交付 task-id、requirement.md 路径、已确认编号、实际完成阶段及确认记录；单独调用到此结束，编排调用返回调用方，不生成方案或实现代码。


## 完成核对

- [ ] 从会话登记入口加载依赖，缺失或读失败时停止对应阶段
- [ ] task-id 固定，需求路径唯一，续跑证据与当前内容一致
- [ ] grilling 与书面歧义检查分开完成；行为已编号，未决为无
- [ ] 写前重读并保留无关内容；实际结果、未执行和阻塞分开报告
