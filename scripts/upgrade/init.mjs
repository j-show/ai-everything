/**
 * 按 `scripts/init.json` 依次安装 skill。
 * 每条记录是 `{ skill, repo, name, groups }`。`repo` 与 `name` 可省略。
 * 有 `repo` 时执行 `npx skills add <repo> --skill <skill> --agent universal --yes`。
 * 无 `repo` 且有 `name` 时执行 `npx skills add <name> --agent universal --yes`。
 * 两者都没有则跳过该条。`--agent universal` 只写入当前项目的 `.agents/skills/`，
 * 不选择其他 Agent，也不加 `-g`。`--yes` 跳过 skills CLI 的确认。
 *
 * @module scripts/upgrade/init
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import installSources from '../init.json' with { type: 'json' };
import { createArgumentParser, createSourceSelector } from './download.mjs';

const SKILL_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const GROUP_NAME = /^[a-z][a-z0-9-]{0,63}$/;
const REPO = /^(?:https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)$/;
const NAME = /^(?:https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|[A-Za-z0-9][A-Za-z0-9._-]{0,127})$/;
const ENTRY_FIELDS = new Set(['skill', 'repo', 'name', 'groups']);
/** skills CLI 的通用目标。只写入当前项目 `.agents/skills/`，不安装到其他 Agent。 */
const PROJECT_AGENT = 'universal';

/**
 * 一条可安装的 skill。字段来自 `scripts/init.json`。
 * `repo` 与 `name` 为空字符串表示未提供。
 *
 * @typedef {Object} InstallEntry
 * @property {string} skill 条目名；有 `repo` 时也是 `--skill` 的名称
 * @property {string} repo 仓库位置；空字符串表示未提供
 * @property {string} name `npx skills add` 的来源；空字符串表示未提供
 * @property {string[]} groups CLI 分组；`darwin` 对应 `--darwin`
 */

/** @type {InstallEntry[]} */
export const INSTALL_SOURCES = installSources;

const modulePath = fileURLToPath(import.meta.url);

/**
 * @param {string} message
 * @returns {never}
 */
const fail = (message) => {
  throw new Error(message);
};

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {string}
 */
const requireSkillName = (value, label) => {
  if (typeof value !== 'string' || !SKILL_NAME.test(value)) {
    fail(`${label}.skill must be a skill name`);
  }
  return value;
};

/**
 * 缺省、`null` 和空字符串都表示未提供。其他非法值立即失败。
 *
 * @param {unknown} value
 * @param {string} label
 * @param {'repo' | 'name'} field
 * @param {RegExp} pattern
 * @returns {string}
 */
const optionalSource = (value, label, field, pattern) => {
  if (value === undefined || value === null || value === '') return '';
  const expected = field === 'repo' ? 'a GitHub repository' : 'a skill source';
  if (typeof value !== 'string' || !pattern.test(value)) {
    fail(`${label}.${field} must be ${expected}`);
  }
  return value;
};

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {string[]}
 */
const requireGroups = (value, label) => {
  if (!Array.isArray(value) || value.length === 0
    || value.some((group) => typeof group !== 'string' || !GROUP_NAME.test(group))) {
    fail(`${label}.groups must be a non-empty list of group names`);
  }
  return [...value];
};

/**
 * 校验外部清单并返回新副本。不修改入参。
 *
 * @param {unknown} value
 * @returns {InstallEntry[]}
 */
export const parseCatalog = (value) => {
  if (!Array.isArray(value)) fail('catalog must be an array');

  const entries = value.map((item, index) => {
    const label = `skills[${index}]`;
    if (!isRecord(item)) fail(`${label} must be an object`);
    for (const key of Object.keys(item)) {
      if (!ENTRY_FIELDS.has(key)) fail(`${label} unexpected field: ${key}`);
    }
    return {
      skill: requireSkillName(item.skill, label),
      repo: optionalSource(item.repo, label, 'repo', REPO),
      name: optionalSource(item.name, label, 'name', NAME),
      groups: requireGroups(item.groups, label),
    };
  });

  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.skill)) fail(`duplicate skill: ${entry.skill}`);
    seen.add(entry.skill);
  }
  return entries;
};

/**
 * @param {string[]} args
 * @returns {string[]}
 */
const withProjectScope = (args) => [...args, '--agent', PROJECT_AGENT, '--yes'];

/**
 * 有 `repo` 时忽略 `name`。两者都没有时返回 `null`，表示跳过。
 *
 * @param {InstallEntry} entry
 * @returns {string[] | null}
 */
const commandParts = (entry) => {
  if (typeof entry.repo === 'string' && REPO.test(entry.repo)) {
    return withProjectScope(['skills', 'add', entry.repo, '--skill', entry.skill]);
  }
  if (typeof entry.name === 'string' && NAME.test(entry.name)) {
    return withProjectScope(['skills', 'add', entry.name]);
  }
  return null;
};

/**
 * @param {InstallEntry} entry
 * @returns {string | null}
 */
export const formatCommand = (entry) => {
  const parts = commandParts(entry);
  if (!parts) return null;
  return `npx ${parts.join(' ')}`;
};

/**
 * @param {InstallEntry} entry
 * @returns {string[]}
 */
