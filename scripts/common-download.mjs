/**
 * 技能与规则升级共用的下载、镜像替换和 CLI 辅助函数。
 *
 * @module scripts/common-download
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

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

const titleNoun = (noun) => noun.charAt(0).toUpperCase() + noun.slice(1);

/**
 * 把来源配置解析成下载参数。不经过 tree URL。
 *
 * @param {{ repo: string, path: string, ref: string }} source
 * @param {{ noun?: string }} [options]
 * @returns {{ repositoryUrl: string, remotePath: string, ref: string }}
 */
export const resolveRepository = ({ repo, path: remotePath, ref }, { noun = 'skill' } = {}) => {
  const title = titleNoun(noun);
  if (!repo || !remotePath || !ref) {
    throw new Error(`${title} source requires repo, path, and ref`);
  }

  let parsed;
  try {
    parsed = new URL(repo);
  } catch {
    throw new Error(`Invalid ${noun} repository URL: ${repo}`);
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
    throw new Error(`Invalid ${noun} repository URL: ${repo}`);
  }

  return {
    repositoryUrl: `https://github.com/${owner}/${name}.git`,
    remotePath,
    ref,
  };
};

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
 * 判断目录名是否为 `mkdtemp` 生成的升级工作目录，
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
 * 删除根目录下残留的 `.<name>-upgrade-*` 临时目录。
 *
 * 在整次升级结束后调用，覆盖单次同步失败、中断或 Windows 文件锁导致
 * `finally` 未能删净的情况；不会删除正式镜像目录。
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
 * 将远端下载经后处理后安全替换为本地镜像。
 *
 * @param {{
 *   localDir: string,
 *   download: (stagingDir: string) => Promise<void>,
 *   postProcess?: (stagingDir: string) => Promise<void>,
 *   onDetail?: (detail: { mode: 'U' | 'M' | 'D', path: string }) => void,
 *   rename?: (source: string, destination: string) => Promise<void>,
 *   rm?: typeof fs.promises.rm,
 *   noun?: string,
 * }} options
 * @returns {Promise<{ fileCount: number }>}
 */
export const syncMirror = async ({
  localDir,
  download,
  postProcess = async () => {},
  onDetail = () => { },
  rename = fs.promises.rename,
  rm = fs.promises.rm,
  noun = 'Skill',
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
          `${noun} swap and rollback failed; backup was at ${backupDir}`,
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
 * 从已下载的归档中校验并提取单个路径到暂存目录。
 * `requiredFile` 为 `null` 时只要求该路径在归档中存在。
 *
 * @param {string} archiveFile
 * @param {string} remotePath
 * @param {string} stagingDir
 * @param {{ requiredFile?: string | null }} [options]
 * @returns {Promise<void>}
 */
const extractFromArchive = async (
  archiveFile,
  remotePath,
  stagingDir,
  { requiredFile = 'SKILL.md' } = {},
) => {
  const { t: listTar, x: extractTar } = await loadTar();
  const prefix = remotePath + '/';
  const selected = new Set();
  let hasMarker = false;
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
    if (requiredFile && relative === prefix + requiredFile && entry.type === 'File') {
      hasMarker = true;
    }
  } });
  if (validationError) throw validationError;
  if (requiredFile) {
    if (!hasMarker) throw new Error('Missing upstream ' + requiredFile + ': ' + remotePath);
  } else if (selected.size === 0) {
    throw new Error('Missing upstream path: ' + remotePath);
  }
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
 * 用 fetch 下载 GitHub 分支源码归档，由 tar 校验并提取目标路径。
 * 不调用 GitHub API，不依赖本机 Git 或 tar 命令。
 *
 * @param {{ repo: string, path: string, ref: string }} source
 * @param {{ fetchImpl?: typeof fetch, requiredFile?: string | null, noun?: string }} [options]
 * @returns {(stagingDir: string) => Promise<void>}
 */
