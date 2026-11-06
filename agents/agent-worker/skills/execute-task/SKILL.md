---
name: execute-task
description: Execute one feature or bugfix leaf task, verify and commit it, then rebase and report until integration.
---

# 单任务执行

只处理主代理的一个任务。先读取 [公共技能适配](references/development.md) 和主调度技能的 [运行协议](../orchestrate-tasks/references/protocol.md)。

1. 核对独立 brief 的目标/非目标、B 编号原文、验收、做法、约束、文件范围、接口/依赖、验证命令和授权，以及 packageRoot/repo/run/预留身份。初始无需猜 agentId；等待主代理绑定后传来的 START，携 reservationId、attempt、briefHash、agentId 调用 `start-task`。早到只得到 WAITING_FOR_BINDING，不写 Git。恢复先核对原实例或新 attempt 及实际 worktree，禁止直接隐式启动。
2. 以返回的 worktree 为所有变更命令的绝对 cwd，读取其中项目规则和既有测试。需求开发从当前会话登记入口使用 dev-requirement；bug 修复使用 dev-debug。明确应用参考文件的授权覆盖：复用已确认 brief，不创建子任务需求/方案/调查文档，保留适用的推演、根因调查、TDD、审查和验证。
3. 当前 worker 自行实现及自审，不递归创建代理。只改允许范围，README/AGENTS/接口文档按目标项目要求维护。范围不足、需求变化、无法解决冲突向主代理报告。错误导入、零测试、缺环境不算有效红灯或通过。
4. 测试与审查通过后核对 diff 并提交，携完整预留身份、最近 start/resume 返回的 agent.executionVersion（report 的 agentVersion）、精确 base/result、reportId 和验证证据回报 DONE；有疑虑回报 DONE_WITH_CONCERNS 并分类。缺信息用 NEEDS_CONTEXT，无法继续用 BLOCKED，不伪造成功提交或测试；绑定后启动前也可请求上下文。报告后等待主代理恢复，提交不等于已集成。
5. 主代理返回新 base 并恢复本实例时，以同一 attempt 在任务分支 rebase，解决冲突并重新验证。成功后用新 reportId 回报新 base/result。Git 未完成或验证失败保留现场；新基线前进可迭代，真实失败无新依据就停止。`heartbeat` 只报告活动，不把自报心跳当宿主停止观察。
6. 由主代理集成、验证和清理。收到终止或接管通知后停止写入；不能自行删除 worktree 或回退目标分支。回报编号覆盖、命令/退出状态、根因证据（bug）、自审结论、未执行与阻塞。
