/**
 * 部署脚本：将仓库根目录的 `commands`、`rules`、`skills` 通过符号链接映射到目标 harness 目录。
 *
 * - **user 模式**（默认）：链接到用户主目录下的 `.cursor` / `.codex` / `.claude`。
 * - **local 模式**：链接到当前工作目录下同名文件夹，便于在单仓库内调试。
 *
 * 用法：
 * ```bash
 * node scripts/deploy.mjs --type cursor [--mode user]
 * npm run deploy -- --type cursor
 * npm run deploy:cursor
 * ```
 *
 * @module scripts/deploy
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

/** 当前模块所在目录（`scripts/`），用于定位仓库根目录。 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 仓库根目录（`scripts/` 的上一级）。所有源资源路径均相对此目录。 */
const projectRoot = path.resolve(__dirname, '..');

/**
 * harness 类型与目标配置目录名的映射。
 * @type {Record<'cursor' | 'codex' | 'claude', string>}
 */
const TYPE_DIRS = {
  cursor: '.cursor',
  codex: '.codex',
  claude: '.claude',
};

/** `--type` 允许的取值，与 `TYPE_DIRS` 的键一致。 */
const VALID_TYPES = Object.keys(TYPE_DIRS);

/** `--mode` 允许的取值：`user` 写主目录，`local` 写当前工作目录。 */
const VALID_MODES = ['user', 'local'];

/**
 * 需要从仓库根同步到目标 harness 的资源目录名。
 * 若某目录在仓库中不存在则跳过。
 */
const RESOURCE_DIRS = ['commands', 'rules', 'skills'];

/**
 * 从参数列表中解析 `--type`、`--mode` 与 `--help`。
 *
 * @param {string[]} list 待扫描的参数数组（通常为 `process.argv` 或 npm `cooked` 片段）
 * @param {number} [start=0] 从 `list` 的该下标开始扫描（用于跳过 `node`、`deploy` 等前缀）
 * @returns {{ type: string | null, mode: string | null, help: boolean }}
 */
const parseArgsFromList = (list, start = 0) => {
  const result = { type: null, mode: null, help: false };

  for (let i = start; i < list.length; i++) {
    const arg = list[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }

    if (arg === '--type' || arg === '-t') {
      result.type = list[++i];
      continue;
    }

    if (arg === '--mode' || arg === '-m') {
      result.mode = list[++i];
      continue;
    }

    if (arg.startsWith('--type=')) {
      result.type = arg.slice('--type='.length);
      continue;
    }

    if (arg.startsWith('--mode=')) {
      result.mode = arg.slice('--mode='.length);
      continue;
    }
  }

  return result;
};

/**
 * npm 将布尔开关写入环境变量时为 `"true"` / `"false"`，不能当作 type 或 mode 的实际值。
 *
 * @param {string} value 环境变量或 argv 中的候选字符串
 * @returns {boolean}
 */
const isNpmBooleanFlag = (value) => value === 'true' || value === 'false';

/**
 * 从 `npm_config_*` 与 `npm_config_argv` 补全被 npm 吞掉或改写的 CLI 参数。
 *
 * 典型情况：`npm run deploy --type cursor` 可能只把 `cursor` 传给脚本，或把 `npm_config_type` 设为 `true`。
 *
 * @returns {{ type: string | null, mode: string | null, help: boolean }}
 */
