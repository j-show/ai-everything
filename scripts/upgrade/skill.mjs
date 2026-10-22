/**
 * 从上游 GitHub 仓库同步已配置 skills 到本仓库 `skills/` 目录。
 * 下载、镜像替换和报告来自 download.mjs 与 report.mjs。
 * 技能写入仓库根目录的 `skills/`。
 *
 * @module scripts/upgrade/skill
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import skillSources from '../skills.json' with { type: 'json' };

import {
  createArgumentParser,
  createGitSparseDownloader,
  createHttpsDownloader,
  createSourceSelector,
  formatUpgradeHelp,
  runUpgradeCli,
  syncConfiguredItem,
  syncItemsConcurrently,
} from './download.mjs';
import { createUpgradeReporter } from './report.mjs';

export {
  cleanupUpgradeWorkDirs,
  createGitDownloadSession,
  createGitSparseDownloader,
  createHttpsDownloadSession,
  createHttpsDownloader,
  getFileMode,
  isUpgradeWorkDirName,
  repositoryWorkDirName,
  runGit,
  syncMirror as syncSkillMirror,
} from './download.mjs';

/**
 * 一条可从上游更新的 skill。字段来自 `scripts/skills.json`。
 *
 * @typedef {Object} SkillSource
 * @property {string} skill 写入 `skills/<skill>/` 的目录名
 * @property {string} repo 仓库根 URL
 * @property {string} path 仓库内相对路径
 * @property {string} ref 要下载的分支
 * @property {string[]} groups CLI 分组；`mattpocock` 对应 `--mattpocock`
 */

/** @type {SkillSource[]} */
export const SKILL_SOURCES = skillSources;

/** 从配置派生的可用分组，顺序与首次出现顺序一致。 */
export const SKILL_GROUPS = Object.freeze([
  ...new Set(SKILL_SOURCES.flatMap(({ groups }) => groups)),
]);

/** 当前模块路径。脚本在 `scripts/upgrade/`，仓库根目录再向上一级。 */
const modulePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(modulePath), '../..');
const skillsRoot = path.join(projectRoot, 'skills');

/**
 * 解析升级脚本的命令行参数。
 *
 * @param {string[]} argv 不包含 Node 与脚本路径的参数列表
 * @returns {{ help: boolean, git: boolean, skills: string[], groups: string[] }}
 */
export const parseArgs = createArgumentParser({
  groups: SKILL_GROUPS,
  selectFlag: '--skill',
  selectShort: '-s',
});

/**
 * 根据参数选择要更新的上游配置。
 *
 * 存在 `--skill` 时忽略所有分组选项；无任何选择参数时返回全部配置。
 *
 * @param {{ skills: string[], groups: string[] }} args
 * @returns {SkillSource[]}
 */
export const selectSources = createSourceSelector(SKILL_SOURCES, {
  nameKey: 'skill',
  namesKey: 'skills',
  noun: 'skill',
});

/** 生成由集中配置派生的 CLI 帮助文本。 */
export const formatHelp = () => formatUpgradeHelp({
  scriptPath: 'scripts/upgrade/skill.mjs',
  selectOptionLine: '-s, --skill <name>   Sync a named skill (repeatable; overrides groups)',
  groups: SKILL_GROUPS,
  groupNoun: 'skill',
  catalogNoun: 'Skills',
  emptySelectionNoun: 'skills',
  catalog: SKILL_SOURCES,
  nameKey: 'skill',
  npmExamples: [
    'npm run upgrade:skill',
    'npm run upgrade:skill -- --fetch',
    'npm run upgrade:skill -- --skill frontend-design',
    'npm run upgrade:skill -- --git --skill frontend-design',
    'npm run upgrade:skill -- --design',
    'npm run upgrade:design',
    'npm run upgrade:tool',
  ],
});

/**
 * 在暂存区递归移除 superpower 组 Markdown 中的技能命名空间前缀。
 *
 * @param {string} stagingDir
 * @param {SkillSource} source
 * @returns {Promise<void>}
 */
export const postProcessSkill = async (stagingDir, source) => {
  if (!source.groups.includes('superpower')) return;

  const walk = async (directory) => {
    const entries = await fs.promises.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(filename);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = await fs.promises.readFile(filename, 'utf8');
        const processed = content.replaceAll('superpowers:', '');
        if (processed !== content) await fs.promises.writeFile(filename, processed);
      }
    }
  };
  await walk(stagingDir);
};

const syncSkill = (source, onDetail, { git = true, download } = {}) =>
  syncConfiguredItem(source, onDetail, {
    rootDir: skillsRoot,
    nameKey: 'skill',
    noun: 'Skill',
    download: download ?? (git ? createGitSparseDownloader : createHttpsDownloader)(source),
    postProcess: (stagingDir) => postProcessSkill(stagingDir, source),
  });

/**
 * 并行更新互相独立的 skills，并在全部任务结束后汇总失败。
 *
 * @param {SkillSource[]} sources
 * @param {(source: SkillSource, onDetail: (message: unknown) => void) => Promise<{ durationMs: number, fileCount: number }>} [worker]
 * @param {ReturnType<typeof createUpgradeReporter>} [reporter]
 * @param {{ skillsRoot?: string }} [options]
 * @returns {Promise<void>}
 */
export const syncSkillsConcurrently = (
  sources,
  worker = syncSkill,
  reporter,
  { skillsRoot: cleanupRoot = skillsRoot } = {},
) => syncItemsConcurrently(sources, worker, reporter, {
  root: cleanupRoot,
  nameKey: 'skill',
});

/**
 * 执行通用 skill 更新 CLI。
 *
 * @param {string[]} argv 不包含 Node 与脚本路径的参数列表
 * @returns {Promise<void>}
 */
export const runCli = (argv = process.argv.slice(2)) => runUpgradeCli({
  argv,
  rootDir: skillsRoot,
  projectRoot,
  formatHelp,
  parseArgs,
  selectSources,
  nameKey: 'skill',
  noun: 'skill',
  plural: 'skills',
  postProcess: postProcessSkill,
  requiredFile: 'SKILL.md',
  doneMessage: 'Upgrade skills done',
  createReporter: createUpgradeReporter,
});

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  runCli().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
