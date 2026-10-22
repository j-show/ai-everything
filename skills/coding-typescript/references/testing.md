# TypeScript / JavaScript 测试缺省

只在 coding-common Step 4 且改动触及 `.ts` / `.tsx` / `.js` / `.jsx` 时读取。测试先行顺序、覆盖率门槛与失败排查仍以 coding-common 的 `testing.md` 为准。

## 单元与集成

- 使用仓库已有的测试运行器与断言库（例如 Vitest、Jest、node:test）。
- 测试文件位置、命名与导入风格跟随相邻测试。
- 需要类型断言时优先收窄；避免用 `as any` 让测试通过。

## 关键用户路径的 E2E

仓库已经采用 Playwright（或其它 E2E 工具）时，对关键用户路径的补充测试跟随该工具与现有用例目录。

仓库没有 E2E 框架时：

- 不新装 Playwright 或其它 E2E 工具来满足本技能。
- 行为变更仍按 coding-common 用现有单元/集成测试覆盖；无法覆盖时在完成说明写明未验证的用户路径。

## 类型检查

仓库有类型检查命令时（例如 `tsc --noEmit`、包脚本 `typecheck`），在行为相关测试之后运行与本次改动相关的检查，并记录退出状态。

没有类型检查命令时，报告“未运行类型检查”，不要为了这一条新增 `tsconfig` 或安装 TypeScript。
