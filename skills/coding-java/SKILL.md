---
name: coding-java
description: "在 Java 仓库里编写或修改 .java：先走已安装的 coding-common，再用本技能内嵌的命名、record/不可变、Optional、领域异常、构造器注入、JUnit 5 与参数化查询缺省补齐语言缺省。用于实现 Java 功能、修 Java bug、补领域类型、写服务与仓储、加单元测试、改 JDBC/校验。用户会说：写 Java、按 Java 规范改、补这个类、JUnit、record、Optional、构造器注入。Also: coding-java, Java, JUnit 5, AssertJ, Mockito, record, sealed, PreparedStatement. 不处理纯文档、纯提交、视觉设计、会话钩子配置，也不审查用户未要求修改的改动。"
---

# Coding Java

IRON LAW: 通用编码流程以已安装的 **coding-common** 为准。本技能只补 Java 语言缺省。目标文件及其相邻代码优先；禁止用本技能目录之外的规则文件覆盖仓库写法。

红线（出现就停，先改再继续）：

- coding-common 未安装或当前会话不可调用，却继续改代码
- 用本目录 `references/` 覆盖仓库里已有的类型、注入、校验库或测试框架写法
- 为“更规范”把无关 `.java` 整文件改成 record、sealed 或另一种缩进
- 在低于工程发行版的语法上写 record、sealed、文本块或模式匹配
- 配置会话钩子、编辑器全局设置，或点名外部代理来代替本技能步骤

## Workflow

在内部复制这份清单并逐项勾选。不要把清单贴进给用户的回复。

```
Coding Java Progress:

- [ ] Step 0: 确认 coding-common ⛔ BLOCKING
- [ ] Step 1: 读取 coding-common 并执行其 Workflow ⚠️ REQUIRED
- [ ] Step 2: 对 .java 叠加本技能 references ⚠️ REQUIRED
- [ ] Step 3: 完成说明写明 Java 叠加项与冲突 ⚠️ REQUIRED
```

**控制流**

1. Step 0 未通过，不改文件。
2. Step 1 完整执行 coding-common（含其对齐仓库、实现、测试、安全与完成前自检）。
3. 每当 coding-common 要求读取其 `style` / `testing` / `security` 时，若改动触及 `.java`，同时读取本技能对应 reference，且仅采用其中与仓库不冲突的缺省。
4. 命中下面的失败分支时，先执行该行，再决定能否进入 Step 3。
5. Step 3 未写清叠加与冲突前，不把任务标成完成。

## Step 0: 确认 coding-common ⛔ BLOCKING

确认 `coding-common` 已安装且当前会话可调用（以会话技能列表 / Skill 工具为准，不以仓库路径推断）。

若缺失 → **立即停止**，不改文件。给用户的回复只有下面这一段，前面和后面都不要加句子：

```text
缺少已安装技能：coding-common

请先安装后再运行本技能：
- AI Everything 插件（含 coding-common）：Cursor 插件市场安装 ai-everything，或在仓库根目录执行 `npm run deploy:cursor`
- 亦可单独安装：
  - npx skills add j-show/ai-everything --path skills/coding-common
```

## Step 1: 执行 coding-common ⚠️ REQUIRED

读取并遵循已安装的 `coding-common` 的完整 Workflow（Step 0–7）。本技能不缩短、不跳过其中的阻塞步骤。

把用户的 Java 请求原样交给该流程：对齐仓库写法、判定改动类型、越界确认、实现、验证、安全自检、完成前自检、按需提交说明。

## Step 2: 叠加 Java references ⚠️ REQUIRED

仅当本次改动触及 `.java`（含其测试）时执行。`pom.xml`、`build.gradle` 与 `build.gradle.kts` 只用来读取已声明的 Java 发行版和已有测试命令，不套本技能的类型与命名缺省。

按 coding-common 当前步骤读取对应文件：

| coding-common 步骤 | 再读 |
| --- | --- |
| Step 3 实现 | `references/style.md`；需要缺省形状时再读 `references/patterns.md` |
| Step 4 验证 | `references/testing.md` |
| Step 5 安全敏感 | `references/security.md` |

套用 record、sealed、文本块、switch 表达式或模式匹配之前，先读出工程发行版：Maven 看 `maven.compiler.release`，否则 `maven.compiler.source` 或 `java.version`；Gradle 看 toolchain `languageVersion` 或 `sourceCompatibility`。读不到时，只用相邻 `.java` 已经出现的语法。

