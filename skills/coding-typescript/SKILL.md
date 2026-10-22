---
name: coding-typescript
description: "在 TypeScript/JavaScript 仓库里编写或修改 .ts/.tsx/.js/.jsx：先走已安装的 coding-common，再用本技能内嵌的类型、Zod 校验、异步错误收窄、React props、仓库/API 缺省形状补齐语言缺省。用于实现 TS 功能、修 TS bug、补类型、写 Zod schema、改 React 组件 props、加 Playwright 关键路径测试。用户会说：写 TypeScript、补类型、用 Zod 校验、改这个组件、TS 重构、按 TS 规范改。Also: coding-typescript, TypeScript, Zod, React props, type narrowing, Playwright. 不处理纯文档、纯提交、视觉设计、会话钩子配置，也不审查用户未要求修改的改动。"
---

# Coding TypeScript

IRON LAW: 通用编码流程以已安装的 **coding-common** 为准。本技能只补 TypeScript/JavaScript 语言缺省。目标文件及其相邻代码优先；禁止用本技能目录之外的规则文件覆盖仓库写法。

红线（出现就停，先改再继续）：

- coding-common 未安装或当前会话不可调用，却继续改代码
- 用本目录 `references/` 覆盖仓库里已有的类型、校验库或测试框架写法
- 为“更规范”把无关 `.js` 整文件迁成 TypeScript，或引入仓库未使用的类型工具链
- 在应用代码里留下 `any`、未收窄的 `unknown`、或生产路径上的 `console.log`
- 配置会话钩子、编辑器全局设置，或点名外部代理来代替本技能步骤

## Workflow

在内部复制这份清单并逐项勾选。不要把清单贴进给用户的回复。

```
Coding TypeScript Progress:

- [ ] Step 0: 确认 coding-common ⛔ BLOCKING
- [ ] Step 1: 读取 coding-common 并执行其 Workflow ⚠️ REQUIRED
- [ ] Step 2: 对 .ts/.tsx/.js/.jsx 叠加本技能 references ⚠️ REQUIRED
- [ ] Step 3: 完成说明写明 TS 叠加项与冲突 ⚠️ REQUIRED
```

**控制流**

1. Step 0 未通过，不改文件。
2. Step 1 完整执行 coding-common（含其对齐仓库、实现、测试、安全与完成前自检）。
3. 每当 coding-common 要求读取其 `style` / `testing` / `security` 时，若改动触及 `.ts` / `.tsx` / `.js` / `.jsx`，同时读取本技能对应 reference，且仅采用其中与仓库不冲突的缺省。
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

把用户的 TypeScript/JavaScript 请求原样交给该流程：对齐仓库写法、判定改动类型、越界确认、实现、验证、安全自检、完成前自检、按需提交说明。

## Step 2: 叠加 TypeScript references ⚠️ REQUIRED

仅当本次改动触及 `.ts` / `.tsx` / `.js` / `.jsx`（含其测试）时执行。按 coding-common 当前步骤读取对应文件：

| coding-common 步骤 | 再读 |
| --- | --- |
| Step 3 实现 | `references/style.md`；需要缺省形状时再读 `references/patterns.md` |
| Step 4 验证 | `references/testing.md` |
| Step 5 安全敏感 | `references/security.md` |

叠加规则：

1. 仓库相邻文件已有写法 → 跟随仓库。
2. coding-common 与本技能都不冲突的缺省 → 两者都遵守。
3. 本技能条目与仓库冲突 → 跟随仓库，并在 Step 3 点明冲突条。
4. 仓库没有该类约定时 → 使用本技能缺省（例如公开 API 显式类型、`unknown` 收窄、边界用已有校验库或 Zod）。

不要把 `references/` 里的示例框架、响应信封或 hooks 模式强加到已有模块上。

## 失败分支

| 触发条件 | 一线修复 | 仍失败兜底 |
| --- | --- | --- |
| coding-common 不在会话技能列表 | 🔴 STOP。回复只有 Step 0 的安装段，不改文件 | 不把仓库里的 coding-common 文件当作已安装 |
| 点名改动之外还有无关的 `.js` / `.jsx` 要整文件改成 TypeScript | 只改点名文件。无关路径写入「未扩大的范围」 | 🔴 STOP，不改该路径，直到用户单独写出要改的路径 |
| 类型检查失败是因为测试文件落在 `tsconfig` 的 `include` 里，并引入了测试运行器的类型 | 把测试挪到该 `include` 之外，或挪到仓库已有的测试目录 | 不改 `tsconfig`，不安装 `@types/node` 或其他依赖来消掉这个错误 |
| 仓库没有测试命令或类型检查命令 | 在「命令：」写 `未运行` 和原因 | 不新增 `tsconfig`，不安装 TypeScript 或测试框架 |
| 仓库已有校验写法，或没有任何校验库 | 沿用已有写法；没有库时在边界做手写收窄 | 不安装 Zod |

## Step 3: 完成说明 ⚠️ REQUIRED

给用户的回复使用下面五段，按此顺序，不要改标题，不要附上内部清单：

```text
行为：<一句可观察结果>
命令：<命令> 退出码 <n>
叠加：<本次用到的 TS 缺省，没有则写无>
跳过：<因仓库写法或范围未用的本技能条目，没有则写无>
未扩大的范围：<点名但未改的路径，没有则写无>
```

同一条命令跑了多次时，每条写一行，放在「命令：」下面。没有运行的检查写成 `未运行 <命令或类型检查>：<原因>`，仍然放在「命令：」下面。退出码只写实际进程的退出码。

## 诚实边界

- 不替代 coding-common；通用不可变、TDD 顺序、安全清单与完成前自检仍以 coding-common 为准。
- 不选择或安装仓库没有的测试框架、覆盖率工具或校验库；仓库已有 Zod / Yup / Valibot 等时沿用其 API 与 import 风格。
- 不配置 Prettier、`tsc` 会话钩子或编辑器 settings。
- 自检范围是本次 diff 与被改文件中的同类写法。

## Anti-Patterns

- 跳过 coding-common，只按本技能 references 写代码
- 导出函数不写参数/返回类型，却给显而易见的局部变量加冗余标注
- 用 `any` 消除报错，或对 `unknown` 不做收窄就访问字段
- 仓库已有校验方式时强行新装 Zod
- 在生产代码路径留下 `console.log`
- 用本技能目录之外的规则文件解释为什么这样写
- 把内部进度清单贴进给用户的回复

## Pre-Delivery Checklist

- [ ] coding-common 已调用且其 Pre-Delivery Checklist 已满足
- [ ] 公开 API、共享模型与组件 props 类型与相邻代码一致；新增处符合 `references/style.md`
- [ ] 外部输入在边界校验；校验库 API 跟随仓库已安装版本
- [ ] 异步错误按 `unknown` 收窄；无调试用 `console.log`
- [ ] 行为变更测试与类型检查的实际命令、退出状态已写入说明
- [ ] 未配置钩子，未新增用户未要求的依赖或 commit
