/**
 * 从上游 GitHub 仓库同步已配置 skills 到本仓库 `skills/` 目录。
 *
 * @module scripts/upgrade-skill
 */

import fs from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { createUpgradeReporter } from './upgrade-skill-reporter.mjs';

/** 提取归档时才加载 tar，未安装时 --git 与帮助仍可运行。 */
const loadTar = async () => {
  try {
    return await import('tar');
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error('Missing tar package. Run npm install --ignore-scripts before --fetch.', { cause: error });
    }
    throw error;
  }
};

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

/** 仅用于帮助文本：把配置展示成可打开的 GitHub tree 页面。 */
const formatSkillTreeUrl = ({ repo, path: remotePath, ref }) =>
  `${repo}/tree/${ref}/${remotePath}`;

//#endregion

/** 当前模块路径与仓库目录。 */
const modulePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(modulePath), '..');
const skillsRoot = path.join(projectRoot, 'skills');

/**
 * 把技能配置解析成下载参数。不经过 tree URL。
 *
 * @param {{ repo: string, path: string, ref: string }} source
 * @returns {{ repositoryUrl: string, remotePath: string, ref: string }}
 */
const resolveRepository = ({ repo, path: remotePath, ref }) => {
  if (!repo || !remotePath || !ref) {
    throw new Error('Skill source requires repo, path, and ref');
  }

  let parsed;
  try {
    parsed = new URL(repo);
  } catch {
    throw new Error(`Invalid skill repository URL: ${repo}`);
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  const owner = segments[0];
  const name = segments[1]?.replace(/\.git$/i, '');
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'github.com' ||
    segments.length !== 2 ||
    !owner ||
    !name
  ) {
    throw new Error(`Invalid skill repository URL: ${repo}`);
  }

  return {
    repositoryUrl: `https://github.com/${owner}/${name}.git`,
    remotePath,
    ref,
  };
};

/**
 * 解析升级脚本的命令行参数。
 *
 * @param {string[]} argv 不包含 Node 与脚本路径的参数列表
 * @returns {{ help: boolean, git: boolean, skills: string[], groups: string[] }}
 */
export const parseArgs = (argv) => {
  const result = { help: false, git: true, skills: [], groups: [] };
  let transport;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--git' || arg === '--fetch') {
      if (transport && transport !== arg) {
        throw new Error('--fetch and --git are mutually exclusive');
      }
      transport = arg;
      result.git = arg === '--git';
      continue;
    }

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
      --git            Download via Git sparse checkout (default)
      --fetch          Download via HTTPS archive (exclusive with --git)
${SKILL_GROUPS.map((group) => `      --${group.padEnd(13)} Sync the ${group} skill group`).join('\n')}
  -h, --help           Show this help

With no selection option, all configured skills are updated.

Skills:
${SKILL_SOURCES.map(
  (source) =>
    `  ${source.skill.padEnd(18)} [${source.groups.join(', ')}] ${formatSkillTreeUrl(source)}`,
).join('\n')}

npm examples:
  npm run upgrade:skill
  npm run upgrade:skill -- --fetch
  npm run upgrade:skill -- --skill frontend-design
  npm run upgrade:skill -- --git --skill frontend-design
  npm run upgrade:skill -- --design
  npm run upgrade:design
  npm run upgrade:tool
