---
name: dev-requirement
description: "把一句功能需求走完拷问、澄清、方案和实现。生成 dr-id（形如 dr-YYYY-MM-DD-feature-name），调用已安装的 grilling 把需求写入目标项目 docs 下该 id 的 requirement.md，再用 grilling-with-docs 与 domain-modeling 澄清歧义和冲突并更新该文件，然后用 brainstorming 把方案写入同目录 proposal.md。"
disable-model-invocation: true
---

# Dev Requirement

IRON LAW: 先固定 `dr-id`（`dr-YYYY-MM-DD-<feature-name>`）。功能产物只有目标项目的 `docs/<dr-id>/requirement.md` 与 `docs/<dr-id>/proposal.md`。domain-modeling 的根目录术语或 ADR 另写，不代替这两份文件。产品代码只实现 requirement.md 里已编号且用户已确认的行为。方案批准后先问是否创建子代理，不调用 writing-plans。

红线（出现就停，先改再继续）：

- 会话技能列表里没有某项依赖，仍继续访谈或写文件
- 用仓库里的同名目录代替已安装技能
- 一轮访谈同时交差 grilling 与 grilling-with-docs
- 把方案写到 `docs/superpowers/specs/`
- 用户尚未批准 `proposal.md` 就写产品代码
- 批准方案后调用 writing-plans
- 没问是否创建子代理就写产品代码
- 用户拒绝子代理后，实现范围与「是」不同
- 实现未编号、未确认或仍在「未决」里的行为

## Workflow

复制这份清单并逐项勾选：

```
Dev Requirement Progress:

- [ ] Step 0: 确认依赖 ⛔ BLOCKING
- [ ] Step 1: 固定 dr-id ⛔ BLOCKING
- [ ] Step 2: grilling → requirement.md ⚠️ REQUIRED
- [ ] Step 3: grilling-with-docs → 更新 requirement.md ⚠️ REQUIRED
- [ ] Step 4: brainstorming → proposal.md ⚠️ REQUIRED
- [ ] Step 5: 询问子代理后实现 ⚠️ REQUIRED（用户本轮只要文档时跳过）
```

**控制流**

1. Step 0 未通过时，只输出缺少技能并停止。
2. Step 1 把用户接受的 `dr-id` 记成内部变量。接受之后，同一次运行不再改日期或 feature-name。
3. Step 2 写完 requirement.md 之后才进入 Step 3。Step 3 更新完该文件之后才进入 Step 4。
4. Step 4 用户批准 proposal.md 之后进入 Step 5。不调用 writing-plans。
5. Step 5 先问是否创建子代理并等待。两种回答实现同一批编号。

## Step 0: 确认依赖 ⛔ BLOCKING

确认下列技能已安装且当前会话可调用（以会话技能列表为准，不以仓库路径推断）：

| 技能 | 角色 |
| --- | --- |
| `grilling` | Step 2：把用户输入问到共同理解 |
| `grilling-with-docs` | Step 3：针对已落盘需求澄清歧义与冲突 |
| `domain-modeling` | Step 3：由 grilling-with-docs 加载，收术语与决策 |
| `brainstorming` | Step 4：整理方案 |

加载时用会话里该技能的登记入口。有技能调用工具就用它；没有就读取登记的 `SKILL.md` 并遵守，包括它点名的 references。读失败时不要改读仓库里另一份同名技能。

任一项缺失时立即停止，只输出：

```text
缺少已安装技能：<缺失名称>

请先安装后再运行本技能：
- grilling、domain-modeling：在 ai-everything 仓库根目录执行 `npm run upgrade:skill -- --skill grilling --skill domain-modeling`，再部署到当前 harness（如 `npm run deploy:cursor`）
- brainstorming：`npm run upgrade:skill -- --skill brainstorming`，再部署
- grilling-with-docs：随本仓库技能一起部署
```

四项都在时，把用户整段输入当作 `{{input}}`，进入 Step 1。不问「要不要开始」。

从 `{{input}}` 取出功能意图。用户点名了多件可分开交付的功能时，先读 `references/examples.md` 的「多件功能」，只问一次本轮 `dr-id` 覆盖哪一件。

