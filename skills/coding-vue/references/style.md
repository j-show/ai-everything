# Vue 编写缺省

只在 coding-common Step 3 且改动命中 SKILL.md「Vue 文件范围」时读取。与目标文件相邻代码冲突的条目不要套用。通用不可变、错误传递、文件长度等仍以 coding-common 的 `style.md` 为准；`<script>` 内的类型与校验以 coding-typescript 为准。

## SFC 结构

- 新组件默认 `<script setup lang="ts">` + Composition API。不在新代码里写 Options API。
- 块顺序：`<script setup>` → `<template>` → `<style scoped>`。一文件一组件。
- 命名：组件文件 PascalCase（`AuctionCard.vue`）；composable 为 `useXxx` 驼峰（`useAuctionTimer`）。
- 格式与 lint 跟随仓库已有工具链（常见为 Prettier + `eslint-plugin-vue`）。类型检查优先仓库已有的 `vue-tsc` / 包脚本，不要假定纯 `tsc` 能读 SFC。

## 响应式纪律

- 状态优先用 `ref`。在 script 里经 `.value` 读写；模板顶层自动解包。
- 嵌在数组、`Map`、`Set` 里的 `ref` 读取时仍需 `.value`。
- 仅当需要「一组相关字段」时用 `reactive`。不要整体重新赋值 `reactive` 对象。
- 不要对 `reactive` 对象或 Pinia store 做普通解构；需要解构时用 `toRefs` / `storeToRefs`。普通解构会静默丢掉响应式。

## Computed 与 Watchers

- `computed` getter 必须纯：无副作用、无异步、无 DOM 访问。
- Vue 3.4+：`computed` 仅在返回值变化时触发下游；值相等时可返回先前对象以跳过更新。
- `watch` 默认懒执行。监听某个响应式属性时传 getter（`watch(() => x.value, ...)`），不要直接传整个 reactive 对象当「某一字段」的源。
- `watchEffect` 立即执行；首次 `await` 之后不再追踪后续依赖。

## 生命周期与 DOM

- 在 `setup` 内同步注册生命周期（`onMounted`、`onUnmounted` 等）。
- 定时器、监听器、订阅在 `onUnmounted` 清理。
- 读写或测量 DOM 前先 `await nextTick()`。

## 宏与模板

- 宏：`defineProps` / `defineEmits`（优先 tuple 形式 `change: [id: number]`）、`defineModel`（3.4+）做 `v-model`、`withDefaults` 或 3.5+ 的 reactive props destructure 做默认值、`defineExpose` 暴露给父组件的 ref API。
- 每个 `v-for` 提供稳定、唯一的原始值 `:key`。不用数组下标，不用对象当 key。
- 同一元素上不要同时写 `v-if` 与 `v-for`。用 `<template v-for>` 包一层再在内层 `v-if`，或先算出过滤后的列表。

```vue
<script setup lang="ts">
const props = defineProps<{ id: number }>()
const emit = defineEmits<{ change: [id: number] }>()
const open = defineModel<boolean>('open', { default: false })
</script>
```

仓库若仍用运行时 `defineProps({ ... })` 或旧式 emit 声明，跟随相邻文件，不要为「更现代」整文件改宏风格。