`;

const RM_OPTIONS = Object.freeze({
  recursive: true,
  force: true,
  maxRetries: 5,
  retryDelay: 100,
});
const UPGRADE_WORK_DIR_PATTERN = /^\..+-upgrade-.+$/;

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

/**
 * 判断目录名是否为 `mkdtemp` 生成的 skill 升级工作目录，
 * 例如 `.frontend-design-upgrade-oizzQ5`。
 *
 * @param {string} name
 * @returns {boolean}
 */
export const isUpgradeWorkDirName = (name) =>
  UPGRADE_WORK_DIR_PATTERN.test(name);

const removeDir = async (target, rm = fs.promises.rm) => {
  await rm(target, RM_OPTIONS);
};

/**
 * 删除 `skills/` 下残留的 `.<skill>-upgrade-*` 临时目录。
 *
 * 在整次升级结束后调用，覆盖单次同步失败、中断或 Windows 文件锁导致
 * `finally` 未能删净的情况；不会删除正式 skill 目录。
 *
 * @param {string} root
 * @param {{
 *   readdir?: typeof fs.promises.readdir,
 *   rm?: typeof fs.promises.rm,
 * }} [io]
 * @returns {Promise<void>}
 */
export const cleanupUpgradeWorkDirs = async (
  root,
  { readdir = fs.promises.readdir, rm = fs.promises.rm } = {},
) => {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  const leftovers = entries.filter(
    (entry) => entry.isDirectory() && isUpgradeWorkDirName(entry.name),
  );

  const results = await Promise.allSettled(
    leftovers.map((entry) => removeDir(path.join(root, entry.name), rm)),
  );
  const failures = results.flatMap((result, index) =>
    result.status === 'rejected'
      ? [`${leftovers[index].name}: ${result.reason?.message || result.reason}`]
      : [],
  );

  if (failures.length > 0) {
    throw new Error(`Failed to remove upgrade work directories:\n${failures.join('\n')}`);
  }
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

/**
 * 将远端下载经后处理后安全替换为本地 skill 镜像。
 *
 * @param {{
 *   localDir: string,
 *   download: (stagingDir: string) => Promise<void>,
 *   postProcess?: (stagingDir: string) => Promise<void>,
 *   onDetail?: (detail: { mode: 'U' | 'M' | 'D', path: string }) => void,
 *   rename?: (source: string, destination: string) => Promise<void>,
 * }} options
 * @returns {Promise<{ fileCount: number }>}
 */
export const syncSkillMirror = async ({
  localDir,
  download,
  postProcess = async () => {},
  onDetail = () => { },
  rename = fs.promises.rename,
  rm = fs.promises.rm,
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

  await fs.promises.mkdir(stagingDir);

  try {
    await download(stagingDir);
    await postProcess(stagingDir);
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
        throw new AggregateError(
          [error, rollbackError],
          `Skill swap and rollback failed; backup was at ${backupDir}`,
        );
      }
    }
    throw error;
  } finally {
    try {
      await removeDir(workDir, rm);
    } catch {
      // End-of-run sweep retries leftover work dirs; do not mask the sync result.
    }
  }
};

/** 由仓库根 `.git` URL 与分支名拼出 GitHub 分支源码归档地址。 */
const archiveUrlFor = (repositoryUrl, ref) =>
  repositoryUrl.slice(0, -4) +
  '/archive/refs/heads/' + encodeURIComponent(ref) + '.tar.gz';

/**
 * 将分支归档流式下载到指定目录，返回归档文件路径。
 *
 * @param {{ repositoryUrl: string, ref: string }} source
 * @param {string} archiveDir
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<string>}
 */
const downloadRepositoryArchive = async ({ repositoryUrl, ref }, archiveDir, fetchImpl) => {
  await fs.promises.mkdir(archiveDir, { recursive: true });
  const archiveFile = path.join(archiveDir, 'source.tar.gz');
  const archiveUrl = archiveUrlFor(repositoryUrl, ref);
  const response = await fetchImpl(archiveUrl, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ' downloading ' + archiveUrl);
  }
  if (!response.body) throw new Error('Empty archive response: ' + archiveUrl);
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(archiveFile));
  return archiveFile;
};

/**
 * 从已下载的归档中校验并提取单个 skill 到暂存目录。
 *
 * @param {string} archiveFile
 * @param {string} remotePath
 * @param {string} stagingDir
 * @returns {Promise<void>}
 */
const extractSkillFromArchive = async (archiveFile, remotePath, stagingDir) => {
  const { t: listTar, x: extractTar } = await loadTar();
  const prefix = remotePath + '/';
  const selected = new Set();
  let hasSkill = false;
  let validationError;
  // Inspect before extraction so invalid members cannot produce a partial mirror.
  await listTar({ file: archiveFile, strict: true, onReadEntry: (entry) => {
    const parts = entry.path.split('/');
    parts.shift(); // GitHub archives wrap all paths in one repository directory.
    const relative = parts.join('/').replace(/\/$/, '');
    if (relative !== remotePath && !relative.startsWith(prefix)) return;
    if (entry.header.path?.includes('\\') || entry.path.startsWith('/') ||
      entry.path.split('/').some((part, index, all) =>
        (!part && index !== all.length - 1) || part === '.' || part === '..' ||
        /[\\:<>"|?*\x00-\x1f]/.test(part) || /[. ]$/.test(part) ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) {
      validationError ||= new Error('Unsafe archive path: ' + entry.path);
      return;
    }
    if (!['File', 'Directory'].includes(entry.type)) {
      validationError ||= new Error('Unsupported archive entry: ' + entry.path);
      return;
    }
    selected.add(entry.path);
    if (relative === prefix + 'SKILL.md' && entry.type === 'File') hasSkill = true;
  } });
  if (validationError) throw validationError;
  if (!hasSkill) throw new Error('Missing upstream SKILL.md: ' + remotePath);
  await extractTar({
    file: archiveFile,
    cwd: stagingDir,
    strip: remotePath.split('/').length + 1,
    strict: true,
    chmod: true,
    filter: (entryPath) => selected.has(entryPath),
  });
};

/**
 * 用 fetch 下载 GitHub 分支源码归档，由 tar 校验并提取目标 skill。
 * 不调用 GitHub API，不依赖本机 Git 或 tar 命令。
 *
 * @param {{ repo: string, path: string, ref: string }} source
 * @param {{ fetchImpl?: typeof fetch }} options
 * @returns {(stagingDir: string) => Promise<void>}
 */
export const createHttpsDownloader = (
  source,
  { fetchImpl = fetch } = {},
) => {
  const { repositoryUrl, remotePath, ref } = resolveRepository(source);

  return async (stagingDir) => {
    const archiveDir = await fs.promises.mkdtemp(path.join(path.dirname(stagingDir), 'archive-'));
    try {
      const archiveFile = await downloadRepositoryArchive(
        { repositoryUrl, ref }, archiveDir, fetchImpl,
      );
      await extractSkillFromArchive(archiveFile, remotePath, stagingDir);
    } finally {
      await removeDir(archiveDir);
    }
  };
};

/** 执行 Git，隐藏 Windows 控制台窗口并保留有界错误输出。 */
export const runGit = (args, { spawnImpl = spawn } = {}) =>
  new Promise((resolve, reject) => {
    const child = spawnImpl('git', args, {
      shell: false,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout = (stdout + chunk).slice(-8192); });
    child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-8192); });
    child.once('error', (error) => reject(error.code === 'ENOENT'
      ? new Error('Git executable not found; install Git and ensure it is on PATH')
      : error));
    child.once('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Git ${args[0]} failed with exit code ${code}: ${stderr.trim() || stdout.trim() || 'no output'}`));
    });
  });

