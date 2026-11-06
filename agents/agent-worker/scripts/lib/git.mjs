import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { requireValue } from './validation.mjs';

export function git(cwd, args) {
  const result = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Git ${args[0]} failed: ${result.stderr.trim()}`);
  return args.includes('-z') ? result.stdout : result.stdout.replace(/\r?\n$/, '');
}

export const head = cwd => git(cwd, ['rev-parse', 'HEAD']);
export const tree = (cwd, commit) => git(cwd, ['rev-parse', `${commit}^{tree}`]);
export const clean = cwd => git(cwd, ['status', '--porcelain=v1', '--untracked-files=all']) === '';
export function ancestor(cwd, old, next) {
  const result = spawnSync('git', ['-C', cwd, 'merge-base', '--is-ancestor', old, next], { windowsHide: true });
  requireValue(result.status === 0 || result.status === 1, 'Cannot verify commit ancestry');
  return result.status === 0;
}
export function oid(cwd, value) {
  requireValue(typeof value === 'string' && /^[a-f0-9]{40,64}$/.test(value), 'Full commit object id required');
  requireValue(git(cwd, ['cat-file', '-t', value]) === 'commit', 'Commit required');
  return value;
}
export function idle(cwd) {
  for (const marker of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply']) {
    const result = git(cwd, ['rev-parse', '--path-format=absolute', '--git-path', marker]);
    if (fs.existsSync(result)) throw new Error('Git operation in progress');
  }
}

/** Hold native ref locks while the caller synchronizes the index/worktree. */
export function referenceTransaction(cwd) {
  const child = spawn('git', ['-C', cwd, 'update-ref', '--stdin'], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  let output = '', errors = '', ended = false;
  const closed = new Promise(resolve => child.once('close', resolve));
  const waiters = [];
  function settle() {
    for (const waiter of [...waiters]) {
      if (output.includes(waiter.expected)) { waiters.splice(waiters.indexOf(waiter), 1); clearTimeout(waiter.timer); waiter.resolve(); }
      else if (ended) { waiters.splice(waiters.indexOf(waiter), 1); clearTimeout(waiter.timer); waiter.reject(new Error(`Reference transaction failed: ${errors}`)); }
    }
  }
  child.stdout.on('data', data => { output += data.toString(); settle(); });
  child.stderr.on('data', data => { errors += data.toString(); });
  child.on('error', error => { errors += error.message; ended = true; settle(); });
  child.on('close', () => { ended = true; settle(); });
  child.stdin.on('error', () => {});
  const send = (command, expected) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(new Error('Reference transaction timed out; recovery required')); }, 10000);
    waiters.push({ expected, resolve, reject, timer });
    child.stdin.write(command + '\n'); settle();
  });
  return {
    prepare: (branch, base, result) => send(`start\nupdate ${branch} ${result} ${base}\nprepare`, 'prepare: ok'),
    commit: async () => { await send('commit', 'commit: ok'); child.stdin.end(); await closed; },
    abort: async () => { if (!ended) { try { await send('abort', 'abort: ok'); } finally { child.stdin.end(); await closed; } } },
  };
}
