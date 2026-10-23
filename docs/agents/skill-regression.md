# 技能回归

在修改 `skills/` 下自有技能时阅读。契约以该技能的 `SKILL.md` 和现有 `references/` 为准。

`skills/**/test-prompts.json` 被 Git 忽略。它是场景清单，不是测试运行器。文件缺失时按技能契约准备隔离场景。只改到的范围要验证；清单存在不等于已经跑过。

- 修改 agenter 时核对其 4 份 references。按 [acceptance-scenarios.md](../../skills/agenter/references/acceptance-scenarios.md) 检查零参数默认授权、根目录和成员扫描覆盖、三态交付、依赖加载、三个写作节点、局部更新和全文替换、只读大纲、写前变化、任务引用与重复执行。必需的写入或检查失败不能降为普通缺口。静态检查、场景走查和实际运行要分开写。
- doc-helper 的回归场景覆盖单文件注释、同步抛错、异步拒绝、捕获后的返回值、局部英文 README、第三方文档工具不可用，以及重复执行不产生改动。
- 修改 review-helper 时同步核对 3 份 references。隔离回归覆盖限定路径和暂存保护、`self` 已推送改动、只读与版本定位、行为覆盖、环境阻塞及重复执行。快照验证保留依赖和初始化上下文，核对归档属性影响、成功和失败清理，以及原资源保护。工作区结果不能冒充快照验证。未更新的暂存区不是修复失败。缺口不是通过。
- 修改 clean-helper 时同步核对 4 份 references。保留默认 `.review/clean-{timestamp}.md` 的清单 → 批准计划 → 结果和验证留档。回归默认报告、续跑复用、指定路径和严格禁写例外。例外不能替换默认能力。其余覆盖文件边界、动作授权、有效测试和用户修改的保留、失败分类及零测试。恢复只撤回本轮负责的改动，并保留暂存和后续编辑。实际触发后才能写成已验证。
- 修改 test-helper 时同步核对 4 份 references。隔离回归覆盖指定范围的修复或补测、无既有测试、有效失败与用户修改保留、契约不确定、环境阻塞、零测试及重复执行。验证命令要覆盖固定 glob、包工作目录、初始化与构建前置步骤。改动隔离逻辑时验证成功和失败清理、环境变量缺失或空值，以及原有资源保护。实现缺陷不能改成正确预期。报告实际测试进程状态。
- grilling-with-docs 从环境工具或会话登记入口加载两项依赖，只锁定明确指定或接受的目标。默认按范围更新并保留无关内容。全文替换要有针对该文档的明确授权。写前重读，以保留后续编辑。词汇表只用根 `GLOSSARY.md`，并保留无关条目。主产物等确认后写入。不可读来源要用替代材料，或获准省略并披露。省略不授权覆盖现有目标。修改时核对两份 references。隔离回归覆盖加载、路径角色、来源恢复、局部更新和全文替换、写前变化及重复执行。
- 修改 commit-helper 时同步核对 3 份 references。在临时 Git 仓库验证限定范围提交、部分暂存、指定路径已暂存改动、只读总结和拟稿、特殊字符，以及钩子失败或越界阻断。临时 index 验证原暂存条目和工作区保留、失败后环境恢复。不覆盖原 index。多行提交使用 UTF-8 消息文件，核对实际消息、tree 和范围。amend 和 push 的授权以 [git-safety.md](../../skills/commit-helper/references/git-safety.md) 为准。不在本仓库执行测试提交。
- 修改 agent-creator 时同步核对本地 test-prompts.json（Git 忽略）。必须调用已安装的 grilling。产物位于目标项目的 `.agents/skills/agent-<name>/`。配套脚本默认位于项目根 `scripts/`。回归覆盖命名、依赖缺失、增量更新、任务步骤间的数据传递与失败阻断、既有确认复用及隔离验证。创建 Agent 不授权执行其真实业务任务。
- 修改 coding-common 时核对 `SKILL.md` 与 `references/` 下的 `style.md`、`testing.md`、`security.md`、`review.md`。技能自包含：不引用本目录以外的规则文件，不点名外部代理、产品设置或外部文档。静态检查确认目录内没有外部 URL。该技能没有自动测试运行器；场景走查和静态检查要分开写。
- 修改 coding-typescript 时核对 `SKILL.md` 与 `references/` 下的 `style.md`、`testing.md`、`security.md`、`patterns.md`。必须先依赖已安装的 coding-common；TS 缺省只叠加在 `.ts`/`.tsx`/`.js`/`.jsx` 上。技能自包含：不引用本目录以外的规则文件，不点名外部代理、产品设置或会话钩子。静态检查确认目录内没有外部 URL，且正文要求调用 coding-common 而非读取其仓库路径。该技能没有自动测试运行器；场景走查和静态检查要分开写。
- 修改 coding-vue 时核对 `SKILL.md` 与 `references/` 下的 `style.md`、`testing.md`、`security.md`、`patterns.md`。必须先依赖已安装的 coding-common 与 coding-typescript；Vue 缺省叠加在 `.vue` 与明显的 Vue 模块上，`.vue` 内 `<script>` 同时叠加 coding-typescript。技能自包含：不引用本目录以外的规则文件（含 `rules/vue`），不点名外部代理、产品设置或会话钩子。静态检查确认目录内没有外部 URL，且正文要求调用已安装依赖技能而非读取其仓库路径。该技能没有自动测试运行器；场景走查和静态检查要分开写。
- 修改 coding-java 时核对 `SKILL.md` 与 `references/` 下的 `style.md`、`testing.md`、`security.md`、`patterns.md`。必须先依赖已安装的 coding-common；Java 缺省只叠加在 `.java` 上。新语法不超过工程已声明发行版。技能自包含：不引用本目录以外的规则文件（含 `rules/java`），不点名外部代理、产品设置或会话钩子。静态检查确认目录内没有外部 URL，且正文要求调用 coding-common 而非读取其仓库路径。该技能没有自动测试运行器；场景走查和静态检查要分开写。
- 修改 dev-requirement 时核对 `SKILL.md` 与 `references/` 下的 `artifacts.md`、`examples.md`、`implement.md`。需求阶段依赖已安装的 grilling、grilling-with-docs、domain-modeling、brainstorming；编码前另检查 test-driven-development、requesting-code-review、receiving-code-review、verification-before-completion。不得用仓库镜像路径代替登记入口。核对 dr-id 格式 `DR-<YYMMDD>-<feature-name>`（大写前缀、六位日期、小写功能名），保留两份文档落点、编号范围及不调用 writing-plans 的约束。回归覆盖三种执行方式、TDD 红绿、未提交及新增文件审查、混合反馈与复审、最终验证、依赖缺失、仅文档分支、批准后变更、自审和环境阻塞。另核对需求模式止于 Step 3、明确续跑不重复询问、文件存在不等于批准、用户改动保留，以及越界审查建议不阻塞独立的范围内修复。有效失败、零测试、未验证及独立审查缺失不得混称通过。场景清单见 examples.md；静态检查、场景走查和实际隔离执行分开报告。
- 修改 dev-debug 时核对 `SKILL.md` 与三份 references（artifacts、examples、fix）。需求阶段检查 grilling、grilling-with-docs、domain-modeling；修复阶段另检查 systematic-debugging、test-driven-development、requesting-code-review、receiving-code-review、verification-before-completion，使用会话登记入口。保留 `DD-<YYMMDD>-<feature-name>` 格式的 dd-id、单份 requirement.md、编号范围及不调用 brainstorming / writing-plans 的约束。按 examples.md 三组场景验证根因调查、有效红绿、实验成功与失败的恢复、用户编辑重叠时保留现场、已有红灯复用、三次失败停止、混合反馈及复审；覆盖三种执行方式、自审披露、未提交和新增文件审查、最终证据、仅文档与依赖缺失、明确续跑、批准后变化及用户改动保留。场景清单不是运行器；实际隔离执行、静态检查、走查和阻塞分开报告，未验证不能宣称通过。
- 修改 subagent-driven-development1 时核对 `SKILL.md`、三份 prompt 模板和 `references/`。用户点名了计划文件但读不到时，只输出「计划文件不存在：<path>」并停止。`sdd-workspace`、`task-brief` 或 `review-package` 非零退出时把命令和 stderr 写入账本且不派发；除缺少 bash 时的 `review-package` 替代写法外，仍失败则按停止条件 4 停下。非 DONE 按失败表处理，BLOCKED 不换条件重试同一模型。没有点名计划文件时调用已安装的 brainstorming，不读取仓库路径。终审调用已安装的 requesting-code-review。计划工作区在 `<repo-root>/.works/sdd/`。终审干净后给出合并、PR 或保留分支并等待选择。该技能没有自动测试运行器；场景走查和静态检查要分开写。

完成标准：上面与本次改动对应的场景已经在隔离环境执行，或报告写明哪一项未执行以及原因。
