---
name: coding-vue
description: "在 Vue 仓库里编写或修改 .vue 与相关 Composition API 模块：先走已安装的 coding-common 与 coding-typescript，再用本技能内嵌的 SFC、响应式、composables、Pinia、vue-router、vue-query、Vitest 与模板安全缺省补齐。用于实现 Vue 组件、写 composable、改 Pinia store、配路由守卫、接 vue-query、补组件测试、修响应式丢失。用户会说：写 Vue、改这个组件、用 script setup、写 composable、Pinia、vue-router、按 Vue 规范改。Also: coding-vue, Vue 3, Composition API, SFC, defineModel, Pinia, vue-query, Vitest. 不处理纯文档、纯提交、视觉设计、会话钩子配置，也不审查用户未要求修改的改动。"
---

# Coding Vue

IRON LAW: 通用编码流程以已安装的 **coding-common** 为准；TypeScript/JavaScript 语言缺省以已安装的 **coding-typescript** 为准。本技能只补 Vue（SFC / Composition API / 生态）缺省。目标文件及其相邻代码优先；禁止用本技能目录之外的规则文件覆盖仓库写法。

红线（出现就停，先改再继续）：

- coding-common 或 coding-typescript 未安装或当前会话不可调用，却继续改代码
- 用本目录 `references/` 覆盖仓库里已有的 SFC 结构、状态库、路由或测试写法
- 在新代码里引入 Options API，或把无关 Options 组件整文件迁成 Composition API
- 解构 `reactive` / Pinia store 却不经 `toRefs` / `storeToRefs`，或在生产路径留下 `console.log`
- 配置会话钩子、编辑器全局设置，或点名外部代理来代替本技能步骤

## Workflow

复制这份清单并逐项勾选：

```
Coding Vue Progress:

- [ ] Step 0: 确认 coding-common 与 coding-typescript ⛔ BLOCKING
- [ ] Step 1: 读取 coding-common 并执行其 Workflow ⚠️ REQUIRED
- [ ] Step 2: 对 TS/JS 与 .vue script 叠加 coding-typescript ⚠️ REQUIRED
- [ ] Step 3: 对命中「Vue 文件范围」的文件叠加本技能 references ⚠️ REQUIRED
- [ ] Step 4: 完成说明写明 Vue/TS 叠加项与冲突 ⚠️ REQUIRED
```

**控制流**

1. Step 0 未通过，不改文件。
2. Step 1 完整执行 coding-common（含其对齐仓库、实现、测试、安全与完成前自检）。
3. 每当 coding-common 要求读取其 `style` / `testing` / `security` 时：
   - 若改动触及 `.ts` / `.tsx` / `.js` / `.jsx`，或 `.vue` 内的 `<script>`：同时读取已安装 **coding-typescript** 的对应 reference。
   - 若改动命中「Vue 文件范围」：同时读取本技能对应 reference。
   - 仅采用与仓库不冲突的缺省。
4. Step 4 未写清叠加与冲突前，不把任务标成完成。

## Vue 文件范围

本技能 references 只在本次改动的文件命中下面任一条时读取：

- 路径以 `.vue` 结尾
- 从 `vue` 导入 `ref`、`computed`、`watch`、`watchEffect`、`defineComponent`，或名称以 `on` 开头且下一字符为大写字母的标识符
- 文件导出的函数名以 `use` 开头，且下一字符为大写字母
- 从 `pinia` 导入 `defineStore` 或 `storeToRefs`
- 从 `vue-router` 导入任意标识符
- 从 `@tanstack/vue-query` 导入任意标识符

未命中的 `.ts` / `.js` 只走 coding-typescript，不套本技能的 SFC、Pinia 或模板缺省。

## Step 0: 确认依赖 ⛔ BLOCKING

确认 `coding-common` 与 `coding-typescript` 均已安装且当前会话可调用（以会话技能列表 / Skill 工具为准，不以仓库路径推断）。

若缺失 → **立即停止**，只输出（按实际缺失项删减）：

```text
缺少已安装技能：coding-common 和/或 coding-typescript

请先安装后再运行本技能：
- AI Everything 插件（含上述技能）：Cursor 插件市场安装 ai-everything，或在仓库根目录执行 `npm run deploy:cursor`
- 亦可单独安装：
  - npx skills add j-show/ai-everything --path skills/coding-common
  - npx skills add j-show/ai-everything --path skills/coding-typescript
```

## Step 1: 执行 coding-common ⚠️ REQUIRED

读取并遵循已安装的 `coding-common` 的完整 Workflow（Step 0–7）。本技能不缩短、不跳过其中的阻塞步骤。

把用户的 Vue 请求原样交给该流程：对齐仓库写法、判定改动类型、越界确认、实现、验证、安全自检、完成前自检、按需提交说明。

## Step 2: 叠加 coding-typescript ⚠️ REQUIRED

仅当本次改动触及 `.ts` / `.tsx` / `.js` / `.jsx`，或 `.vue` 内的 `<script setup>` / `<script>`（含其测试）时执行。

按 coding-common 当前步骤，读取**已安装** `coding-typescript` 的对应 reference（`style` / `patterns` / `testing` / `security`），不要按本仓库路径硬编码去打开文件。

叠加规则与 coding-typescript 自身一致：仓库相邻写法优先；冲突跟随仓库并在完成说明点明。

## Step 3: 叠加 Vue references ⚠️ REQUIRED

