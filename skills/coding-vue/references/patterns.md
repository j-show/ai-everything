# Vue 缺省形状

只在 coding-common Step 3、仓库尚无同类形状、且需要新建 composable、provide/inject、Pinia、路由或服务端缓存时读取。仓库已有形状时忽略本节。

## Composables

- 可复用逻辑单元是 `useXxx`。若仓库采用 Feature-Sliced Design，composable 通常落在 slice 的 `model` 段。
- 入参优先接受 `MaybeRefOrGetter<T>`，用 `toValue` 规范化，以便调用方传 ref、getter 或裸值。
- 返回 `toRefs(reactive(...))`（或等价可解构的 refs），避免消费者解构后丢响应式。
- 使用了生命周期或 `provide` / `inject` 的 composable，必须在组件 `setup` 内调用，不要惰性/条件调用。

## Props、Emits、v-model

- 类型式 `defineProps<Props>()` 与 tuple 式 `defineEmits<{ change: [id: number] }>()`。
- 双向绑定优先 `defineModel<T>('name', { default })`（编译为 prop + `update:*` emit）。仓库未用 `defineModel` 时跟随现有 `prop` + `emit` 模式。

## Provide / Inject

- 用 `provide` / `inject` 传递树级作用域数据，避免过深 prop drilling。
- 无碰撞键：`const key = Symbol() as InjectionKey<T>`。
- 提供者拥有变更权：对外暴露 `readonly` ref 加上明确的更新函数，不要直接给出可变 ref。

## Pinia

仅在仓库已使用或用户明确要求引入 Pinia 时套用：

- 优先 setup store：`ref` 为 state，`computed` 为 getters，`function` 为 actions。
- Setup store 没有免费的 `$reset`；需要时自己实现。
- 状态与 getters 用 `storeToRefs`；actions 可直接从 store 解构。
- 不要把原始鉴权 token 持久化到 `localStorage`。

## vue-router

仅在仓库已使用 vue-router 时套用：

- 路由组件用动态 `import()` 懒加载。
- 全局 `beforeEach` 可按 `meta.requiresAuth` 做鉴权门；守卫返回 `false`（取消）、路由位置（重定向）或 `undefined` / `true`（继续）。
- 监听 `() => route.params.id`，不要监听整个 `route` 对象当「某一参数」的源。

## vue-query（服务端缓存）

仅在仓库已使用 `@tanstack/vue-query`（或同族）时套用：

- 服务端缓存归 query 库；客户端 UI 状态归 Pinia（或仓库已有的客户端 store）。
- 请求函数与 `queryOptions` 工厂放在仓库约定的 `api` 位置。
- 关键：query key 里放 ref / computed **本身**，不要放 `.value`。传入 `.value` 会冻结 key，导致无法随依赖变化自动 refetch。

```ts
useQuery({
  queryKey: ['auction', id],
  queryFn: () => fetchAuction(toValue(id)),
})
// mutation 之后
queryClient.invalidateQueries({ queryKey: ['auction', id] })
```

不要为了演示模式而新增与当前请求无关的 store、路由或 query 文件。