const parseNpmForwardedArgs = () => {
  const result = { type: null, mode: null, help: false };

  const fromEnv = (key) => {
    const value = process.env[key];
    if (!value || isNpmBooleanFlag(value)) {
      return null;
    }
    return value;
  };

  // npm run deploy --type cursor → npm_config_type=true（需忽略）
  // npm run deploy --type=cursor → npm_config_type=cursor（可用）
  result.type = fromEnv('npm_config_type') || fromEnv('npm_config_t');
  result.mode = fromEnv('npm_config_mode') || fromEnv('npm_config_m');

  try {
    const cooked = JSON.parse(process.env.npm_config_argv || '{}').cooked || [];
    const deployIdx = cooked.findIndex((a) => a === 'deploy');
    if (deployIdx >= 0) {
      const npmArgs = parseArgsFromList(cooked, deployIdx + 1);
      if (npmArgs.type && !isNpmBooleanFlag(npmArgs.type)) {
        result.type = result.type || npmArgs.type;
      }
      result.mode = result.mode || npmArgs.mode;
      result.help = result.help || npmArgs.help;
    }

    const typeEq = cooked.find((a) => typeof a === 'string' && a.startsWith('--type='));
    if (typeEq) {
      result.type = result.type || typeEq.slice('--type='.length);
    }
  } catch {
    // 畸形 npm_config_argv 时忽略，仅依赖 process.argv
  }

  return result;
};

/**
 * 合并 `process.argv` 与 npm 转发的参数，校验未知选项，并推断缺失的 type/mode。
 *
 * @param {string[]} argv 通常为 `process.argv`
 * @returns {{ type: string | null, mode: string, help: boolean }}
 * @remarks 存在未知 `-` 开头参数时向 stderr 提示并 `process.exit(1)`；无 flag 的首个 positional 当作 type，第二个合法 mode 名当作 mode（兼容 npm 只转发值）
 */
const parseArgs = (argv) => {
  const cli = parseArgsFromList(argv, 2);
  const npm = parseNpmForwardedArgs();

  const result = {
    type: cli.type || npm.type,
    mode: cli.mode || npm.mode || 'user',
    help: cli.help || npm.help,
  };

  const unknown = [];
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (
      arg === '--help' ||
      arg === '-h' ||
      arg === '--type' ||
      arg === '-t' ||
      arg === '--mode' ||
      arg === '-m' ||
      arg.startsWith('--type=') ||
      arg.startsWith('--mode=')
    ) {
      if (arg === '--type' || arg === '-t' || arg === '--mode' || arg === '-m') {
        i++;
      }
      continue;
    }
    if (arg.startsWith('-')) {
      unknown.push(arg);
      continue;
    }
    // npm run deploy --type cursor 时，npm 常只把值传给脚本
    if (!result.type) {
      result.type = arg;
      continue;
    }
    if (!result.mode && VALID_MODES.includes(arg)) {
      result.mode = arg;
      continue;
    }
    if (arg === result.type || arg === result.mode) {
      continue;
    }
    unknown.push(arg);
  }

  if (unknown.length > 0) {
    console.error(`Unknown argument: ${unknown.join(', ')}`);
    console.error('Hint: npm run deploy -- --type cursor   (note the -- before flags)');
    process.exit(1);
  }

  return result;
};

/** 向 stdout 打印用法说明。 */
const printHelp = () => {
  console.log(`Usage: node scripts/deploy.mjs --type <cursor|codex|claude> [--mode <user|local>]

Options:
  -t, --type <cursor|codex|claude>  Harness type (required)
  -m, --mode <user|local>           Install target: user home or cwd (default: user)
  -h, --help                        Show this help

npm examples:
  npm run deploy -- --type cursor
  npm run deploy --type=cursor
  npm run deploy --type cursor
`);
};

/**
 * 根据 harness 类型与安装模式解析目标根目录。
 *
 * @param {{ type: string, mode: string }} args 已校验的 `type` 与 `mode`
 * @returns {string} 绝对路径，例如 `~/.cursor` 或 `<cwd>/.cursor`
 */
const resolveTargetBase = (args) => {
  const dirName = TYPE_DIRS[args.type];
  if (args.mode === 'user') {
    return path.join(os.homedir(), dirName);
  }
  return path.join(process.cwd(), dirName);
};

/**
 * 路径是否存在（含符号链接）；`lstat` 失败视为不存在。
 *
 * @param {string} p 文件或目录路径
 * @returns {boolean}
 */
const pathExists = (p) => {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
};

/**
 * 读取符号链接目标并解析为绝对路径。
 *
 * @param {string} linkPath 符号链接路径
 * @returns {string | null} 解析后的绝对路径；非链接或读失败时返回 `null`
 */