/**
 * 共享下载会话中单个仓库工作目录名：`owner-repo`，非 main 时追加 ref。
 * 不按 skill 命名，以便同仓库多 skill 共用一目了然的目录。
 *
 * @param {{ repositoryUrl: string, ref: string }} repository
 * @returns {string}
 */
export const repositoryWorkDirName = ({ repositoryUrl, ref }) => {
  const { pathname } = new URL(repositoryUrl);
  const segments = pathname.replace(/\.git$/i, '').split('/').filter(Boolean);
  const owner = segments.at(-2) || 'repo';
  const name = segments.at(-1) || 'unknown';
  const slug = (value) =>
    String(value).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
  const base = `${slug(owner)}-${slug(name)}`;
  return ref === 'main' ? base : `${base}-${slug(ref)}`;
};

/** 一次性检出同一仓库的全部所选路径，避免并发修改稀疏检出范围。 */
const checkoutGitRepository = async ({ repositoryUrl, ref, paths }, repositoryDir, run) => {
  await run([
    'clone', '--depth', '1', '--single-branch', '--filter=blob:none',
    '--sparse', '--branch', ref, repositoryUrl, repositoryDir,
  ]);
  await run(['-C', repositoryDir, 'sparse-checkout', 'set', '--no-cone', ...paths]);
  return repositoryDir;
};

