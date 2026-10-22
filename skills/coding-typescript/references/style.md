# TypeScript / JavaScript 编写缺省

只在 coding-common Step 3 且改动触及 `.ts` / `.tsx` / `.js` / `.jsx` 时读取。与目标文件相邻代码冲突的条目不要套用。通用不可变、错误传递、文件长度等仍以 coding-common 的 `style.md` 为准。

## 公开 API 的类型

- 导出函数、共享工具与公开类方法：写出参数类型和返回类型。
- 局部变量类型能明显推断时，让 TypeScript 推断。
- 重复出现的对象形状抽成具名 `interface` 或 `type`。

```typescript
// WRONG: 导出函数缺少显式类型
export function formatUser(user) {
  return `${user.firstName} ${user.lastName}`
}

// CORRECT: 公开 API 带显式类型
interface User {
  firstName: string
  lastName: string
}

export function formatUser(user: User): string {
  return `${user.firstName} ${user.lastName}`
}
```

## interface 与 type

- 可能被扩展或实现的对象形状用 `interface`。
- 联合、交叉、元组、映射类型与工具类型用 `type`。
- 优先字符串字面量联合；仅在需要与外部系统互操作时再用 `enum`。

```typescript
interface User {
  id: string
  email: string
}

type UserRole = 'admin' | 'member'
type UserWithRole = User & {
  role: UserRole
}
```

## 避免 any

- 应用代码避免 `any`。
- 外部或不可信输入用 `unknown`，再安全收窄。
- 返回值类型依赖调用方时用泛型。

```typescript
// WRONG
function getErrorMessage(error: any) {
  return error.message
}

// CORRECT
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Unexpected error'
}
```

## React props

- 组件 props 用具名 `interface` 或 `type`。
- 回调 props 写明参数与返回类型。
- 除非仓库已有充分理由，否则不使用 `React.FC`。

```typescript
interface UserCardProps {
  user: { id: string; email: string }
  onSelect: (id: string) => void
}

function UserCard({ user, onSelect }: UserCardProps) {
  return <button onClick={() => onSelect(user.id)}>{user.email}</button>
}
```

## JavaScript 文件

- 在 `.js` / `.jsx` 中，当类型能提升清晰度且暂不迁到 TypeScript 时，用 JSDoc 标注。
- JSDoc 必须与运行时行为一致。

```javascript
/**
 * @param {{ firstName: string, lastName: string }} user
 * @returns {string}
 */
export function formatUser(user) {
  return `${user.firstName} ${user.lastName}`
}
```

## 不可变更新（语言形态）

coding-common 要求返回新值。在 TypeScript 中，入参可用 `Readonly<T>` 表达不修改约定，并用展开创建副本：

```typescript
function updateUser(user: Readonly<User>, name: string): User {
  return {
    ...user,
    name
  }
}
```

## 异步错误

使用 `async` / `await` 与 `try` / `catch`；`catch` 绑定为 `unknown` 并先收窄。日志与错误类型跟随仓库已有写法。

```typescript
async function loadUser(userId: string): Promise<User> {
  try {
    return await riskyOperation(userId)
  } catch (error: unknown) {
    logger.error('Operation failed', error)
    throw new Error(getErrorMessage(error))
  }
}
```

## 边界校验

仓库已有校验库或模式时沿用。仓库没有、且需要 schema 校验时，可用 Zod：从 schema 推断类型，并在边界 `parse` / `safeParse`。

**API 跟随仓库已安装的 Zod 主版本**（import 路径、`z.email()` 与 `z.string().email()` 等以该版本文档与相邻文件为准）。下面是 Zod 4 风格示例：

```typescript
import * as z from 'zod'

const userSchema = z.object({
  email: z.email(),
  age: z.number().int().min(0).max(150)
})

type UserInput = z.infer<typeof userSchema>

const validated: UserInput = userSchema.parse(input)
```

不要为了这一条新装 Zod；仓库没有校验库时，用手写收窄或仓库已有工具，并在完成说明里记下缺口。

## 日志

- 生产代码路径不留 `console.log`。
- 使用仓库已有的日志工具；没有时用现有错误通道，不新装日志框架。