| 语法 | 最低发行版 |
| --- | --- |
| switch 表达式 | 14 |
| 文本块 | 15 |
| record、`instanceof` 模式匹配 | 16 |
| sealed | 17 |
| switch 模式匹配 | 21 |

叠加规则：

1. 仓库相邻文件已有写法 → 跟随仓库。
2. coding-common 与本技能都不冲突的缺省 → 两者都遵守。
3. 本技能条目与仓库冲突 → 跟随仓库，并在 Step 3 点明冲突条。
4. 仓库没有该类约定、且发行版允许时 → 使用本技能缺省（例如值对象用 record 或 `final` 字段、新类型用构造器注入）。服务查找方法按 `references/style.md`：明确失败时抛领域异常，不返回 `Optional`。仓储没有查到行时可以返回 `Optional`，由服务方法 `orElseThrow`。

不要把 `references/` 里的示例仓储、响应信封或构建器强加到已有模块上。

## 失败分支

| 触发条件 | 一线修复 | 仍失败兜底 |
| --- | --- | --- |
| coding-common 不在会话技能列表 | 🔴 STOP。回复只有 Step 0 的安装段，不改文件 | 不把仓库里的 coding-common 文件当作已安装 |
| 点名改动之外还有无关的 `.java` 要整文件改成 record 或统一缩进 | 只改点名文件。无关路径写入「未扩大的范围」 | 🔴 STOP，不改该路径，直到用户单独写出要改的路径 |
| 工程发行版低于上表，或发行版未知且相邻文件没有该语法 | 用相邻文件已有的类、字段与分支写法 | 不改构建文件来抬高发行版 |
| 仓库没有测试命令或编译命令 | 在「命令：」写 `未运行` 和原因 | 不新增 JUnit、AssertJ、Mockito、Testcontainers、JaCoCo 或构建脚本 |
| 仓库已有校验或测试写法 | 沿用已有注解、断言与 mock 扩展 | 不安装 Bean Validation、AssertJ 或 Mockito |

## Step 3: 完成说明 ⚠️ REQUIRED

给用户的回复使用下面五段，按此顺序，不要改标题，不要附上内部清单：

```text
行为：<一句可观察结果>
命令：<命令> 退出码 <n>
叠加：<本次用到的 Java 缺省，没有则写无>
跳过：<因仓库写法、发行版或范围未用的本技能条目，没有则写无>
未扩大的范围：<点名但未改的路径，没有则写无>
```

同一条命令跑了多次时，每条写一行，放在「命令：」下面。没有运行的检查写成 `未运行 <命令或编译>：<原因>`，仍然放在「命令：」下面。退出码只写实际进程的退出码。

## 诚实边界

- 不替代 coding-common；通用不可变、TDD 顺序、安全清单与完成前自检仍以 coding-common 为准。
- 不选择或安装仓库没有的测试框架、覆盖率工具、校验库或 Web 框架；仓库已有 JUnit、AssertJ、Mockito、Bean Validation 时沿用其 API 与 import。
- 不配置格式化工具、编译会话钩子或编辑器 settings。
- 自检范围是本次 diff 与被改文件中的同类写法。

## Anti-Patterns

- 跳过 coding-common，只按本技能 references 写代码
- 在 Java 11 工程里新写 record、sealed 或 switch 模式匹配
- 把 `Optional` 用作字段或方法参数，或在未确认有值时调用 `get()`
- 用户要求明确失败时，服务查找方法仍返回 `Optional` 或 `null`
- 新建的 JDBC 语句不关闭，只因为相邻旧代码也没有关闭
- 对调用方还要使用的集合就地 `add`，或从公开方法返回内部可变列表
- 用字段注入写新类型，尽管同目录新代码已经是构造器注入
- 把用户输入拼进 SQL，或把堆栈和 SQL 错误返回给调用方
- 用本技能目录之外的规则文件解释为什么这样写
- 把内部进度清单贴进给用户的回复

## Pre-Delivery Checklist

- [ ] coding-common 已调用且其 Pre-Delivery Checklist 已满足
- [ ] 命名、成员顺序、错误类型与相邻 `.java` 一致；新增处符合 `references/style.md`
- [ ] 新语法不超过已声明发行版；未知发行版时与相邻文件一致
- [ ] 外部输入在边界校验；查询使用参数绑定
- [ ] 行为变更测试与编译的实际命令、退出状态已写入说明
- [ ] 未配置钩子，未新增用户未要求的依赖或 commit