仅当本次改动命中「Vue 文件范围」时执行。按 coding-common 当前步骤读取对应文件：

| coding-common 步骤 | 再读 |
| --- | --- |
| Step 3 实现 | `references/style.md`；需要缺省形状时再读 `references/patterns.md` |
| Step 4 验证 | `references/testing.md` |
| Step 5 安全敏感 | `references/security.md` |

叠加规则：

1. 仓库相邻文件已有写法 → 跟随仓库。
2. coding-common、coding-typescript 与本技能都不冲突的缺省 → 都遵守。
3. 本技能条目与仓库冲突 → 跟随仓库，并在 Step 4 点明冲突条。
4. 仓库没有该类约定时 → 使用本技能缺省（例如 `<script setup lang="ts">`、tuple-form `defineEmits`、`storeToRefs`）。

不要把 `references/` 里的示例框架、FSD 切片或 Pinia/vue-query 模式强加到已有模块上。

写文件前先定数据来源和富文本路径：

1. 新组件的数据来源跟随同目录相邻组件。相邻组件用 props 传入字段时，新组件同样用 props。不要因为仓库里另有 Pinia store 就改成读 store。只有用户点名要读该 store，或相邻组件已经在读它，才用 `storeToRefs`。
2. 不可信 HTML：仓库没有已安装的消毒库时，不写 `v-html`，也不新增消毒依赖。需要隔离这段 HTML 时，用 `sandbox=""` 的 iframe，并在 Step 4 写明选用原因。

## 失败分支

| 触发条件 | 一线修复 | 仍失败兜底 |
| --- | --- | --- |
| coding-common 或 coding-typescript 不在会话技能列表 | 🔴 STOP。回复只有 Step 0 的安装段，不改文件 | 不把仓库里这两份技能文件当作已安装 |
| 点名改动之外还有无关的 Options API 组件要整文件改成 `<script setup>` | 只改点名文件。无关路径写入完成说明 | 🔴 STOP，不改该路径，直到用户单独写出要改的路径 |
| 没有 `vue-tsc` 或测试命令，或命令因缺少依赖失败 | 完成说明写实际命令、退出状态和未验证的行为 | 不安装 `vue-tsc`、测试框架或消毒库，不新增 `tsconfig`，不把未跑的检查写成通过 |
| 不可信 HTML，且仓库没有已安装的消毒库 | 不写 `v-html`。需要隔离时用 `sandbox=""` 的 iframe，并在 Step 4 写明原因 | 不绑定这段 HTML。完成说明写明富文本未渲染。不新增消毒依赖 |
| 本技能缺省与同目录相邻写法冲突 | 跟随相邻文件，Step 4 点明冲突条 | 不改写相邻文件的既有风格，直到用户确认扩大 |

## Step 4: 完成说明 ⚠️ REQUIRED

在 coding-common 要求的完成说明之外，再写明：

- 实际叠加了哪些 Vue 缺省（SFC 结构、响应式、composable、路由/查询、测试命令等）
- 实际叠加了哪些 coding-typescript 缺省（若 Step 2 触发）
- 因仓库已有写法而跳过的本技能条目
- 数据来源是跟随相邻 props，还是用户点名的 store
- 若使用 sandbox iframe，写明选用原因
- 若跑了 `vue-tsc` / 类型检查、Vitest 或组件测试，写出命令与退出状态；未跑则写明原因

## 诚实边界

- 不替代 coding-common 或 coding-typescript；通用不可变、TDD 顺序、类型/校验缺省、安全清单与完成前自检仍以二者为准。
- 不选择或安装仓库没有的 UI 库、状态库、测试框架或覆盖率工具；仓库已有 Pinia / Vuex、vue-router、vue-query 等时沿用其 API 与 import 风格。
- 不配置 Prettier、`vue-tsc` 会话钩子或编辑器 settings。
- 自检范围是本次 diff 与被改文件中的同类写法。

## Anti-Patterns

- 跳过 coding-common / coding-typescript，只按本技能 references 写代码
- 新写 Options API，或在 Composition API 文件里混用 Options 选项对象
- 对 `reactive` / store 做普通解构导致响应式丢失
- `v-for` 用数组下标当 `:key`，或同一元素上同时使用 `v-if` 与 `v-for`
- 仓库已有状态/请求方案时强行新装 Pinia 或 vue-query
- 相邻组件用 props，却因为仓库里有 store 就改成读 store
- 在生产代码路径留下 `console.log`
- 用本技能目录之外的规则文件解释为什么这样写

## Pre-Delivery Checklist

- [ ] coding-common 已调用且其 Pre-Delivery Checklist 已满足
- [ ] 触及 script/TS 时，coding-typescript 叠加已执行或其跳过原因已写明
- [ ] 新组件数据来源与同目录相邻组件一致；不可信 HTML 未使用未消毒的 `v-html`
- [ ] SFC 结构、响应式与宏用法与相邻代码一致；新增处符合 `references/style.md`
- [ ] composable / Pinia / 路由 / 查询形状不与仓库冲突；冲突条已点明
- [ ] 行为变更测试与 `vue-tsc`（或仓库类型检查）的实际命令、退出状态已写入说明
- [ ] 模板/HTML/URL 安全敏感 diff 已按 `references/security.md` 核对
- [ ] 未配置钩子，未新增用户未要求的依赖或 commit
