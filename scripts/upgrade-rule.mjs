/**
 * 从上游 GitHub 仓库同步已配置 rules 到本仓库 `rules/` 目录。
 * 下载、镜像替换和报告来自 common-download.mjs 与 common-report.mjs。
 *
 * @module scripts/upgrade-rule
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createArgumentParser,
  createSourceSelector,
  formatUpgradeHelp,
  runUpgradeCli,
} from './common-download.mjs';
import { createUpgradeReporter } from './common-report.mjs';

/**
 * 可从上游更新的 rule 配置。
 *
 * 字段与技能来源对应：`rule` 是写入 `rules/<rule>/` 的目录名，
 * `repo` 为仓库根 URL，`path` 为仓库内目录，`ref` 为要下载的分支。
 * `groups` 同时定义 CLI 分组选项。远程路径必须是目录，不要求 `SKILL.md`。
 * 目录为空时，不带选择参数的升级会因没有可选规则而结束。
 */
export const RULE_SOURCES = [];

/** 从配置派生的可用分组，顺序与首次出现顺序一致。 */
export const RULE_GROUPS = Object.freeze([
  ...new Set(RULE_SOURCES.flatMap(({ groups }) => groups)),
]);

/** 当前模块路径与仓库目录。 */
const modulePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(modulePath), '..');
const rulesRoot = path.join(projectRoot, 'rules');

/**
 * 解析规则升级脚本的命令行参数。
 *
 * @param {string[]} argv 不包含 Node 与脚本路径的参数列表
 * @returns {{ help: boolean, git: boolean, rules: string[], groups: string[] }}
 */
export const parseArgs = createArgumentParser({
  groups: RULE_GROUPS,
  selectFlag: '--rule',
  selectShort: '-r',
});

/**
 * 根据参数选择要更新的上游规则。
 *
 * 存在 `--rule` 时忽略所有分组选项；无任何选择参数时返回全部配置。
 *
 * @param {{ rules: string[], groups: string[] }} args
 * @returns {typeof RULE_SOURCES[number][]}
 */
export const selectSources = createSourceSelector(RULE_SOURCES, {
  nameKey: 'rule',
  namesKey: 'rules',
  noun: 'rule',
});

/** 生成由集中配置派生的 CLI 帮助文本。 */
export const formatHelp = () => formatUpgradeHelp({
  scriptPath: 'scripts/upgrade-rule.mjs',
  selectOptionLine: '-r, --rule <name>    Sync a named rule (repeatable; overrides groups)',
  groups: RULE_GROUPS,
  groupNoun: 'rule',
  catalogNoun: 'Rules',
  emptySelectionNoun: 'rules',
  catalog: RULE_SOURCES,
  nameKey: 'rule',
  npmExamples: [
    'npm run upgrade:rule',
    'npm run upgrade:rule -- --fetch',
    'npm run upgrade:rule -- --rule <name>',
    'npm run upgrade:rule -- --git --rule <name>',
  ],
});

/**
 * 执行规则更新 CLI。远程目录不要求 `SKILL.md`。
 *
 * @param {string[]} argv 不包含 Node 与脚本路径的参数列表
 * @returns {Promise<void>}
 */
export const runCli = (argv = process.argv.slice(2)) => runUpgradeCli({
  argv,
  rootDir: rulesRoot,
  projectRoot,
  formatHelp,
  parseArgs,
  selectSources,
  nameKey: 'rule',
  noun: 'rule',
  plural: 'rules',
  requiredFile: null,
  doneMessage: 'Upgrade rules done',
  createReporter: createUpgradeReporter,
});

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  runCli().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