const readLinkTarget = (linkPath) => {
  try {
    const raw = fs.readlinkSync(linkPath);
    return path.resolve(path.dirname(linkPath), raw);
  } catch {
    return null;
  }
};

/**
 * 规范化路径用于比较；优先 `realpathSync.native`，失败时回退 `path.resolve`。
 *
 * @param {string} p 任意路径
 * @returns {string}
 */
const normalizePath = (p) => {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return path.resolve(p);
  }
};

/** 当前进程是否在 Windows 上运行（影响路径比较与链接类型）。 */
const isWindows = process.platform === 'win32';

/**
 * 判断两路径是否指向同一位置；Windows 上额外做大小写不敏感比较。
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
const isSamePath = (a, b) => {
  const na = normalizePath(a);
  const nb = normalizePath(b);
  if (na === nb) {
    return true;
  }
  return isWindows && na.toLowerCase() === nb.toLowerCase();
};

/**
 * 通过 `dev` + `ino` 判断两路径是否为同一文件的硬链接或同一 inode。
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
const isSameFile = (a, b) => {
  try {
    const sa = fs.statSync(a);
    const sb = fs.statSync(b);
    return sa.dev === sb.dev && sa.ino === sb.ino;
  } catch {
    return false;
  }
};

/**
 * 路径是否为符号链接（reparse point）。
 *
 * @param {string} dest
 * @returns {boolean}
 */
const isReparseLink = (dest) => {
  try {
    return fs.lstatSync(dest).isSymbolicLink();
  } catch {
    return false;
  }
};

/**
 * 判断 `dest` 是否已指向 `source`（符号链接、junction 或同 inode 硬链接）。
 *
 * @param {string} dest 目标路径
 * @param {string} source 仓库内源路径
 * @returns {boolean}
 */
const isLinkedTo = (dest, source) => {
  if (!pathExists(dest)) {
    return false;
  }

  const absSource = path.resolve(source);
  const absDest = path.resolve(dest);

  if (isReparseLink(absDest)) {
    const target = readLinkTarget(absDest);
    return target !== null && isSamePath(target, absSource);
  }

  try {
    const destStat = fs.statSync(absDest);
    const srcStat = fs.statSync(absSource);

    if (destStat.isFile() && srcStat.isFile()) {
      return isSameFile(absSource, absDest);
    }

    if (destStat.isDirectory() && srcStat.isDirectory()) {
      return isSamePath(absDest, absSource);
    }
  } catch {
    return false;
  }

  return false;
};

/**
 * 创建指向 `source` 的符号链接（Windows 目录用 junction）；已等价链接则跳过。
 *
 * @param {string} source 源绝对或相对路径（内部会 `path.resolve`）
 * @param {string} dest 链接路径
 * @param {'file' | 'dir'} linkType Node `fs.symlink` 类型；Windows 下 `dir` 映射为 `junction`
 * @returns {void}
 * @throws {Error} 创建失败且无法回退硬链接时抛出（Windows 文件在 `EPERM` 时会尝试 `linkSync`）
 */
const createSymlink = (source, dest, linkType) => {
  const absSource = path.resolve(source);
  const absDest = path.resolve(dest);

  if (isLinkedTo(absDest, absSource)) {
    console.log(`Skip (already linked): ${absDest}`);
    return;
  }

  if (pathExists(absDest)) {
    if (isReparseLink(absDest)) {
      console.log(`Skip (link exists): ${absDest}`);
      return;
    }
    console.warn(`Skip (exists, not a link): ${absDest}`);
    return;
  }

  fs.mkdirSync(path.dirname(absDest), { recursive: true });

  /** @type {import('fs').symlink.Type | undefined} */
  let fsLinkType = linkType;
  if (isWindows && linkType === 'dir') {
    // Windows 目录联接（junction）通常无需管理员/Developer Mode
    fsLinkType = 'junction';
  }

  const cwd = process.cwd();

  try {
    fs.symlinkSync(absSource, absDest, fsLinkType);
    console.log(`Linked: ${absDest} -> ${path.relative(cwd, absSource)}`);
    return;
  } catch (err) {
    const code = /** @type {NodeJS.ErrnoException} */ (err).code;
    if (isWindows && linkType === 'file' && code === 'EPERM') {
      fs.linkSync(absSource, absDest);
      console.log(`Hard-linked: ${absDest} -> ${path.relative(cwd, absSource)}`);
      return;
    }
    throw err;
  }
};

