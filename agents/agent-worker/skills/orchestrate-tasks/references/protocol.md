# 运行协议

资源包与主 Agent 已更名为 agent-worker；状态目录与临时分支前缀继续使用 task-orchestrator，兼容历史运行。重命名不迁移已有 worktree、运行记录或分支。

命令入口是 `<packageRoot>/scripts/orchestrator.mjs`。所有命令使用 `node <入口绝对路径> <command> <目标仓库绝对路径> [input.json]`；省略文件时 JSON 从 stdin 输入，空 JSON 只适用于 preflight。路径含空格时由调用工具按参数传递。stdout 为 JSON，stderr 为明确失败；退出 0=成功、2=需 rebase、1=阻塞/非法输入。脚本没有模型或子代理 API，代理调度由宿主提供。

## 初始化与调度

schema 2 的 `init` 输入：`source` 为已确认需求的绝对文件路径；`confirmation` 为任务树及 brief 确认记录；`globalConstraints` 为全局约束数组（可空）；`limit` 默认 3；`tasks` 为任务图；可选 `worktreeRoot` 为已授权、非产品 checkout 内的目录。

```json
{
  "source": "D:/project/docs/requirement.md",
  "confirmation": "用户确认当前任务树、技术做法与验收条件",
  "limit": 3,
  "tasks": [{
    "id": "login-api",
    "kind": "feature",
    "goal": "实现登录接口",
    "nonGoals": ["不增加第三方登录"],
    "constraints": ["沿用当前认证服务"],
    "verification": [["node", "--test"]],
    "interfaces": {"provides": [], "consumes": []},
    "behaviors": ["B1: 已确认行为原文"],
    "acceptance": ["有效输入可登录，无效输入明确失败"],
    "approach": "沿用已有认证服务及对应测试设施",
    "files": ["src/auth", "test/auth"],
    "dependencies": []
  }]
}
```

group 节点只用于归属，children 用 `parent` 引用；依赖只能指向叶子。files 是字面路径或目录，统一 `/`，不接收 glob、绝对路径、`..` 或 `.git`。init 返回 `id` 作为后续 `runId`。运行元数据在 Git common directory 的 task-orchestrator 目录，包含来源摘要；来源变化后停止沿用原确认。

`check-plan {tasks}` 校验完整 brief 与接口。接口 provides 项为 `{name,contract}`，consumes 项为 `{from,name,contract}`，消费方须经显式/传递依赖引用生产叶子，name/contract 必须一致；声明匹配不代表实际代码语义已验证。`task-brief {runId,taskId}` 返回完整任务、全局约束、来源、hash 与依赖提交，不携带主会话历史。

`status {runId}` 返回任务、事件和 ready。主代理先 `reserve-task {runId,taskId}`，原子占容量/文件范围，返回 DISPATCHING、attempt、reservationId、briefHash。之后才调用宿主创建工具；成功返回实例 ID 后，`bind-agent` 携带预留身份及 agentId 绑定，并向同一 worker 发送 START。

公共身份字段为 `{runId,taskId,attempt,reservationId,briefHash,agentId}`。worker 用完整身份 `start-task`，返回 worktree、branch、base 和 agent。绑定前的早到 start 可省 agentId，只返回 WAITING_FOR_BINDING，不创建 Git 资源；主代理绑定并恢复同一实例，不能再创建第二个实现者。重复同一绑定幂等，旧预留、复用旧实例或跨任务复用实例拒绝。

创建结果不明时主代理 `dispatch-uncertain` 携身份与 reason，保持 DISPATCHING/UNKNOWN。`dispatch-failed` 需 reason；确认从未创建还需 `noInstanceCreated:true,source:"host"或"user",evidence`；曾创建的实例先补绑、登记终止观察再释放。单纯超时、通用 block 或旧布尔值不能释放预留。主代理将平台实际剩余容量纳入 limit；共享文件串行，未知/等待/停止请求中的实例继续占容量。

## 申报与集成

`report` 携公共身份、`agentVersion`（最近 start/resume 返回的 agent.executionVersion）、reportId 和 kind。内部 base/result 对应 base_commit/result_commit；使用完整提交 SHA。同 reportId 同内容幂等，旧 attempt/预留/brief/执行版本拒绝；收到新上下文或 rebase 恢复结果后必须使用新执行版本。普通宿主轮询只更新观察版本，不使有效执行回报过期。

| kind | 额外字段 | 任务处置 |
| --- | --- | --- |
| DONE | base/result/evidence | 核实 Git 后 READY，实例 WAITING |
| DONE_WITH_CONCERNS | 完成证据、concerns 数组，每项 category=correctness/scope/info 和 message | BLOCKED，保留结果待主代理处置 |
| NEEDS_CONTEXT | 非空 missingContext 数组 | BLOCKED，无须提交成功证据 |
| BLOCKED | reason、attempted 数组（允许尚无尝试） | BLOCKED，持久保存失败历史 |

`resolve-report` 携身份、当前 reportId、resolution 与 action。只有全部信息性疑虑可 `acknowledge-info` 放行；正确性/范围问题必须 `continue` 回原实例处理后重新申报，不能直接改成成功。缺上下文亦用 continue 补充依据，身份与 attempt 不变。

