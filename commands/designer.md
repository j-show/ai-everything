# UI 设计（design-helper 流水线）

调用已安装技能 **design-helper**，将用户输入作为设计 brief，经 **ui-ux-pro-max** 与 **frontend-design** 完成设计系统、去模板化审查、确认 brief，并在用户确认后实现 UI 与交付自检。

## 前置检查 ⛔ BLOCKING

执行任何步骤前，确认以下技能**已安装且本会话可调用**（以当前环境的可用技能列表 / Skill 工具为准）：

| 必需技能          | 用途                                         |
| ----------------- | -------------------------------------------- |
| `frontend-design` | design-helper 步骤 2：去模板化审查与视觉方向 |
| `ui-ux-pro-max`   | design-helper 步骤 1 / 5：设计系统与工程护栏 |
| `design-helper`   | 编排上述两技能的设计流水线                   |

**检测方式**：逐项核对上述 `name` 是否在可用技能中；不可通过「仓库里存在同名目录」推断已安装。

若任一缺失 → **立即退出**，仅输出：

```text
缺少已安装技能：<缺失名列表>

请先安装后再运行本命令：
- AI Everything 插件（含 design-helper）：Cursor 插件市场安装 ai-everything，或在仓库根目录执行 `npm run deploy:cursor`
- frontend-design、ui-ux-pro-max：在 ai-everything 仓库根目录执行 `npm run upgrade:design`，再 `npm run deploy:cursor`（或部署到当前 harness）
- 亦可单独安装：frontend-design（Anthropic skills）、ui-ux-pro-max（nextlevelbuilder/ui-ux-pro-max-skill）
```

不得在未安装时开始设计、写代码或读取仓库内 `skills/*` 代替技能调用。

## 用户输入 `{{input}}`

本命令将 **`{{input}}` 全文**作为设计 brief 传给 **design-helper**：

| `{{input}}` | 处理方式                                                                      |
| ----------- | ----------------------------------------------------------------------------- |
| 非空        | 原样作为设计 brief（产品/页面描述、受众、栈、风格关键词、实现意图等）         |
| _(空)_      | 仍调用 design-helper；由其按 SKILL 约定向用户确认一项（主题、受众、单页任务） |

说明：

- **提示词即 brief**：不得擅自替换为用户未提及的产品或通用落地页模板。
- 若用户已在 brief 中明确「只出 brief / 不要代码」，design-helper 步骤 3 应尊重该意图。
- 若用户已明确「直接实现 / build / 搭建 UI」且未要求暂停，design-helper 可在 brief 确认后进入实现。

## 原则（必须遵守）

- **只走已安装技能**：必须完整遵循 **design-helper** 的 `SKILL.md` 工作流；其内部对 `ui-ux-pro-max`、`frontend-design` 的调用亦须通过已安装技能，不得用仓库内 Markdown 路径代替。
- **依赖技能齐全**：三技能均须在前置检查中通过；design-helper 未安装或两依赖缺失时不得降级为自由设计。
- **顺序由 design-helper 定**：步骤 1 → 2 → 3 →（条件）4 →（条件）5；不得跳过 ui-ux-pro-max 或 frontend-design 环节。

## 执行步骤

### 步骤 1 — design-helper ⚠️ 必做

1. 调用已安装技能 **design-helper**。
2. 将 **`{{input}}`** 作为用户设计 brief 传入（verbatim；空输入时按 design-helper 规则补问一项）。
3. 按 design-helper 完整执行：
   - 步骤 1：ui-ux-pro-max 基础设计系统
   - 步骤 2：frontend-design 去模板化审查
   - 步骤 3：确认 merged design brief
   - 步骤 4–5：用户确认实现时执行编码与交付自检
4. 遵守 design-helper 的 IRON LAW：禁止默认 AI 模板色、未经确认即写 UI 代码（除非 brief 已含明确 build 意图）。

## 向用户输出

流水线结束后简要汇总：

- 前置检查：三技能是否齐全（已检查时一句带过）
- 设计 brief 要点（配色、字体、signature 元素、避免的反模式）
- 是否进入实现；若已实现，交付 checklist 与 `.design/` brief 落盘情况

## 常见错误

| 问题                                  | 处理                                                           |
| ------------------------------------- | -------------------------------------------------------------- |
| 未检测技能就执行                      | 回到前置检查                                                   |
| 用仓库 `skills/*` 代替调用            | 改为调用已安装 design-helper / ui-ux-pro-max / frontend-design |
| 未传 `{{input}}` 给 design-helper     | 将用户输入全文作为 brief 重跑                                  |
| 跳过 frontend-design 或 ui-ux-pro-max | 回到 design-helper 对应步骤                                    |
| 擅自替换 brief 为通用落地页           | 以 `{{input}}` 为准，按 design-helper 修订                     |

## 完成前自检

- [ ] frontend-design、ui-ux-pro-max、design-helper 安装检查已通过
- [ ] design-helper 已接收 `{{input}}` 作为 brief
- [ ] ui-ux-pro-max 与 frontend-design 均经 Skill 工具调用（非仓库路径）
- [ ] 实现前已按 design-helper 完成 brief 确认（或 brief 已含明确 build 意图）
- [ ] 若已交付代码：交付 checklist 与 brief 落盘符合 design-helper 约定
