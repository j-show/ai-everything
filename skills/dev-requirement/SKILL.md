---
name: dev-requirement
description: "委托 grilling-requirement 自动完成需求澄清与技术方案，不询问是否生成方案。固定 dr-id，在 docs/<dr-id>/ 写 requirement.md 与 proposal.md；方案批准后按已确认编号执行 TDD、代码审查、反馈修复和最终验证。"
disable-model-invocation: true
---

# Dev Requirement

只实现 requirement.md 中已编号且用户已确认的行为，当前 proposal.md 批准后才能编码。不调用 writing-plans。

## 1. 取得需求与方案

从当前会话登记入口调用 **grilling-requirement**；无调用工具时读取登记的 SKILL.md 并遵守其 references。后续依赖同样加载；缺失或不可读时停止对应阶段，报告原因并提示部署，不改用仓库镜像或自动安装。

传入用户完整输入、目标项目、已有 ID / 确认记录、任务类型「功能需求」，以及 `pre-tag=DR`、`proposal-mode=auto`。返回的 task-id 记为 `dr-id`，产物为 `docs/<dr-id>/requirement.md` 与 `proposal.md`。

- 用户明确只要 requirement.md、禁止方案时改传 `proposal-mode=never`；“只要文档”仍用 auto。
- 返回验收：需求书面澄清完成、已确认编号和「未决：无」；auto 还须当前方案已批准。未满足时保留已有产物并报告待办或阻塞，不进入实现。
- 仅文档：验收后交付，不检查编码依赖或询问执行方式。要求实现：进入下一节。续跑读取 `references/artifacts.md`。
- 行为或方案有未确认变化时，携当前文件、确认记录和原参数回调 grilling-requirement，验收后再继续。

## 2. 实现与验收 ⚠️ REQUIRED

读取 `references/implement.md` 并按它执行。

核对本轮生成的每条产品改动对应哪个已确认编号。越界时只撤回本轮可明确归属的改动，保留用户既有、暂存及后续编辑；无法分离时先说明冲突，不覆盖整个文件。

## 交付核对

- [ ] 产物与当前确认记录满足返回验收，交付终点符合用户限定
- [ ] 本轮包含编码时，另行确定并执行实现与审查方式，不能沿用文档阶段代理安排代替选择
- [ ] 每条本轮产品改动都能对应一条已编号且已确认的行为；用户原有改动保留
- [ ] 进入编码时已完成 `references/implement.md` 的验证与交付核对；自审、未验证和阻塞均如实披露