export const installArgs = (entry) => {
  const parts = commandParts(entry);
  if (!parts) fail(`no install command: ${entry.skill}`);
  return parts;
};

/**
 * @param {InstallEntry[]} entries
 * @returns {readonly string[]}
 */
const groupsOf = (entries) => Object.freeze([
  ...new Set(entries.flatMap((entry) => entry.groups)),
]);

/**
 * 复用升级器的参数解析。分组来自本次清单。
 * 共用解析器也接受 `--git` / `--fetch`，本命令不使用这两个传输标志。
 *
 * @param {string[]} argv
 * @param {readonly string[]} groups
 * @returns {{ help: boolean, git: boolean, skills: string[], groups: string[] }}
 */
export const parseArgs = (argv, groups) => createArgumentParser({
  groups: [...groups],
  selectFlag: '--skill',
  selectShort: '-s',
})(argv);

/**
 * 名称优先于分组；两者都空时返回全部。返回新数组，不修改目录。
 *
 * @param {InstallEntry[]} catalog
 * @param {{ skills: string[], groups: string[] }} args
 * @returns {InstallEntry[]}
 */
export const selectEntries = (catalog, args) => createSourceSelector(catalog, {
  nameKey: 'skill',
  namesKey: 'skills',
  noun: 'skill',
})(args);

/**
 * @param {InstallEntry[]} entries
 * @returns {string}
 */
export const formatHelp = (entries) => {
  const groupLines = groupsOf(entries)
    .map((group) => `      --${group.padEnd(13)} Install the ${group} group`)
    .join('\n');
  const catalogLines = entries
    .map((entry) => {
      const command = formatCommand(entry) ?? 'skip';
      return `  ${entry.skill.padEnd(18)} [${entry.groups.join(', ')}] ${command}`;
    })
    .join('\n');
  const options = [
    '  -s, --skill <name>   Install a named skill (repeatable; overrides groups)',
    groupLines,
    '  -h, --help           Show this help',
  ].filter(Boolean).join('\n');

  return `Usage: node scripts/upgrade/init.mjs [options]

Options:
${options}

With no selection option, every configured skill is installed into the
current project's .agents/skills/ directory. Other agents and -g are not used:
  npx skills add <repo> --skill <skill> --agent universal --yes
  npx skills add <name> --agent universal --yes
Entries with neither repo nor name are skipped.

Skills:
${catalogLines}
`;
};

/**
 * Windows 不能直接 spawn `npx.cmd`（EINVAL）。经 `cmd.exe /d /s /c` 执行整条命令，
 * 且不把参数数组交给 `shell: true`，避免 Node 的未转义拼接告警。
 * 命令文本只来自已通过 `parseCatalog` 的 `repo`、`name` 与 `skill`。
 *
 * @param {InstallEntry} entry
 * @returns {{ command: string, args: string[] }}
 */
export const spawnPlan = (entry) => {
  const [checked] = parseCatalog([entry]);
  const command = formatCommand(checked);
  if (!command) fail(`no install command: ${checked.skill}`);
  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', command],
    };
  }
  return { command: 'npx', args: installArgs(checked) };
};

/**
 * @param {typeof spawn} [spawnImpl]
 * @returns {(entry: InstallEntry) => Promise<void>}
 */
export const createNpxRunner = (spawnImpl = spawn) => (entry) => new Promise((resolve, reject) => {
  let plan;
  try {
    plan = spawnPlan(entry);
  } catch (error) {
    reject(error instanceof Error ? error : new Error(String(error)));
    return;
  }

  let child;
  try {
    child = spawnImpl(plan.command, plan.args, {
      stdio: 'inherit',
      shell: false,
      windowsHide: true,
    });
  } catch (error) {
    reject(error instanceof Error ? error : new Error(String(error)));
    return;
  }

  let settled = false;
  const finish = (handler, value) => {
    if (settled) return;
    settled = true;
    handler(value);
  };

  child.on('error', (error) => {
    finish(reject, error instanceof Error ? error : new Error(String(error)));
  });
  child.on('close', (code, signal) => {
    if (code === 0) {
      finish(resolve, undefined);
      return;
    }
    const reason = signal ? `signal ${signal}` : `exit ${code}`;
    finish(reject, new Error(`${formatCommand(entry)} ${reason}`));
  });
});

/**
 * @param {string[]} [argv]
 * @param {{
 *   catalog?: unknown,
 *   run?: (entry: InstallEntry) => Promise<void>,
 *   log?: (line: string) => void,
 * }} [options]
 * @returns {Promise<void>}
 */
export const runCli = async (
  argv = process.argv.slice(2),
  {
    catalog = INSTALL_SOURCES,
    run = createNpxRunner(),
    log = console.log,
  } = {},
) => {
  const entries = parseCatalog(catalog);
  const args = parseArgs(argv, groupsOf(entries));
  if (args.help) {
    log(formatHelp(entries));
    return;
  }

  const selected = selectEntries(entries, args);
  if (selected.length === 0) fail('no skills selected');

  for (const entry of selected) {
    const command = formatCommand(entry);
    if (!command) {
      log(`skip ${entry.skill}`);
      continue;
    }
    log(command);
    await run(entry);
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  runCli().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
