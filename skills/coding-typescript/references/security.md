# TypeScript / JavaScript 安全缺省

只在 coding-common Step 5（安全敏感改动）且触及 `.ts` / `.tsx` / `.js` / `.jsx` 时读取。通用清单仍以 coding-common 的 `security.md` 为准。

## 密钥

```typescript
// NEVER: 硬编码密钥
const apiKey = 'sk-proj-xxxxx'

// ALWAYS: 环境变量或仓库已有的密钥读取方式
const apiKey = process.env.API_KEY

if (!apiKey) {
  throw new Error('API_KEY not configured')
}
```

- 启动或调用路径在缺少必需密钥时失败。
- 回复、测试快照与日志中不写密钥值。

## 语言层补充核对

在 coding-common 安全清单之外，再核对本次 TS/JS diff：

- [ ] 没有把密钥写进源码、测试或配置样例字面量
- [ ] 来自 `process.env` 的必需配置在使用前已校验存在
- [ ] 对外返回的错误信息经过收窄，不含堆栈、令牌或内部路径
- [ ] 动态拼接的 HTML / 查询 / 文件路径已按 coding-common 安全条目处理