/** 验证单个 skill 后按其 path 复制到独立暂存区。 */
const copyGitSkill = async (repositoryDir, remotePath, stagingDir) => {
  const sourceDir = path.join(repositoryDir, ...remotePath.split('/'));
  const skillFile = await fs.promises.stat(path.join(sourceDir, 'SKILL.md')).catch((error) => {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      throw new Error('Missing upstream SKILL.md: ' + remotePath);
    }
    throw error;
  });
  if (!skillFile.isFile()) throw new Error('Missing upstream SKILL.md: ' + remotePath);
  await fs.promises.cp(sourceDir, stagingDir, { recursive: true, force: true });
};

/**
 * 单技能浅层稀疏下载；检出目录由调用方的升级工作目录负责清理。
 *
 * @param {{ repo: string, path: string, ref: string }} source
 * @param {{ run?: typeof runGit }} options
 * @returns {(stagingDir: string) => Promise<void>}
 */
export const createGitSparseDownloader = (source, { run = runGit } = {}) => {
  const resolved = resolveRepository(source);
  return async (stagingDir) => {
    const repositoryDir = path.join(path.dirname(stagingDir), 'repository');
    await checkoutGitRepository({ ...resolved, paths: [resolved.remotePath] }, repositoryDir, run);
    await copyGitSkill(repositoryDir, resolved.remotePath, stagingDir);
  };
};

/**
 * 按仓库和 ref 合并所选 path，共享一次 acquire，再分别 materialize。
 * acquire 结果（含失败）通过 Promise 复用；全部消费者结束后调用 cleanup。
 *
 * @param {typeof SKILL_SOURCES} sources
 * @param {{
 *   root?: string,
 *   workDirPrefix: string,
 *   label: string,
 *   acquire: (repository: object, workPath: string) => Promise<unknown>,
 *   materialize: (acquired: unknown, remotePath: string, stagingDir: string) => Promise<void>,
 * }} options
 * @returns {Promise<{ download: (source: typeof SKILL_SOURCES[number], stagingDir: string) => Promise<void>, cleanup: () => Promise<void> }>}
 */
const createDownloadSession = async (
  sources,
  { root = skillsRoot, workDirPrefix, label, acquire, materialize },
) => {
  const repositories = new Map();
  const keyOf = ({ repositoryUrl, ref }) => JSON.stringify([repositoryUrl, ref]);
  for (const source of sources) {
    const parsed = resolveRepository(source);
    const key = keyOf(parsed);
    if (!repositories.has(key)) repositories.set(key, { ...parsed, paths: new Set() });
    repositories.get(key).paths.add(parsed.remotePath);
  }
  await fs.promises.mkdir(root, { recursive: true });
  const workDir = await fs.promises.mkdtemp(path.join(root, workDirPrefix));
  return {
    download: async (source, stagingDir) => {
      const parsed = resolveRepository(source);
      const repository = repositories.get(keyOf(parsed));
      if (!repository || !repository.paths.has(parsed.remotePath)) {
        throw new Error(`Skill not selected for ${label} download: ${source.skill}`);
      }
      repository.ready ??= acquire(
        repository,
        path.join(workDir, repositoryWorkDirName(repository)),
      );
      await materialize(await repository.ready, parsed.remotePath, stagingDir);
    },
    cleanup: () => removeDir(workDir),
  };
};

