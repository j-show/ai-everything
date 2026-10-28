---
name: dev-requirement
description: "把功能需求走完拷问、澄清、方案和实现。固定 dr-id，在 docs/<dr-id>/ 写 requirement.md 与 proposal.md；方案批准后按已确认编号执行 TDD、代码审查、反馈修复和最终验证。"
disable-model-invocation: true
---

# Dev Requirement

IRON LAW: 通过 grilling-requirement 固定 `dr-id`（`DR-<YYYYMMDD>-<feature-name>`）。需求与方案产物只有目标项目的 `docs/<dr-id>/requirement.md` 与 `docs/<dr-id>/proposal.md`。domain-modeling 的根目录术语或 ADR 另写，不代替这两份文件。产品代码只实现 requirement.md 里已编号且用户已确认的行为。方案批准后确定实现与审查方式，执行 TDD → 审查 → 反馈修复 → 最终验证，不调用 writing-plans。

## Step 0–3: 调用 grilling-requirement

以下 Step 0–3 均指公共技能的对应步骤；Step 4 起为本技能后续流程。

先从当前会话技能列表解析并加载 **grilling-requirement**；有调用工具则使用登记标识，否则读取登记的 SKILL.md 并遵守其 references。同样的入口规则适用于后续依赖；仓库同名目录不代表已安装。缺失或读取失败时停止对应阶段并报告技能名与原因，提示部署到当前 harness 后重试，不自动安装。

传入用户完整输入、目标项目、已有 ID / 确认记录及下述参数。依赖检查、固定 ID、首次访谈、书面澄清、需求模板和续跑规则全部由 grilling-requirement 维护，不在本技能重复执行。仅当它返回书面澄清完成、已确认编号和「未决：无」时进入后续阶段；受影响行为改变时回调它的 Step 3。

- 参数：`pre-tag=DR`，功能需求；返回的 task-id 在本技能记为 `dr-id`。
- 只要需求：返回后交付。要求方案或实现：进入 Step 4。
- 继续已有方案或实现时读取 `references/artifacts.md`，核对批准记录与当前内容后恢复对应阶段。

## Step 4: brainstorming → proposal.md ⚠️ REQUIRED

按 Step 0 的登记入口规则检查并加载已安装的 **brainstorming**；缺失或读失败时保留需求并停止方案阶段。输入是更新后的 requirement.md。

两处覆盖，其余门禁（先摆做法、用户选定、批准前不写产品代码）仍然有效：

1. 设计文档只写 `docs/<dr-id>/proposal.md`。内容要求见 `references/artifacts.md`。
2. 用户批准该文件之后，下一步是 Step 5，不调用 writing-plans。

brainstorming 的读者检查不代替 Step 5 的执行方式选择；用户已拒绝所有子代理时，读者检查也在当前会话执行并披露自审。

用户只要方案时，批准后停止并做交付核对。

## Step 5: 编码与审查闭环 ⚠️ REQUIRED

读取 `references/implement.md` 并按它执行。

核对本轮生成的每条产品改动对应哪个已确认编号。越界时只撤回本轮可明确归属的改动，保留用户既有、暂存及后续编辑；无法分离时先说明冲突，不覆盖整个文件。

## 反模式

- 把 brainstorming 的读者检查子代理当成 Step 5 的实现子代理
- 子代理提示词只写「按方案实现」，不附已编号行为的原文
- 把环境错误算成 TDD 红灯、把零测试算成通过，或把自审称为独立审查
- 未核实审查意见就修改代码，或借审查增加未确认行为

## 交付核对

- [ ] 新 `dr-id` 匹配 `DR-<YYYYMMDD>-<feature-name>`，用户接受后未再改过；历史 ID 续跑遵守公共技能规则
- [ ] 需求与方案文档只新增或更新了 `docs/<dr-id>/requirement.md` 与 `proposal.md`（domain-modeling 的根目录术语或 ADR 除外）
- [ ] requirement.md 的已确认行为已编号，「未决」为「无」；只要需求时没有进入方案阶段
- [ ] 本轮包含方案时，proposal.md 不在 `docs/superpowers/specs/`
- [ ] 本轮没有调用 writing-plans
- [ ] 本轮包含编码时，写产品代码前已确定实现与审查方式，并按选择执行；三种方式的编号范围相同
- [ ] 每条本轮产品改动都能对应一条已编号且已确认的行为；用户原有改动保留
- [ ] 进入编码时已完成 `references/implement.md` 的验证与交付核对；自审、未验证和阻塞均如实披露
