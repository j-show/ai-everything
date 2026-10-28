---
name: dev-debug
description: "把缺陷报告走完澄清、根因调查、TDD 修复、审查反馈闭环和最终验证。生成 dd-id，在目标项目 docs/<dd-id>/requirement.md 固定已确认行为，选择修复与审查的执行方式，只修复已编号范围。"
disable-model-invocation: true
---

# Dev Debug

IRON LAW: 通过 grilling-requirement 固定 `dd-id`（`DD-<YYYYMMDD>-<feature-name>`）。缺陷产物只有目标项目的 `docs/<dd-id>/requirement.md`。产品代码只修复该文件里已编号且用户已确认的行为；先调查根因，再测试、修复、审查和验证。修复前确定执行方式，已有明确选择直接沿用。

## Step 0–3: 调用 grilling-requirement

以下 Step 0–3 均指公共技能的对应步骤；Step 4 起为本技能后续流程。

先从当前会话技能列表解析并加载 **grilling-requirement**；有调用工具则使用登记标识，否则读取登记的 SKILL.md 并遵守其 references。同样的入口规则适用于后续依赖；仓库同名目录不代表已安装。缺失或读取失败时停止对应阶段并报告技能名与原因，提示部署到当前 harness 后重试，不自动安装。

传入用户完整输入、目标项目、已有 ID / 确认记录及下述参数。依赖检查、固定 ID、首次访谈、书面澄清、需求模板和续跑规则全部由 grilling-requirement 维护，不在本技能重复执行。仅当它返回书面澄清完成、已确认编号和「未决：无」时进入后续阶段；受影响行为改变时回调它的 Step 3。

- 参数：`pre-tag=DD`，缺陷任务；返回的 task-id 在本技能记为 `dd-id`。
- 仅文档：返回后交付。否则进入 Step 4；缺陷名称描述现象，不预设根因。
- 已明确续跑修复时复用需求完成记录，按 `references/artifacts.md` 恢复修复、审查或验收进度。

## Step 4: 调查、修复和验收 ⚠️ REQUIRED

用户本轮写明只要需求文档时，停止并做交付核对，不读取 `references/fix.md`。

否则读取并执行 `references/fix.md`：检查五项编码依赖，确定执行方式，完成根因调查、TDD、审查反馈闭环和最终验收。详细失败出口和依赖职责以该文件为准。

问自己：每条 diff 对应哪一个已编号行为？对不上的改动不要留。

## 反模式

- 把用户猜测当根因，或未复现就试补丁
- 用成功实验代替有效红绿，或恢复实验时覆盖用户后续编辑
- 把测试环境错误当预期红灯，把自审当独立审查
- 子代理提示词只写「按需求修」，不附已编号行为原文和「非目标」原文
- 顺手修编号之外的相邻问题

## 交付核对

- [ ] 新 `dd-id` 匹配 `DD-<YYYYMMDD>-<feature-name>`，用户接受后未再改过；历史 ID 续跑遵守公共技能规则
- [ ] 缺陷产物只新增或更新了 `docs/<dd-id>/requirement.md`（domain-modeling 的根目录术语或 ADR 除外）
- [ ] requirement.md 的已确认行为已编号，「未决」为「无」
- [ ] 没有 proposal.md，本轮没有调用 brainstorming 或 writing-plans
- [ ] 仅文档时未进入 Step 4；否则执行方式已确定，编号范围不随方式改变
- [ ] 每条产品改动都能对应一条已编号且已确认的行为
- [ ] 修复有根因证据、有效红绿验证和审查结论；缺失时报告阻塞或未验证，不宣称完成
- [ ] 最终结果包含编号验收证据、审查方式、未执行检查及剩余问题