/**
 * 为一次升级共享 HTTPS 归档：按仓库和 ref 合并路径，每组只下载一次 `.tar.gz`。
 *
 * @param {typeof SKILL_SOURCES} sources
 * @param {{ root?: string, fetchImpl?: typeof fetch }} options
 * @returns {Promise<{ download: (source: typeof SKILL_SOURCES[number], stagingDir: string) => Promise<void>, cleanup: () => Promise<void> }>}
 */
export const createHttpsDownloadSession = (
  sources,
  { root = skillsRoot, fetchImpl = fetch } = {},
) => createDownloadSession(sources, {
  root,
  workDirPrefix: '.archives-upgrade-',
  label: 'HTTPS',
  acquire: (repository, dir) => downloadRepositoryArchive(repository, dir, fetchImpl),
  materialize: extractSkillFromArchive,
});

/**
 * 为一次升级共享 Git 检出：按仓库和 ref 合并路径，每组只克隆一次。
 *
 * @param {typeof SKILL_SOURCES} sources
 * @param {{ root?: string, run?: typeof runGit }} options
 * @returns {Promise<{ download: (source: typeof SKILL_SOURCES[number], stagingDir: string) => Promise<void>, cleanup: () => Promise<void> }>}
 */
export const createGitDownloadSession = (
  sources,
  { root = skillsRoot, run = runGit } = {},
) => createDownloadSession(sources, {
  root,
  workDirPrefix: '.repositories-upgrade-',
  label: 'Git',
  acquire: (repository, dir) => checkoutGitRepository(repository, dir, run),
  materialize: copyGitSkill,
});

/**
 * 将上游完整下载经后处理后安全同步为本地 skill 镜像。
 *
 * @param {typeof SKILL_SOURCES[number]} source
 * @param {(detail: string | { mode: 'U' | 'M' | 'D', path: string }) => void} onDetail
 * @param {{ git?: boolean, download?: (stagingDir: string) => Promise<void> }} options
 * @returns {Promise<{ durationMs: number, fileCount: number }>}
 */
const syncSkill = async (source, onDetail, { git = true, download } = {}) => {
  const startedAt = Date.now();
  const createDownloader = git ? createGitSparseDownloader : createHttpsDownloader;
  download ??= createDownloader(source);
  const localDir = path.join(skillsRoot, source.skill);

  const { fileCount } = await syncSkillMirror({
    localDir,
    download,
    postProcess: (stagingDir) => postProcessSkill(stagingDir, source),
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
 * @param {{ skillsRoot?: string }} [options]
 * @returns {Promise<void>}
 */
export const syncSkillsConcurrently = async (
  sources,
  worker = syncSkill,
  reporter = SILENT_REPORTER,
  { skillsRoot: cleanupRoot = skillsRoot } = {},
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
    try {
      reporter.finish();
    } finally {
      await cleanupUpgradeWorkDirs(cleanupRoot);
    }
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
  let args;
  try {
    args = parseArgs(argv);

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
    await cleanupUpgradeWorkDirs(skillsRoot);
    return;
  }

  console.log(`Project: ${projectRoot}`);
  console.log();

  let downloadSession;
  try {
    downloadSession = args.git
      ? await createGitDownloadSession(selected)
      : await createHttpsDownloadSession(selected);
    await syncSkillsConcurrently(
      selected,
      (source, onDetail) => syncSkill(source, onDetail, {
        git: args.git,
        download: (stagingDir) => downloadSession.download(source, stagingDir),
      }),
      createUpgradeReporter(selected),
    );

    console.log();
    console.log('Upgrade skills done');
  } finally {
    try {
      await downloadSession?.cleanup();
    } finally {
      await cleanupUpgradeWorkDirs(skillsRoot);
    }
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  runCli().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}
