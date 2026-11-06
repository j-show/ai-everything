# 单任务执行

用于主代理分配的一个叶子任务。接收任务 brief 后创建独立 worktree，按 kind 路由：feature 使用公共 dev-requirement，bugfix 使用公共 dev-debug。

启动先核对已确认 brief 和预留身份，等待主代理绑定并发送 START；不能猜实例 ID 或在绑定前编辑。报告使用四类状态，携带 reservationId/attempt/briefHash/agentId；缺信息或阻塞无需伪造完成证据。原实例恢复继续相同 attempt，换人接管必须使用新身份。

复用主代理确认的需求编号、做法和验收条件，跳过新建子任务流程文档，保留适用的推演、根因调查、TDD、自审、验证和代码配套文档维护。验证后提交并申报 base/result。收到新基线则 rebase、解决冲突、重新验证，再次申报；等待主代理集成清理。

提示“实现任务 brief”进入开发；“基于最新 commit 重新申报”进入 rebase；“接管 attempt”先核对已有现场。缺输入、需求变化、冲突无法解决或测试阻塞时回主代理。覆盖规则见 [公共技能适配](references/development.md)，完整流程见 [SKILL.md](SKILL.md)。
