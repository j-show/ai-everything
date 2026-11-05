---
name: dev-debug
description: "把缺陷报告走完澄清、根因调查、TDD 修复、审查反馈闭环和最终验证。生成 dd-id，在目标项目 docs/<dd-id>/requirement.md 固定已确认行为，选择修复与审查的执行方式，只修复已编号范围。"
disable-model-invocation: true
---

# Dev Debug

只修复 requirement.md 中已编号且用户已确认的行为。先调查根因，再修复和验收；不新增方案或计划文档，不调用 brainstorming / writing-plans。

## 1. 取得缺陷需求

从当前会话登记入口调用 **grilling-requirement**；无调用工具时读取登记的 SKILL.md 并遵守其 references。后续依赖同样加载；缺失或不可读时停止对应阶段，报告原因并提示部署，不改用仓库镜像或自动安装。

传入用户完整输入、目标项目、已有 ID / 确认记录、任务类型「缺陷」，以及 `pre-tag=DD`、`proposal-mode=never`。返回的 task-id 记为 `dd-id`，产物为 `docs/<dd-id>/requirement.md`。

- 返回验收：需求书面澄清完成、已确认编号和「未决：无」。未满足时保留已有产物并报告待办或阻塞，不进入修复。
- 仅文档：验收后交付，不检查修复依赖或询问执行方式。否则进入下一节。续跑读取 `references/artifacts.md`。
- 行为有未确认变化时，携当前文件、确认记录和原参数回调 grilling-requirement，验收后再继续；始终保留 never。

## 2. 修复与验收 ⚠️ REQUIRED

读取并执行 `references/fix.md`。

问自己：每条 diff 对应哪一个已编号行为？对不上的改动不要留。

## 交付核对

- [ ] 产物与当前确认记录满足返回验收，交付终点符合用户限定
- [ ] 仅文档时未进入修复；否则已确定并执行修复与审查方式
- [ ] 每条产品改动都能对应一条已编号且已确认的行为
- [ ] 修复有根因证据、有效红绿验证和审查结论；缺失时报告阻塞或未验证，不宣称完成
- [ ] 最终结果包含编号验收证据、审查方式、未执行检查及剩余问题
