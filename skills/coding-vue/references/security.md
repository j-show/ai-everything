# Vue 安全缺省

只在 coding-common Step 5（安全敏感改动）且改动命中 SKILL.md「Vue 文件范围」时读取。通用清单仍以 coding-common 的 `security.md` 为准；脚本侧密钥与环境变量以 coding-typescript 为准。

## Vue 自动转义的范围

- 文本插值 `{{ }}` 与动态属性绑定（如 `:title`）会自动转义。下列向量**不在**自动保护范围内。

## 模板只能来自受信源

- 不要用非受信内容当组件模板。禁止从用户输入做运行时模板编译。
- 不要用用户可控的任意字符串驱动 `:is` 去解析组件。

## v-html 与渲染函数

- `v-html` 绕过转义，是直接的 XSS 向量。避免绑定用户内容。
- 若不可避免：先用仓库已有的消毒方案（常见 DOMPurify allowlist）再绑定；或放入沙箱 iframe。优先在后端持久化前消毒。
- 渲染函数 / 作用域插槽输出同等风险：经 `h()` 的 `innerHTML` 传入用户 HTML，等同于换皮的 `v-html`。先消毒。

## URL、样式与事件注入

- `:href` / `:src` 不会按脚本来源转义。`javascript:` URL 可执行。校验协议，仅允许仓库约定的安全 scheme（常见 `http` / `https` / `mailto`）。URL 消毒应在后端持久化前完成；前端再消毒不能代替服务端。
- 带用户输入的 `:style` 不安全（CSS 外泄）。用对象语法 + 属性白名单，不要绑原始用户字符串。
- 不要把用户输入绑到 `onclick`、`onfocus` 或任何原生事件属性名。

## 客户端包内密钥

- 任何打进客户端包的 `import.meta.env.VITE_*`（或仓库等价前缀）都会暴露给浏览器。API 密钥与 token 留在服务端。
- 会话 token 优先 httpOnly cookie。不要把凭证写进客户端包。

```vue
<!-- unsafe -->
<div v-html="userBio" />
<!-- safe：仅在仓库已有消毒工具时 -->
<div v-html="sanitize(userBio)" />
```

## 语言层补充核对

在 coding-common / coding-typescript 安全清单之外，再核对本次 Vue diff：

- [ ] 无未消毒的用户内容经 `v-html` / `innerHTML` / 非受信模板进入页面
- [ ] 用户控制的 `:href` / `:src` / `:style` / 事件属性已按上面条目处理
- [ ] 无用户可控的任意 `:is` 组件解析
- [ ] 无把密钥或 session token 写进客户端源码或 `VITE_*` 明文
