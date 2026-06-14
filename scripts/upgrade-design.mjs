/**
 * 从上游 GitHub 仓库同步设计类 skills 到本仓库 `skills/` 目录。
 *
 * 用法：
 * ```bash
 * node scripts/upgrade-design.mjs
 * node scripts/upgrade-design.mjs --skill frontend-design
 * npm run upgrade:design
 * ```
 *
 * @module scripts/upgrade-design
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/** 当前模块所在目录（`scripts/`），用于定位仓库根目录。 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 仓库根目录。 */
const projectRoot = path.resolve(__dirname, '..');

/** 本仓库 skills 根目录。 */
const skillsRoot = path.join(projectRoot, 'skills');

/** GitHub API 请求头（匿名访问需 User-Agent）。 */
const GITHUB_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'ai-everything-upgrade-design',
};

/**
 * 上游 skill 源配置。
 * @type {ReadonlyArray<{
 *   skill: string,
 *   owner: string,
 *   repo: string,
 *   remotePath: string,
 *   ref: string,
 *   url: string,
 * }>}
 */
const SKILL_SOURCES = [
  {
    skill: 'frontend-design',
    owner: 'anthropics',
    repo: 'skills',
    remotePath: 'skills/frontend-design',
    ref: 'main',
    url: 'https://github.com/anthropics/skills/tree/main/skills/frontend-design',
  },
  {
    skill: 'ui-ux-pro-max',
    owner: 'nextlevelbuilder',
    repo: 'ui-ux-pro-max-skill',
    remotePath: '.claude/skills/ui-ux-pro-max',
    ref: 'main',
    url: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/main/.claude/skills/ui-ux-pro-max',
  },
];

/** `--skill` 允许的取值。 */
const VALID_SKILLS = SKILL_SOURCES.map((s) => s.skill);

/**
 * 解析 CLI 参数。
 *
 * @param {string[]} argv
 * @returns {{ help: boolean, skills: string[] }}
 */
const parseArgs = (argv) => {
  const result = { help: false, skills: [] };

  for (let i = 2; i < argv.length; i++) {
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
      result.skills.push(arg.slice('--skill='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return result;
};

/** 向 stdout 打印用法说明。 */
const printHelp = () => {
  console.log(`Usage: node scripts/upgrade-design.mjs [--skill <name>]...

Options:
  -s, --skill <name>   Sync only one skill (repeatable)
  -h, --help           Show this help

Skills:
${SKILL_SOURCES.map((s) => `  ${s.skill.padEnd(18)} ${s.url}`).join('\n')}

npm example:
  npm run upgrade:design
  npm run upgrade:design -- --skill frontend-design
`);
};

/**
 * 发起 GitHub API 请求并解析 JSON。
 *
 * @param {string} url
 * @returns {Promise<unknown>}
 */
const fetchJson = async (url) => {
  const res = await fetch(url, { headers: GITHUB_HEADERS });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status} ${url}\n${body.slice(0, 400)}`);
  }
  return res.json();
};

/**
 * 下载二进制内容。
 *
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
const fetchBuffer = async (url) => {
  const res = await fetch(url, {
    headers: { 'User-Agent': GITHUB_HEADERS['User-Agent'] },
  });
  if (!res.ok) {
    throw new Error(`Download failed ${res.status} ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
};

/**
 * 解析 GitHub 仓库内相对路径（始终使用 POSIX 分隔符）。
 *
 * @param {string} basePath
 * @param {string} relativeTarget
 * @returns {string}
 */
const resolveRemotePath = (basePath, relativeTarget) =>
  path.posix.normalize(path.posix.join(path.posix.dirname(basePath), relativeTarget));

/**
 * 递归拉取远程目录内容到本地目录。
 *
 * @param {{
 *   owner: string,
 *   repo: string,
 *   remotePath: string,
 *   localDir: string,
 *   ref: string,
 * }} options
 * @returns {Promise<number>} 写入的文件数量
 */
const downloadRemoteTree = async ({ owner, repo, remotePath, localDir, ref }) => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${remotePath}?ref=${ref}`;
  const payload = await fetchJson(apiUrl);
  const entries = Array.isArray(payload) ? payload : [payload];

  let fileCount = 0;

  for (const entry of entries) {
    const dest = path.join(localDir, entry.name);

    if (entry.type === 'file') {
      if (!entry.download_url) {
        throw new Error(`Missing download_url for ${entry.path}`);
      }
      const data = await fetchBuffer(entry.download_url);
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      await fs.promises.writeFile(dest, data);
      fileCount += 1;
      console.log(`  wrote ${path.relative(projectRoot, dest)}`);
      continue;
    }

    if (entry.type === 'dir') {
      await fs.promises.mkdir(dest, { recursive: true });
      fileCount += await downloadRemoteTree({
        owner,
        repo,
        remotePath: entry.path,
        localDir: dest,
        ref,
      });
      continue;
    }

    if (entry.type === 'symlink') {
      const blob = await fetchJson(
        `https://api.github.com/repos/${owner}/${repo}/git/blobs/${entry.sha}`,
      );
      if (typeof blob.content !== 'string') {
        throw new Error(`Unexpected symlink blob for ${entry.path}`);
      }
      const target = Buffer.from(blob.content, 'base64').toString('utf8').trim();
      const resolvedRemotePath = resolveRemotePath(entry.path, target);

      await fs.promises.mkdir(dest, { recursive: true });
      console.log(`  symlink ${entry.name} -> ${target}`);
      fileCount += await downloadRemoteTree({
        owner,
        repo,
        remotePath: resolvedRemotePath,
        localDir: dest,
        ref,
      });
      continue;
    }

    throw new Error(`Unsupported entry type "${entry.type}" at ${entry.path}`);
  }

  return fileCount;
};

/**
 * 清空并重建本地 skill 目录，然后从上游同步。
 *
 * @param {typeof SKILL_SOURCES[number]} source
 * @returns {Promise<void>}
 */
const syncSkill = async (source) => {
  const localDir = path.join(skillsRoot, source.skill);

  console.log(`Sync ${source.skill}`);
  console.log(`  from ${source.url}`);

  await fs.promises.rm(localDir, { recursive: true, force: true });
  await fs.promises.mkdir(localDir, { recursive: true });

  const fileCount = await downloadRemoteTree({
    owner: source.owner,
    repo: source.repo,
    remotePath: source.remotePath,
    localDir,
    ref: source.ref,
  });

  console.log(`  done (${fileCount} file${fileCount === 1 ? '' : 's'})`);
  console.log();
};

const main = async () => {
  let args;
  try {
    args = parseArgs(process.argv);
  } catch (err) {
    console.error(`Error: ${err.message}\n`);
    printHelp();
    process.exit(1);
  }

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const selected =
    args.skills.length > 0
      ? SKILL_SOURCES.filter((s) => args.skills.includes(s.skill))
      : [...SKILL_SOURCES];

  const unknown = args.skills.filter((name) => !VALID_SKILLS.includes(name));
  if (unknown.length > 0) {
    console.error(`Error: unknown skill(s): ${unknown.join(', ')}`);
    console.error(`Expected: ${VALID_SKILLS.join(', ')}`);
    process.exit(1);
  }

  if (selected.length === 0) {
    console.error('Error: no skills selected.\n');
    printHelp();
    process.exit(1);
  }

  console.log(`Project: ${projectRoot}`);
  console.log();

  for (const source of selected) {
    await syncSkill(source);
  }

  console.log('Upgrade design skills done');
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
