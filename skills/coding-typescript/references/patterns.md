# TypeScript 缺省形状

只在 coding-common Step 3、仓库尚无同类形状、且需要新建数据访问边界、HTTP 响应类型或可复用 hooks 时读取。仓库已有形状时忽略本节。

## API 响应

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}
```

成功时填 `data`，失败时填 `error`。分页响应使用 `meta`。字段名与可选性跟随仓库已有信封，而不是强行改成以上形状。

## Repository

```typescript
interface Repository<T> {
  findAll(filters?: Filters): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
}
```

业务代码依赖这组操作名；具体存储可以是数据库、HTTP 或文件。`Filters` / `CreateDto` / `UpdateDto` 换成当前领域的具名类型。

## 自定义 Hook（React）

仅在仓库使用 React hooks、且同目录尚无相同工具 hook 时作为写法参考：

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

导入路径与 hooks 规则跟随相邻组件。不要为了演示模式而新增与请求无关的 hook 文件。
