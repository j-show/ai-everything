/**
 * 从上游 GitHub 仓库同步已配置 skills 到本仓库 `skills/` 目录。
 *
 * @module scripts/upgrade-skill
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createUpgradeReporter } from './upgrade-skill-reporter.mjs';

//#region Constants

/**
 * 可从上游更新的 skill 配置。
 *
 * `groups` 同时定义 CLI 分组选项，例如 `design` 对应 `--design`。
 */
export const SKILL_SOURCES = [
  {
    skill: 'frontend-design',
    url: 'https://github.com/anthropics/skills/tree/main/skills/frontend-design',
    groups: ['design'],
  },
  {
    skill: 'ui-ux-pro-max',
    url: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/main/.claude/skills/ui-ux-pro-max',
    groups: ['design'],
  },
  {
    skill: 'grilling',
    url: 'https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling',
    groups: ['tool'],
  },
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
 * 从 GitHub tree URL 解析 Git 仓库与稀疏检出参数。
 *
 * URL 格式为：
 * `https://github.com/<owner>/<repo>/tree/<ref>/<remotePath>`。
 *
 * @param {string} value
 * @returns {{
 *   repositoryUrl: string,
 *   remotePath: string,
 *   ref: string,
 * }}
 */
export const parseGitHubTreeUrl = (value) => {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid GitHub skill URL: ${value}`);
  }

  const segments = parsed.pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
  const [owner, repo, tree, ref, ...remotePathParts] = segments;

  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'github.com' ||
    !owner ||
    !repo ||
    tree !== 'tree' ||
    !ref ||
    remotePathParts.length === 0
  ) {
    throw new Error(`Invalid GitHub skill URL: ${value}`);
  }

  return {
    repositoryUrl: `https://github.com/${owner}/${repo}.git`,
    remotePath: remotePathParts.join('/'),
    ref,
  };
};

/**
 * 解析升级脚本的命令行参数。
 *
 * @param {string[]} argv 不包含 Node 与脚本路径的参数列表
 * @returns {{ help: boolean, skills: string[], groups: string[] }}
 */
export const parseArgs = (argv) => {
  const result = { help: false, skills: [], groups: [] };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }

    if (arg === '--skill' || arg === '-s') {
      const value = argv[++i];
      if (!value) {
        throw new Error('Missing value for --skill');
      }
      result.skills.push(value);
      continue;
    }

    if (arg.startsWith('--skill=')) {
      const value = arg.slice('--skill='.length);
      if (!value) {
        throw new Error('Missing value for --skill');
      }
      result.skills.push(value);
      continue;
    }

    if (arg.startsWith('--') && SKILL_GROUPS.includes(arg.slice(2))) {
      result.groups.push(arg.slice(2));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return result;
};

/**
 * 根据参数选择要更新的上游配置。
 *
 * 存在 `--skill` 时忽略所有分组选项；无任何选择参数时返回全部配置。
 *
 * @param {{ skills: string[], groups: string[] }} args
 * @returns {typeof SKILL_SOURCES[number][]}
 */
export const selectSources = ({ skills, groups }) => {
  if (skills.length > 0) {
    const unknown = skills.filter(
      (name) => !SKILL_SOURCES.some(({ skill }) => skill === name),
    );

    if (unknown.length > 0) {
      throw new Error(`unknown skill(s): ${[...new Set(unknown)].join(', ')}`);
    }

    return SKILL_SOURCES.filter(({ skill }) => skills.includes(skill));
  }

  if (groups.length === 0) {
    return [...SKILL_SOURCES];
  }

  return SKILL_SOURCES.filter(({ groups: sourceGroups }) =>
    sourceGroups.some((group) => groups.includes(group)),
  );
};

/** 生成由集中配置派生的 CLI 帮助文本。 */
export const formatHelp = () => `Usage: node scripts/upgrade-skill.mjs [options]

Options:
  -s, --skill <name>   Sync a named skill (repeatable; overrides groups)
${SKILL_GROUPS.map((group) => `      --${group.padEnd(13)} Sync the ${group} skill group`).join('\n')}
  -h, --help           Show this help

With no selection option, all configured skills are updated.

Skills:
${SKILL_SOURCES.map(
  ({ skill, groups, url }) =>
    `  ${skill.padEnd(18)} [${groups.join(', ')}] ${url}`,
).join('\n')}

npm examples:
  npm run upgrade:skill
  npm run upgrade:skill -- --skill frontend-design
  npm run upgrade:skill -- --design
  npm run upgrade:design
  npm run upgrade:tool
`;

const MAX_GIT_OUTPUT = 8 * 1024;

const appendBounded = (current, chunk) =>
  `${current}${chunk}`.slice(-MAX_GIT_OUTPUT);

