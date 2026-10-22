# 部署

在修改 [scripts/deploy/deploy.mjs](../../scripts/deploy/deploy.mjs)、部署测试或链接去重时阅读。从仓库根目录执行。

部署只创建资源链接，不安装插件清单或 hooks。已有内容保留，等价链接跳过。缺失的源目录跳过。当前没有 `commands/` 和 `rules/`。

## 目标

| 调用 | 写入位置 |
| --- | --- |
| `npm run deploy`（无 `-t`） | 不写入；退出码 1 |
| `npm run deploy:agent` 或 `-t agent` | `~/.agents/`，例如 `~/.agents/skills` |
| `-t agent --mode local`，以及其他类型的 `--mode local` | 当前目录下的同名隐藏目录，例如 `.agents/`、`.cursor/` |
| `npm run deploy:project <project dir>`（`npm run deploy -t project`） | 该项目目录本身，例如 `<project dir>/skills` |
| `-t cursor`、`-t claude`、`-t qcode` | 对应用户目录；`--mode local` 改为当前目录 |
| `-t codex` | 只链接 `skills/` |

`--mode` 的默认值是 `user`。`-t project` 不使用 `--mode`，目标由项目路径决定。相对路径按命令的工作目录解析。

## 验证

完成标准：`node --test scripts/deploy/deploy.test.mjs` 通过，并且 `npm run deploy:project "<临时目录>"` 在临时目录里覆盖已有内容保护和重复执行。

验证写入临时目录。不向真实用户的 harness 目录部署测试资源。
