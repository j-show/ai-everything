---
name: orchestrate-tasks
description: Coordinate confirmed requirements as dependent leaf tasks, isolated workers, Git integration and final main-agent review.
---

# 任务调度

当前会话是主代理。运行前读取 [运行协议](references/protocol.md)，脚本调用、输入输出与恢复按该文件执行。

1. 确认 packageRoot 与目标仓库绝对路径、需求文档和用户确认记录。需求含糊时从会话登记入口转交 grilling-requirement。核对当前资源版本、宿主派发/通知/恢复能力和公共技能登记入口；缺失回报阻塞。运行 `preflight`，核对 Git/Node、工作区、权限及并发容量。
2. 拆出任务树及无环依赖：仅派发 feature/bugfix 叶子。brief 包含目标、非目标、B 编号原文、验收、技术做法、文件范围、验证命令和接口 provides/consumes。消费接口指明生产任务与 contract，通过 `check-plan` 核对依赖和契约；共享 README/配置也计入文件范围。检查声明之外的业务耦合，再展示给用户确认一次；需求取舍或越界时重新询问。
3. 将确认、来源、全局约束和任务图传给 `init`。默认并发 3，受宿主实际容量限制。读取 `task-brief`，先 `reserve-task` 原子预留为 DISPATCHING，再创建全新上下文 worker，只交付 brief、包根、预留身份；取得宿主 agentId 后 `bind-agent`，向同一实例发送含完整身份的 START，再由 worker `start-task` 创建 worktree。创建结果丢失用 `dispatch-uncertain` 保留预留，确认未创建或已终止才 `dispatch-failed` 释放。
4. 分类处理申报：DONE 核对差异与输出后尝试 `integrate`；DONE_WITH_CONCERNS 先核实，只有信息性疑虑可 `resolve-report` 放行；NEEDS_CONTEXT 补上下文恢复原实例；BLOCKED 改变依据后再继续，不无变化重试。REBASE_REQUIRED 通过 `resume-task` 把新 base 交回原实例，rebase/冲突处理/重新验证后再次申报。其他无关任务继续，实现与短时集成锁分开。
5. 集成后执行相关验证并 `record-validation`，失败则 `block` 保留现场。清理前记录真实终止观察；Codex 仅提供可恢复线程时，等待/中断并排空工具，由直接创建者查询实际状态，再用 `retire-agent` 核验原始日志后撤销任务授权，保留 completed/interrupted 而不伪称 STOPPED。之后才能 `cleanup`，布尔值不能替代证据。UNKNOWN/STOP_REQUESTED 继续占容量；依赖仅在前置任务 INTEGRATED 后解锁，集成未验证时暂停后续集成。
6. 全部任务 INTEGRATED 后，在当前主会话从登记入口使用 reviewer，明确用户已授权主代理自审。范围从运行 initial 到最终状态，覆盖全部任务与审查修复。主代理亲自核实、修复、复审、验证，每轮通过后独立提交修复；不派发审查/修复子任务，不改已集成历史。
7. 检查 B 编号覆盖、问题关闭、资源清理与最终证据后调用 `finish`。报告实际提交、验证命令、通过/失败/未执行/环境阻塞，标明主代理自审缺少独立审查。没有 DONE 或必要检查未通过不能宣称整体完成。

中断时 `resume` 核对 Git，并通过宿主查询核对实例；心跳只能记录进度。旧 schema 1 先只读识别，确认补齐 brief 后 `upgrade-run` 备份迁移，旧身份从 UNKNOWN 开始核对。原实例 `resume-task` 保持 attempt；换实例 `retry` 须旧实例终止观察，产生新预留并重新绑定，接管既有 worktree。RECOVERY_REQUIRED 保留不明现场，不强制重置或删未知锁。
