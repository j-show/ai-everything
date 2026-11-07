# Codex 真实宿主验收（2026-11-06）

## 结论和范围

修复后，当前 Codex **桌面原生子代理宿主**的四个临时场景全部实际到达 `DONE`，已知测试实例授权全部退役，任务 worktree 全部清理。

本轮桌面工具没有 agent_type 参数，worker 通过显式读取包内角色与专用 Skill 执行，不是假脚本模拟。此前独立 CLI 已验证原生 task-worker 类型可加载及并行/rebase 的部分路径，但修复后的独立 CLI 复测受自动审批超时阻塞；不能把桌面结果写成该 CLI 已全程通过。Claude 未验收，不外推其他版本、权限配置或任意项目。

跨设备接续见 [handoff.md](handoff.md)；[便携历史摘要](evidence/codex-desktop-summary.json)不包含原始用户日志，不能替代实时退役证明。以下结果发生于 2026-11-06，不代表新设备已通过。表中提交属于临时夹具仓库，不属于本源码仓库历史。

## 根因与修复

宿主暴露的是可恢复的 completed/interrupted 线程，原协议却要求证明线程终止才能清理或换人。修复没有把 interrupted 改成 STOPPED，而是增加 `RETIRED`：基于真实日志证明执行静止、工具/cell/命令排空后撤销任务授权。

- 核对同根 session、直接控制器、线程/实例身份、预留到绑定的时间窗及真实 list_agents 调用结果。
- 跟踪异步 cell 与 shell session 到实际完成，包括 exec→write_stdin→wait 链；不透明输出需要原生 CommandExecution 终态支撑。
- 清理、释放、接管、集成、完成均复查当前和历史退役日志；日志新增活动则阻塞，旧 attempt 回报拒绝。
- 不声称线程记录被删除，不支持未追踪后台进程或对抗恶意进程直接绕过协议写文件。

## 实际结果

| 场景 | 验收路径 | 最终提交 |
| --- | --- | --- |
| 正常并行 | 两原生 worker、独立 worktree、提交、必要 rebase、集成验证、退役清理、主代理终审、DONE | `779f30e155021dfc8d4730073a7cd4d0d1a742ea` |
| 创建返回丢失 | 绑定边界受控注入；找回原实例无重复创建；退役释放后明确新 attempt 2 完成任务并 DONE | `01b39f155b3b0150f6f5a8fbb04f3977d561f37d` |
| rebase | 同原始基线，真实 REBASE_REQUIRED，原 b 实例恢复、重放、重新验证、集成清理、DONE；a 同时验证了 NEEDS_CONTEXT/resolve | `3cc625cd66c75bc1a323e37bb9fca1013716ed5a` |
| 停止后接管 | 老 worker 保留 partial 未提交文件；真实 interrupt 返回 running、后查 interrupted；验证退役后新实例 attempt2 保留现场并修复、提交、集成、清理、DONE | `98ada91f6ee010be55e748341a9548f77a669261` |

创建返回丢失是控制器绑定边界故障注入，不是真实网络丢包。停止发生在无文件工具运行的安全检查点；没有把此结果外推为任意后台进程都能自动回收。所有 Git 写操作仅在临时仓库进行。

## 计数与证据

- 8 个实际原生 worker，每个明确实例/attempt 只创建一次，重复派发 0。case2 后续重试与 case4 替代者是明确新 attempt。
- 四运行均 DONE；活动任务授权 0、已知活动写入者 0、测试 worktree 剩余 0，四目标仓库干净。旧授权重放实际拒绝 `Stale attempt`。
- 8 份宿主线程原日志保留，退役时 SHA-256 到最终独立复核未变；不把线程记录保留称为活动孤儿，不从局部列表断言宿主全局未知孤儿为 0。
- 用户运行中人工交互 0；控制器记录过夹具转义修正、读取范围解释和正常 rebase 调度，worker 自行修正过命令转义/Windows file URL。错误输出未当作有效红灯或通过证据。
- 本轮完整自动回归 66/66，通过静态解析/链接/语法检查；独立审查 R1–R4 与不透明命令边界已复核。没有修改真实用户配置，未部署到真实 harness。

原始命令、输入输出、状态文件、worker 红绿证据及宿主 call_id 保存在本轮临时验收根 `agent-host-acceptance-pk0k4gi4` 下的 `desktop-*-finished.json`、`desktop-independent-audit.json`、`desktop-evidence/` 及 `codex-postfix-acceptance.md`。原始用户会话日志不随仓库提交。前轮 CLI 失败现场另行保留，不伪报为本轮已清理现场。