/**
 * 部署 `commands` / `rules`：目标无目录时链接整个源目录；目标已存在则逐文件链接。
 *
 * @param {string} name 资源名（用于日志），如 `commands`
 * @param {string} srcDir 仓库内源目录绝对路径
 * @param {string} destDir harness 目标目录绝对路径
 * @returns {void}
 */
const mapFileResources = (name, srcDir, destDir) => {
  if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
    return;
  }

  if (isLinkedTo(destDir, srcDir)) {
    console.log(`Skip (already linked): ${destDir}`);
    return;
  }

  if (!pathExists(destDir)) {
    createSymlink(srcDir, destDir, 'dir');
    return;
  }

  if (!fs.statSync(destDir).isDirectory()) {
    console.warn(`Skip ${name}: ${destDir} exists but is not a directory`);
    return;
  }

  for (const entry of fs.readdirSync(srcDir)) {
    const src = path.join(srcDir, entry);
    if (!fs.statSync(src).isFile()) {
      continue;
    }
    createSymlink(src, path.join(destDir, entry), 'file');
  }
};

/**
 * 部署 `skills`：目标无目录时链接整个源目录；目标已存在则逐子目录链接（每个 skill 一个目录）。
 *
 * @param {string} srcDir 仓库内 `skills/` 绝对路径
 * @param {string} destDir harness 内 `skills/` 绝对路径
 * @returns {void}
 */
const mapSkillResources = (srcDir, destDir) => {
  if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
    return;
  }

  if (isLinkedTo(destDir, srcDir)) {
    console.log(`Skip (already linked): ${destDir}`);
    return;
  }

  if (!pathExists(destDir)) {
    createSymlink(srcDir, destDir, 'dir');
    return;
  }

  if (!fs.statSync(destDir).isDirectory()) {
    console.warn(`Skip skills: ${destDir} exists but is not a directory`);
    return;
  }

  for (const entry of fs.readdirSync(srcDir)) {
    const src = path.join(srcDir, entry);
    if (!fs.statSync(src).isDirectory()) {
      continue;
    }
    createSymlink(src, path.join(destDir, entry), 'dir');
  }
};

const args = parseArgs(process.argv);

if (args.help) {
  printHelp();
  process.exit(0);
}

if (!args.type) {
  console.error('Error: --type (-t) is required.\n');
  printHelp();
  process.exit(1);
}

if (!VALID_TYPES.includes(args.type)) {
  const hint = args.type === 'curosr' ? ' (did you mean "cursor"?)' : '';
  console.error(`Error: invalid type "${args.type}". Expected: ${VALID_TYPES.join(', ')}${hint}`);
  process.exit(1);
}

if (!VALID_MODES.includes(args.mode)) {
  console.error(`Error: invalid mode "${args.mode}". Expected: ${VALID_MODES.join(', ')}`);
  process.exit(1);
}

const targetBase = resolveTargetBase(args);
fs.mkdirSync(targetBase, { recursive: true });

console.log(`Project: ${projectRoot}`);
console.log(`Target:  ${targetBase}`);
console.log();

for (const name of RESOURCE_DIRS) {
  const srcDir = path.join(projectRoot, name);
  const destDir = path.join(targetBase, name);

  if (!fs.existsSync(srcDir)) {
    continue;
  }

  if (name === 'skills') {
    mapSkillResources(srcDir, destDir);
  } else {
    mapFileResources(name, srcDir, destDir);
  }
}

console.log();
console.log('Deploy done');
