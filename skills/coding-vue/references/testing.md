# Vue 测试缺省

只在 coding-common Step 4 且改动命中 SKILL.md「Vue 文件范围」时读取。测试先行顺序、覆盖率门槛与失败排查仍以 coding-common 的 `testing.md` 为准；TS/JS 断言与类型检查以 coding-typescript 为准。

## 栈

- 使用仓库已有的测试运行器与 Vue 测试工具（常见为 Vitest + `@vue/test-utils`）。
- DOM 环境跟随仓库配置（常见 `happy-dom` 或 `jsdom`，写在 Vite / Vitest 配置里）。
- 不新装测试框架或 DOM 实现来满足本技能。

## 渲染与异步

- `mount` 做完整渲染；需要隔离子组件时用 `shallowMount` 或仓库已有的 stub 惯例。
- `trigger`、`setValue` 返回 Promise，必须 `await`。
- `flushPromises` 冲刷已解决的 Promise 回调；`nextTick` 在状态变更后结算 DOM。

## 测什么

- 只测公共接口：props、emitted 事件、slots、渲染结果。
- 不断言私有状态或内部方法；不要只靠快照证明行为。

## Composables

- 仅使用响应式 API 的 composable：可直接调用并断言返回的 refs。
- 使用了生命周期或 `inject` 的 composable：通过宿主组件挂载后再测。

## Pinia

仓库使用 Pinia 时：

- 组件内：`createTestingPinia()`（`@pinia/testing`）经 `global.plugins` 注入。默认 stub actions；需要真实执行时设 `stubActions: false`。Vitest 下传 `createSpy: vi.fn`（无 Jest 全局）。
- 隔离测 store：`beforeEach(() => setActivePinia(createPinia()))`，避免跨用例泄漏状态。

## Mount 配置

跟随 `@vue/test-utils` 与相邻测试：

- `global.plugins`、`global.stubs`（常默认 stub `Transition` / `TransitionGroup`）、`global.mocks`（如 `$router`）、`global.provide`（`inject`，支持 Symbol key）。
- 需要 stub 路由链接且不想挂完整 router 时，用仓库已有的 `RouterLinkStub` 或等价物。

```ts
const wrapper = mount(AuctionCard, {
  props: { id: 1 },
  global: { plugins: [createTestingPinia({ createSpy: vi.fn })] },
})
await wrapper.find('button').trigger('click')
expect(wrapper.emitted('bid')).toBeTruthy()
```

## 类型检查

仓库有 `vue-tsc --noEmit` 或包脚本 `typecheck` 时，在相关行为测试之后运行，并记录退出状态。纯 `tsc` 通常读不了 `.vue`；不要把它当成 SFC 类型检查的唯一命令。

没有类型检查命令时，报告“未运行类型检查”，不要为了这一条新增 `tsconfig` 或安装 `vue-tsc`。