绑定成功但尚未创建 worktree 时，也可用当前 agent.executionVersion 回报 NEEDS_CONTEXT/BLOCKED；补齐后返回 DISPATCHING，再使用相同预留与实例调用 start-task。未绑定 worker 仍只等待 START，不猜 agentId。通用 block 不能代替这条有绑定身份的分类回报。

evidence 是非空数组，每项包含 `command`（可执行文件及参数数组）、绝对 `cwd`、对应 `commit`、`exitCode:0`、`passed:true`、完整 `output`。必须填实际执行的输出；脚本只检查结构与版本，主代理还要读取原输出和确认验收覆盖，零测试或缺环境不能伪造通过。

`integrate {runId, taskId}` 仅主代理调用，要求 READY 且实例 WAITING。基线过期返回 REBASE_REQUIRED 与新 base；主代理先 `resume-task`（身份和 resolution）恢复原实例，回传新的 agent.revision 与精确基线，再由 worker rebase、解决冲突、重新验证并 report。Git 冲突进行中禁止申报。

集成成功状态为 MERGED_PENDING_VALIDATION。主代理运行集成检查并调用 `record-validation {runId,taskId,evidence}`，通过后状态 CLEANUP_PENDING；失败调用 `block {runId,taskId,reason}`。保留已集成结果和任务资源，暂停后续集成，交给 worker 修复。

`cleanup {runId,taskId}` 要求已有当前实例 STOPPED/FAILED 宿主观察；`workerStopped:true` 不能单独放行。主代理通过真实工具停止实例并记录观察后，脚本再核对提交归属、注册 worktree、分支和干净状态，先移除 worktree，再按预期 SHA 删除分支。失败保留状态，可幂等重试。全部 INTEGRATED 后进入 REVIEW_REQUIRED。

## 阻塞、恢复、完成

`agent-observation` 携公共身份、observationId、state、observedAt、source（host/user）、evidence 和 agentVersion。主代理在查询宿主前保存当前 agent.revision，并在回调中带原版本；start/resume/report/观察更新会递增版本，过期回调须重新查询，不能拿旧停止证据覆盖已恢复实例。重复观察幂等，终止状态不被迟到超时或心跳复活。source=user 仅用于用户明确确认，脚本核对标识/顺序，观察真实性由主代理从实际工具输出核实。

两种版本不可混淆：宿主观察的 agentVersion 对应 agent.revision；worker 回报的 agentVersion 对应 agent.executionVersion。后者只在 start/resume 开放新一轮执行时递增。查询/同态观察不改变执行版本，重复或迟到的旧宿主回调也不能影响恢复后的新版本。

实例状态是 CREATED、ACTIVE、WAITING、STOP_REQUESTED、STOPPED、FAILED、UNKNOWN。worker 的 `heartbeat` 只记进度，不证明已停止，也不把 UNKNOWN 变成 ACTIVE；主代理发现超时用 dispatch-uncertain 记录未知，禁止因失联自动重派。等待 rebase 的 WAITING 仍占实例容量；BLOCKED 且实例已终止才释放容量，但保留文件范围。

`block` 保存真实阻塞，禁止对 DISPATCHING 使用，以免创建仍在途却释放容量。`resume-task` 携当前身份及 resolution 恢复已知原实例，保持 attempt；不能恢复 UNKNOWN/终止实例。`retry` 仅用于换人，须当前身份、旧实例终止观察及新 resolution，产生新 attempt/预留，再创建并绑定全新实例，经 start-task 接管原 worktree。既有修改与失败计数保留；创建 INTENT 中断且尚无目录/分支时可重建，归属不明则保留现场。无新依据不反复 retry。

`resume {runId}` 先核对实际 Git 状态，宿主实例仍由主代理查询。应用锁只在同机 owner 已退出时回收，未知归属/PID/原生锁保留。MERGING 中断仅在“目标为旧 base 且干净”或“目标为 result 且干净”时恢复，否则 RECOVERY_REQUIRED。来源变化须重新核对确认。

schema 1 的 status/resume 只读返回 upgradeRequired。`upgrade-run {runId,tasks,confirmation,globalConstraints?}` 在确认补齐 brief 后备份原文件，原子保存 schema 2；原任务 ID/行为/文件范围/依赖不变。旧实例保留 attempt 与 worktree，生成新预留身份并置 UNKNOWN，宿主核对后传递新 brief 身份再 resume-task；旧报告作历史。已集成结果保留，不伪造停止观察。旧客户端隐式 start、仅靠 workerStopped 换人不再有效。

`finish {runId,reviewMode:"main-self-review",issuesClosed:true,review:<逐项处置摘要>,evidence}` 由主代理执行 reviewer 自审闭环后调用。要求全部任务已集成清理，最终工作区干净且证据对应当前 HEAD。只有 DONE 才交付整体完成；运行日志仍保留。公共技能依赖、平台权限或能力不足分别报告，不能假称脚本测试证明两平台已验收。

Git 集成锁只覆盖短时引用事务及状态操作；不会占锁等待 worker。预期旧值校验防止覆盖前进的目标分支；HEAD 指向和工作区在同步前后核对，无法证明安全的中断保留现场。脚本不强制 reset、不删除未知锁、不递归兜底清理。

集成前检查包含 ignored 的所有未跟踪路径，与任务结果文件/目录相撞即阻塞。清理时要求没有任何未跟踪文件，包括 ignored；可再生缓存和用户私有文件由其拥有者处理后再重试，脚本不自行删除。