export const runGit = (
  args,
  {
    spawnImpl = spawn,
    operation = args[0] || 'command',
  } = {},
) => new Promise((resolve, reject) => {
  const child = spawnImpl('git', args, {
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  let settled = false;

  child.stdout.on('data', (chunk) => {
    stdout = appendBounded(stdout, chunk);
  });
  child.stderr.on('data', (chunk) => {
    stderr = appendBounded(stderr, chunk);
  });
  child.once('error', (error) => {
    if (settled) return;
    settled = true;
    reject(
      error.code === 'ENOENT'
        ? new Error(
          'Git executable not found; install Git and ensure it is on PATH',
        )
        : error,
    );
  });
  child.once('close', (code) => {
    if (settled) return;
    settled = true;
    if (code === 0) {
      resolve({ stdout, stderr });
      return;
    }
    const diagnostic = stderr.trim() || stdout.trim() || 'no output';
    reject(
      new Error(`Git ${operation} failed with exit code ${code}: ${diagnostic}`),
    );
  });
});

/**
 * 判断本地与远端文件集合之间的同步模式。
 *
 * @param {{
 *   localExists: boolean,
 *   remoteExists: boolean,
 *   contentEqual: boolean,
 * }} state
 * @returns {'U' | 'M' | 'D' | null}
 */
export const getFileMode = ({
  localExists,
  remoteExists,
  contentEqual,
}) => {
  if (!localExists) {
    return remoteExists ? 'U' : null;
  }
  if (!remoteExists) {
    return 'D';
  }
  return contentEqual ? null : 'M';
};

const pathExists = async (target) => {
  try {
    await fs.promises.access(target);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

const collectRelativeFiles = async (root) => {
  if (!(await pathExists(root))) {
    return new Set();
  }

  const walk = async (relativeDir) => {
    const entries = await fs.promises.readdir(path.join(root, relativeDir), {
      withFileTypes: true,
    });
    const nested = await Promise.all(entries.map(async (entry) => {
      const relativePath = path.join(relativeDir, entry.name);
      return entry.isDirectory()
        ? walk(relativePath)
        : [relativePath];
    }));
    return nested.flat();
  };

  return new Set(await walk(''));
};

const filesEqual = async (left, right) => {
  const [leftStat, rightStat] = await Promise.all([
    fs.promises.stat(left),
    fs.promises.stat(right),
  ]);

  if (leftStat.size !== rightStat.size) {
    return false;
  }

  const [leftContent, rightContent] = await Promise.all([
    fs.promises.readFile(left),
    fs.promises.readFile(right),
  ]);
  return leftContent.equals(rightContent);
};

/**
 * 将完整远端下载安全替换为本地 skill 严格镜像。
 *
 * @param {{
 *   localDir: string,
 *   download: (stagingDir: string) => Promise<void>,
 *   onDetail?: (detail: { mode: 'U' | 'M' | 'D', path: string }) => void,
 *   rename?: (source: string, destination: string) => Promise<void>,
 * }} options
 * @returns {Promise<{ fileCount: number }>}
 */
export const syncSkillMirror = async ({
  localDir,
  download,
  onDetail = () => {},
  rename = fs.promises.rename,
}) => {
  const localFiles = await collectRelativeFiles(localDir);
  const parentDir = path.dirname(localDir);
  await fs.promises.mkdir(parentDir, { recursive: true });

  const workDir = await fs.promises.mkdtemp(
    path.join(parentDir, `.${path.basename(localDir)}-upgrade-`),
  );
  const stagingDir = path.join(workDir, 'staging');
  const backupDir = path.join(workDir, 'backup');
  let needsRestore = false;
  let preserveWorkDir = false;

  await fs.promises.mkdir(stagingDir);

  try {
    await download(stagingDir);
    const remoteFiles = await collectRelativeFiles(stagingDir);
    const relativePaths = [...new Set([...localFiles, ...remoteFiles])].sort();

    for (const relativePath of relativePaths) {
      const localExists = localFiles.has(relativePath);
      const remoteExists = remoteFiles.has(relativePath);
      const contentEqual = localExists && remoteExists
        ? await filesEqual(
          path.join(localDir, relativePath),
          path.join(stagingDir, relativePath),
        )
        : false;
      const mode = getFileMode({ localExists, remoteExists, contentEqual });

      if (mode) {
        onDetail({ mode, path: relativePath });
      }
    }

    if (await pathExists(localDir)) {
      await rename(localDir, backupDir);
      needsRestore = true;
    }
    await rename(stagingDir, localDir);
    needsRestore = false;

    return { fileCount: remoteFiles.size };
  } catch (error) {
    if (needsRestore) {
      try {
        await rename(backupDir, localDir);
        needsRestore = false;
      } catch (rollbackError) {
        preserveWorkDir = true;
        throw new AggregateError(
          [error, rollbackError],
          `Skill swap and rollback failed; backup preserved at ${backupDir}`,
        );
      }
    }
    throw error;
  } finally {
    if (!preserveWorkDir) {
      await fs.promises.rm(workDir, { recursive: true, force: true });
    }
  }
};

/**
 * 为一个 GitHub skill 创建 Git 稀疏检出下载器。
 *
 * @param {string} sourceUrl
 * @param {{ run?: typeof runGit }} options
 * @returns {(stagingDir: string) => Promise<void>}
 */
export const createGitSparseDownloader = (
  sourceUrl,
  { run = runGit } = {},
) => {
  const { repositoryUrl, remotePath, ref } =
    parseGitHubTreeUrl(sourceUrl);

  return async (stagingDir) => {
    const workDir = path.dirname(stagingDir);
    const repositoryDir = path.join(workDir, 'repository');

    await run([
      'clone',
      '--depth', '1',
      '--single-branch',
      '--filter=blob:none',
      '--sparse',
      '--branch', ref,
      repositoryUrl,
      repositoryDir,
    ], { operation: 'clone' });

    await run([
      '-C', repositoryDir,
      'sparse-checkout', 'set', '--no-cone',
      remotePath,
    ], { operation: 'sparse-checkout' });

    const sourceDir = path.join(
      repositoryDir,
      ...remotePath.split('/'),
    );
    let entries;
    try {
      entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        throw new Error(`Missing checked-out skill subtree: ${remotePath}`);
      }
      throw error;
    }

    await Promise.all(entries.map((entry) =>
      fs.promises.cp(
        path.join(sourceDir, entry.name),
        path.join(stagingDir, entry.name),
        { recursive: true, force: true },
      )));
  };
};

/**
 * 将上游完整下载安全同步为本地 skill 严格镜像。
 *
 * @param {typeof SKILL_SOURCES[number]} source
 * @param {(detail: string | { mode: 'U' | 'M' | 'D', path: string }) => void} onDetail
 * @returns {Promise<{ durationMs: number, fileCount: number }>}
 */
const syncSkill = async (source, onDetail) => {
  const startedAt = Date.now();
  const download = createGitSparseDownloader(source.url);
  const localDir = path.join(skillsRoot, source.skill);

  const { fileCount } = await syncSkillMirror({
    localDir,
    download,
    onDetail,
  });

  return { durationMs: Date.now() - startedAt, fileCount };
};

const SILENT_REPORTER = {
  start() { },
  detail() { },
  pass() { },
  fail() { },
  finish() { },
};

/**
 * 并行更新互相独立的 skills，并在全部任务结束后汇总失败。
 *
 * @param {typeof SKILL_SOURCES[number][]} sources
 * @param {(source: typeof SKILL_SOURCES[number], onDetail: (message: string) => void) => Promise<{ durationMs: number, fileCount: number }>} worker
 * @param {ReturnType<typeof createUpgradeReporter>} reporter
 * @returns {Promise<void>}
 */
export const syncSkillsConcurrently = async (
  sources,
  worker = syncSkill,
  reporter = SILENT_REPORTER,
) => {
  let results;
  try {
    results = await Promise.allSettled(sources.map(async (source) => {
      reporter.start(source.skill);
      try {
        const result = await worker(
          source,
          (message) => reporter.detail(source.skill, message),
        );
        reporter.pass(source.skill, result);
        return result;
      } catch (error) {
        reporter.fail(source.skill, error);
        throw error;
      }
    }));
  } finally {
    reporter.finish();
  }

  const failures = results.flatMap((result, index) =>
    result.status === 'rejected'
      ? [
        `${sources[index].skill}: ${result.reason?.message || result.reason
        }`,
      ]
      : [],
  );

  if (failures.length > 0) {
    throw new Error(`Upgrade failed:\n${failures.join('\n')}`);
  }
};

/**
 * 执行通用 skill 更新 CLI。
 *
 * @param {string[]} argv 不包含 Node 与脚本路径的参数列表
 * @returns {Promise<void>}
 */
export const runCli = async (argv = process.argv.slice(2)) => {
  let selected;
  try {
    const args = parseArgs(argv);

    if (args.help) {
      console.log(formatHelp());
      return;
    }

    selected = selectSources(args);
    if (selected.length === 0) {
      throw new Error('no skills selected.');
    }
  } catch (error) {
    console.error(`Error: ${error.message}\n`);
    console.log(formatHelp());
    process.exitCode = 1;
    return;
  }

  console.log(`Project: ${projectRoot}`);
  console.log();

  await syncSkillsConcurrently(
    selected,
    syncSkill,
    createUpgradeReporter(selected),
  );

  console.log();
  console.log('Upgrade skills done');
};

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  runCli().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
