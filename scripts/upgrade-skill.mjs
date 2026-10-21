/**
 * 从上游 GitHub 仓库同步已配置 skills 到本仓库 `skills/` 目录。
 * 下载、镜像替换和报告来自 common-download.mjs 与 common-report.mjs。
 *
 * @module scripts/upgrade-skill
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createArgumentParser,
  createGitSparseDownloader,
  createHttpsDownloader,
  createSourceSelector,
  formatUpgradeHelp,
  runUpgradeCli,
  syncConfiguredItem,
  syncItemsConcurrently,
} from './common-download.mjs';
import { createUpgradeReporter } from './common-report.mjs';

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
} from './common-download.mjs';

//#region Constants

/**
 * 可从上游更新的 skill 配置。
 *
 * `repo` 为仓库根 URL，`path` 为仓库内相对路径，`ref` 为要下载的分支。
 * `groups` 同时定义 CLI 分组选项，例如 `design` 对应 `--design`。
 */
export const SKILL_SOURCES = [
  {
    skill: 'hatch-pet',
    repo: 'https://github.com/openai/skills',
    ref: 'main',
    path: 'skills/.curated/hatch-pet',
    groups: ['pet'],
  },
  {
    skill: 'skill-forge',
    repo: 'https://github.com/sanyuan0704/sanyuan-skills',
    ref: 'main',
    path: 'skills/skill-forge',
    groups: ['skill'],
  },
  {
    skill: 'grilling',
    repo: 'https://github.com/mattpocock/skills',
    ref: 'main',
    path: 'skills/productivity/grilling',
    groups: ['mattpocock'],
  },
  {
    skill: 'domain-modeling',
    repo: 'https://github.com/mattpocock/skills',
    ref: 'main',
    path: 'skills/engineering/domain-modeling',
    groups: ['mattpocock'],
  },
  {
    skill: 'writing-for-agents',
    repo: 'https://github.com/mattpocock/skills',
    ref: 'main',
    path: 'skills/productivity/writing-for-agents',
    groups: ['mattpocock'],
  },
  {
    skill: 'frontend-design',
    repo: 'https://github.com/anthropics/skills',
    ref: 'main',
    path: 'skills/frontend-design',
    groups: ['design'],
  },
  {
    skill: 'ui-ux-pro-max',
    repo: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill',
    ref: 'main',
    path: '.claude/skills/ui-ux-pro-max',
    groups: ['design'],
  },
  {
    skill: 'brainstorming',
    repo: 'https://github.com/obra/superpowers',
    ref: 'main',
    path: 'skills/brainstorming',
    groups: ['superpower'],
  },
  {
    skill: 'writing-plans',
    repo: 'https://github.com/obra/superpowers',
    ref: 'main',
    path: 'skills/writing-plans',
    groups: ['superpower'],
  },
  {
    skill: 'test-driven-development',
    repo: 'https://github.com/obra/superpowers',
    ref: 'main',
    path: 'skills/test-driven-development',
    groups: ['superpower'],
  },
  {
    skill: 'systematic-debugging',
    repo: 'https://github.com/obra/superpowers',
    ref: 'main',
    path: 'skills/systematic-debugging',
    groups: ['superpower'],
  },
  {
    skill: 'requesting-code-review',
    repo: 'https://github.com/obra/superpowers',
    ref: 'main',
    path: 'skills/requesting-code-review',
    groups: ['superpower'],
  },
  {
    skill: 'receiving-code-review',
    repo: 'https://github.com/obra/superpowers',
    ref: 'main',
    path: 'skills/receiving-code-review',
    groups: ['superpower'],
  },
  {
    skill: 'verification-before-completion',
    repo: 'https://github.com/obra/superpowers',
    ref: 'main',
    path: 'skills/verification-before-completion',
    groups: ['superpower'],
  }
];

/** 从配置派生的可用分组，顺序与首次出现顺序一致。 */
export const SKILL_GROUPS = Object.freeze([
  ...new Set(SKILL_SOURCES.flatMap(({ groups }) => groups)),
]);

//#endregion

/** 当前模块路径与仓库目录。 */
const modulePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(modulePath), '..');
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
 * @returns {typeof SKILL_SOURCES[number][]}
 */
export const selectSources = createSourceSelector(SKILL_SOURCES, {
  nameKey: 'skill',
  namesKey: 'skills',
  noun: 'skill',
});

/** 生成由集中配置派生的 CLI 帮助文本。 */
export const formatHelp = () => formatUpgradeHelp({
  scriptPath: 'scripts/upgrade-skill.mjs',
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
 * @param {typeof SKILL_SOURCES[number]} source
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
 * @param {typeof SKILL_SOURCES[number][]} sources
 * @param {(source: typeof SKILL_SOURCES[number], onDetail: (message: unknown) => void) => Promise<{ durationMs: number, fileCount: number }>} [worker]
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