export const createHttpsDownloader = (
  source,
  { fetchImpl = fetch, requiredFile = 'SKILL.md', noun = 'skill' } = {},
) => {
  const { repositoryUrl, remotePath, ref } = resolveRepository(source, { noun });

  return async (stagingDir) => {
    const archiveDir = await fs.promises.mkdtemp(path.join(path.dirname(stagingDir), 'archive-'));
    try {
      const archiveFile = await downloadRepositoryArchive(
        { repositoryUrl, ref }, archiveDir, fetchImpl,
      );
      await extractFromArchive(archiveFile, remotePath, stagingDir, { requiredFile });
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

/** 校验目标路径后复制到独立暂存区。 */
const copyRemotePath = async (
  repositoryDir,
  remotePath,
  stagingDir,
  { requiredFile = 'SKILL.md' } = {},
) => {
  const sourceDir = path.join(repositoryDir, ...remotePath.split('/'));
  if (requiredFile) {
    const markerFile = await fs.promises.stat(path.join(sourceDir, requiredFile)).catch((error) => {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        throw new Error('Missing upstream ' + requiredFile + ': ' + remotePath);
      }
      throw error;
    });
    if (!markerFile.isFile()) throw new Error('Missing upstream ' + requiredFile + ': ' + remotePath);
  } else {
    const sourceStat = await fs.promises.stat(sourceDir).catch((error) => {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        throw new Error('Missing upstream path: ' + remotePath);
      }
      throw error;
    });
    if (!sourceStat.isDirectory()) throw new Error('Missing upstream path: ' + remotePath);
  }
  await fs.promises.cp(sourceDir, stagingDir, { recursive: true, force: true });
};

/**
 * 单路径浅层稀疏下载；检出目录由调用方的升级工作目录负责清理。
 *
 * @param {{ repo: string, path: string, ref: string }} source
 * @param {{ run?: typeof runGit, requiredFile?: string | null, noun?: string }} [options]
 * @returns {(stagingDir: string) => Promise<void>}
 */
export const createGitSparseDownloader = (
  source,
  { run = runGit, requiredFile = 'SKILL.md', noun = 'skill' } = {},
) => {
  const resolved = resolveRepository(source, { noun });
  return async (stagingDir) => {
    const repositoryDir = path.join(path.dirname(stagingDir), 'repository');
    await checkoutGitRepository({ ...resolved, paths: [resolved.remotePath] }, repositoryDir, run);
    await copyRemotePath(repositoryDir, resolved.remotePath, stagingDir, { requiredFile });
  };
};

/**
 * 按仓库和 ref 合并所选 path，共享一次 acquire，再分别 materialize。
 * acquire 结果（含失败）通过 Promise 复用；全部消费者结束后调用 cleanup。
 *
 * @param {object[]} sources
 * @param {{
 *   root: string,
 *   workDirPrefix: string,
 *   label: string,
 *   acquire: (repository: object, workPath: string) => Promise<unknown>,
 *   materialize: (acquired: unknown, remotePath: string, stagingDir: string) => Promise<void>,
 *   noun?: string,
 *   nameKey?: string,
 * }} options
 * @returns {Promise<{ download: (source: object, stagingDir: string) => Promise<void>, cleanup: () => Promise<void> }>}
 */
const createDownloadSession = async (
  sources,
  { root, workDirPrefix, label, acquire, materialize, noun = 'skill', nameKey = 'skill' },
) => {
  if (!root) throw new Error('Download session requires a root directory');
  const repositories = new Map();
  const keyOf = ({ repositoryUrl, ref }) => JSON.stringify([repositoryUrl, ref]);
  for (const source of sources) {
    const parsed = resolveRepository(source, { noun });
    const key = keyOf(parsed);
    if (!repositories.has(key)) repositories.set(key, { ...parsed, paths: new Set() });
    repositories.get(key).paths.add(parsed.remotePath);
  }
  await fs.promises.mkdir(root, { recursive: true });
  const workDir = await fs.promises.mkdtemp(path.join(root, workDirPrefix));
  return {
    download: async (source, stagingDir) => {
      const parsed = resolveRepository(source, { noun });
      const repository = repositories.get(keyOf(parsed));
      if (!repository || !repository.paths.has(parsed.remotePath)) {
        throw new Error(`${titleNoun(noun)} not selected for ${label} download: ${source[nameKey]}`);
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
 * @param {object[]} sources
 * @param {{
 *   root: string,
 *   fetchImpl?: typeof fetch,
 *   requiredFile?: string | null,
 *   noun?: string,
 *   nameKey?: string,
 * }} [options]
 * @returns {Promise<{ download: (source: object, stagingDir: string) => Promise<void>, cleanup: () => Promise<void> }>}
 */
export const createHttpsDownloadSession = (
  sources,
  { root, fetchImpl = fetch, requiredFile = 'SKILL.md', noun = 'skill', nameKey = 'skill' } = {},
) => createDownloadSession(sources, {
  root,
  workDirPrefix: '.archives-upgrade-',
  label: 'HTTPS',
  noun,
  nameKey,
  acquire: (repository, dir) => downloadRepositoryArchive(repository, dir, fetchImpl),
  materialize: (archiveFile, remotePath, stagingDir) =>
    extractFromArchive(archiveFile, remotePath, stagingDir, { requiredFile }),
});

/**
 * 为一次升级共享 Git 检出：按仓库和 ref 合并路径，每组只克隆一次。
 *
 * @param {object[]} sources
 * @param {{
 *   root: string,
 *   run?: typeof runGit,
 *   requiredFile?: string | null,
 *   noun?: string,
 *   nameKey?: string,
 * }} [options]
 * @returns {Promise<{ download: (source: object, stagingDir: string) => Promise<void>, cleanup: () => Promise<void> }>}
 */
export const createGitDownloadSession = (
  sources,
  { root, run = runGit, requiredFile = 'SKILL.md', noun = 'skill', nameKey = 'skill' } = {},
) => createDownloadSession(sources, {
  root,
  workDirPrefix: '.repositories-upgrade-',
  label: 'Git',
  noun,
  nameKey,
  acquire: (repository, dir) => checkoutGitRepository(repository, dir, run),
  materialize: (repositoryDir, remotePath, stagingDir) =>
    copyRemotePath(repositoryDir, remotePath, stagingDir, { requiredFile }),
});

/**
 * 将一个已配置条目同步到根目录下的同名镜像。
 *
 * @param {object} source
 * @param {(detail: { mode: 'U' | 'M' | 'D', path: string }) => void} onDetail
 * @param {{
 *   rootDir: string,
 *   nameKey: string,
 *   download: (stagingDir: string) => Promise<void>,
 *   postProcess?: (stagingDir: string, source: object) => Promise<void>,
 *   noun?: string,
 * }} options
 * @returns {Promise<{ durationMs: number, fileCount: number }>}
 */
export const syncConfiguredItem = async (source, onDetail, {
  rootDir,
  nameKey,
  download,
  postProcess = async () => {},
  noun = 'Skill',
}) => {
  const startedAt = Date.now();
  const { fileCount } = await syncMirror({
    localDir: path.join(rootDir, source[nameKey]),
    download,
    postProcess: (stagingDir) => postProcess(stagingDir, source),
    onDetail,
    noun,
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
 * 并行更新互相独立的条目，并在全部任务结束后汇总失败。
 *
 * @param {object[]} sources
 * @param {(source: object, onDetail: (message: unknown) => void) => Promise<{ durationMs: number, fileCount: number }>} worker
 * @param {{ start: Function, detail: Function, pass: Function, fail: Function, finish: Function }} [reporter]
 * @param {{ root: string, nameKey: string }} options
 * @returns {Promise<void>}
 */
export const syncItemsConcurrently = async (
  sources,
  worker,
  reporter = SILENT_REPORTER,
  { root, nameKey },
) => {
  let results;
  try {
    results = await Promise.allSettled(sources.map(async (source) => {
      const name = source[nameKey];
      reporter.start(name);
      try {
        const result = await worker(
          source,
          (message) => reporter.detail(name, message),
        );
        reporter.pass(name, result);
        return result;
      } catch (error) {
        reporter.fail(name, error);
        throw error;
      }
    }));
  } finally {
    try {
      reporter.finish();
    } finally {
      await cleanupUpgradeWorkDirs(root);
    }
  }

  const failures = results.flatMap((result, index) =>
    result.status === 'rejected'
      ? [`${sources[index][nameKey]}: ${result.reason?.message || result.reason}`]
      : [],
  );

  if (failures.length > 0) {
    throw new Error(`Upgrade failed:\n${failures.join('\n')}`);
  }
};

/**
 * 解析 `--git` / `--fetch`、重复的选择项和分组选项。
 *
 * @param {{ groups: string[], selectFlag: string, selectShort: string }} options
 * @returns {(argv: string[]) => { help: boolean, git: boolean, groups: string[] }}
 */
export const createArgumentParser = ({ groups, selectFlag, selectShort }) => {
  const namesKey = `${selectFlag.slice(2)}s`;
  return (argv) => {
    const result = { help: false, git: true, [namesKey]: [], groups: [] };
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

      if (arg === selectFlag || arg === selectShort) {
        const value = argv[++i];
        if (!value) {
          throw new Error(`Missing value for ${selectFlag}`);
        }
        result[namesKey].push(value);
        continue;
      }

      const equalsPrefix = `${selectFlag}=`;
      if (arg.startsWith(equalsPrefix)) {
        const value = arg.slice(equalsPrefix.length);
        if (!value) {
          throw new Error(`Missing value for ${selectFlag}`);
        }
        result[namesKey].push(value);
        continue;
      }

      if (arg.startsWith('--') && groups.includes(arg.slice(2))) {
        result.groups.push(arg.slice(2));
        continue;
      }

      throw new Error(`Unknown argument: ${arg}`);
    }

    return result;
  };
};

/**
 * 按名称或分组从目录中选择条目。名称优先于分组；两者都空时返回全部。
 *
 * @param {object[]} catalog
 * @param {{ nameKey: string, namesKey: string, noun: string }} options
 */
export const createSourceSelector = (catalog, { nameKey, namesKey, noun }) =>
  (args) => {
    const names = args[namesKey];
    const { groups } = args;
    if (names.length > 0) {
      const unknown = names.filter(
        (name) => !catalog.some((source) => source[nameKey] === name),
      );

      if (unknown.length > 0) {
        throw new Error(`unknown ${noun}(s): ${[...new Set(unknown)].join(', ')}`);
      }

      return catalog.filter((source) => names.includes(source[nameKey]));
    }

    if (groups.length === 0) {
      return [...catalog];
    }

    return catalog.filter(({ groups: sourceGroups }) =>
      sourceGroups.some((group) => groups.includes(group)),
    );
  };

/** 仅用于帮助文本：把配置展示成可打开的 GitHub tree 页面。 */
export const formatTreeUrl = ({ repo, path: remotePath, ref }) =>
  `${repo}/tree/${ref}/${remotePath}`;

/**
 * 生成由集中配置派生的 CLI 帮助文本。
 *
 * @param {{
 *   scriptPath: string,
 *   selectOptionLine: string,
 *   groups: string[],
 *   groupNoun: string,
 *   catalogNoun: string,
 *   emptySelectionNoun: string,
 *   catalog: object[],
 *   nameKey: string,
 *   npmExamples: string[],
 * }} options
 * @returns {string}
 */
export const formatUpgradeHelp = ({
  scriptPath,
  selectOptionLine,
  groups,
  groupNoun,
  catalogNoun,
  emptySelectionNoun,
  catalog,
  nameKey,
  npmExamples,
}) => {
  const groupLines = groups
    .map((group) => `      --${group.padEnd(13)} Sync the ${group} ${groupNoun} group`)
    .join('\n');
  const catalogLines = catalog
    .map((source) =>
      `  ${String(source[nameKey]).padEnd(18)} [${source.groups.join(', ')}] ${formatTreeUrl(source)}`)
    .join('\n');
  return `Usage: node ${scriptPath} [options]

Options:
  ${selectOptionLine}
      --git            Download via Git sparse checkout (default)
      --fetch          Download via HTTPS archive (exclusive with --git)
${groupLines}
  -h, --help           Show this help

With no selection option, all configured ${emptySelectionNoun} are updated.

${catalogNoun}:
${catalogLines}

npm examples:
${npmExamples.map((example) => `  ${example}`).join('\n')}
`;
};

/**
 * 执行一次升级 CLI：解析参数、共享下载、并行镜像、报告和清理。
 *
 * @param {{
 *   argv?: string[],
 *   rootDir: string,
 *   projectRoot: string,
 *   formatHelp: () => string,
 *   parseArgs: (argv: string[]) => { help: boolean, git: boolean },
 *   selectSources: (args: object) => object[],
 *   nameKey: string,
 *   noun?: string,
 *   plural: string,
 *   postProcess?: (stagingDir: string, source: object) => Promise<void>,
 *   requiredFile?: string | null,
 *   doneMessage: string,
 *   createReporter: (sources: object[]) => { start: Function, detail: Function, pass: Function, fail: Function, finish: Function },
 * }} options
 * @returns {Promise<void>}
 */
export const runUpgradeCli = async ({
  argv = process.argv.slice(2),
  rootDir,
  projectRoot,
  formatHelp,
  parseArgs,
  selectSources,
  nameKey,
  noun = nameKey,
  plural,
  postProcess = async () => {},
  requiredFile = 'SKILL.md',
  doneMessage,
  createReporter,
}) => {
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
      throw new Error(`no ${plural} selected.`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}\n`);
    console.log(formatHelp());
    process.exitCode = 1;
    await cleanupUpgradeWorkDirs(rootDir);
    return;
  }

  console.log(`Project: ${projectRoot}`);
  console.log();

  let downloadSession;
  try {
    const sessionOptions = { root: rootDir, requiredFile, noun, nameKey };
    downloadSession = args.git
      ? await createGitDownloadSession(selected, sessionOptions)
      : await createHttpsDownloadSession(selected, sessionOptions);
    await syncItemsConcurrently(
      selected,
      (source, onDetail) => syncConfiguredItem(source, onDetail, {
        rootDir,
        nameKey,
        noun: titleNoun(noun),
        download: (stagingDir) => downloadSession.download(source, stagingDir),
        postProcess,
      }),
      createReporter(selected),
      { root: rootDir, nameKey },
    );

    console.log();
    console.log(doneMessage);
  } finally {
    try {
      await downloadSession?.cleanup();
    } finally {
      await cleanupUpgradeWorkDirs(rootDir);
    }
  }
};