## Step 1: 固定 dr-id ⛔ BLOCKING

读取 `references/artifacts.md`，生成并宣布 `dr-id`。

问自己：这句话里哪一个可交付功能会变成 feature-name？名称只称呼功能，不称呼还没拍板的规则。订单退款用 `order-refund`，不用 `refund-reapply`。名称能从原话稳定得出时直接采用，并告诉用户。得不出唯一名称时只问一次，等待回答后再进入 Step 2。

`docs/<dr-id>/` 已存在时，按 `references/artifacts.md` 的「继续已有 dr-id」执行。不因为 requirement.md 已在就跳过 Step 3。

## Step 2: grilling → requirement.md ⚠️ REQUIRED

加载并遵守已安装的 **grilling**。输入是 `{{input}}`。

用户带进两条不能同时照字面执行的规则时，第一轮只问这一题：两条是合成一个条件（由用户说出怎样才算同时成立），还是只保留其中一条。给出一个具体推荐并等待。推荐被接受之前，不把任何一条写入「已确认行为」，也不追问用户没有提出的决定。用户再次只重复「两个都要」，却没有说出合成条件时，不写文件，把同一个推荐再问一次。第二次仍不选择时停止，不进入 Step 3。

前沿问完、用户确认共同理解之后，按 `references/artifacts.md` 写入 `docs/<dr-id>/requirement.md`。已确认行为编号。进入 Step 3 前，「未决」为「无」。

此步不写 proposal.md，不改产品代码，不加载 domain-modeling。

## Step 3: grilling-with-docs → 更新 requirement.md ⚠️ REQUIRED

加载并遵守已安装的 **grilling-with-docs**（它会加载 **domain-modeling**）。源文件与更新目标都是 `docs/<dr-id>/requirement.md`。路径已经锁定，不要再问输出路径。

覆盖：先列出书面需求里能读成两种行为的句子，以及互相矛盾的句子，只拷问这些。Step 2 已经确认且没有歧义的编号不要重开。路径锁定、确认后再写、domain-modeling 仍按 grilling-with-docs 执行。

用户确认后就地更新 requirement.md，保留未改动的已确认段落。术语和决策写入根目录 `GLOSSARY.md` 或 ADR，不替代 requirement.md。

更新后「未决」仍为「无」才进入 Step 4。此步不写 proposal.md，不改产品代码。

## Step 4: brainstorming → proposal.md ⚠️ REQUIRED

加载并遵守已安装的 **brainstorming**。输入是更新后的 requirement.md。

两处覆盖，其余门禁（先摆做法、用户选定、批准前不写产品代码）仍然有效：

1. 设计文档只写 `docs/<dr-id>/proposal.md`。内容要求见 `references/artifacts.md`。
2. 用户批准该文件之后，下一步是 Step 5，不调用 writing-plans。

brainstorming 的读者检查若派发了子代理，那不是实现子代理，也不能代替 Step 5 的询问。

用户本轮写明只要需求或方案时，批准后停止并做交付核对。

## Step 5: 询问子代理后实现 ⚠️ REQUIRED

读取 `references/implement.md` 并按它执行。

问自己：每条 diff 对应哪一个已编号行为？对不上的改动不要留。

## 反模式

- 把 grilling 的推荐答案写成用户已经确认
- 用文件是否存在跳过 Step 3 的歧义澄清
- 把 brainstorming 的读者检查子代理当成 Step 5 的实现子代理
- 子代理提示词只写「按方案实现」，不附已编号行为的原文

## 交付核对

- [ ] `dr-id` 匹配 `dr-YYYY-MM-DD-<feature-name>`，用户接受后未再改过
- [ ] 功能产物只新增或更新了 `docs/<dr-id>/requirement.md` 与 `proposal.md`（domain-modeling 的根目录术语或 ADR 除外）
- [ ] requirement.md 的已确认行为已编号，「未决」为「无」
- [ ] proposal.md 不在 `docs/superpowers/specs/`
- [ ] 本轮没有调用 writing-plans
- [ ] 写产品代码前问过是否创建子代理，并按回答执行；两种回答的编号范围相同
- [ ] 每条产品改动都能对应一条已编号且已确认的行为
