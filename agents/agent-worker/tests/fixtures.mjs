import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { execute } from '../scripts/runtime.mjs';
export const git = (repo, ...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
export function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-dispatch-'));
  const repo = path.join(root, 'repo'); fs.mkdirSync(repo);
  git(repo, 'init', '-b', 'main'); git(repo, 'config', 'user.name', 'Test'); git(repo, 'config', 'user.email', 'test@example.invalid');
  git(repo, 'config', 'core.autocrlf', 'false');
  fs.writeFileSync(path.join(repo, 'seed'), 'confirmed source'); git(repo, 'add', '.'); git(repo, 'commit', '-m', 'baseline');
  t.after(() => fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }));
  return repo;
}
export const task = id => ({ id, kind: 'feature', goal: id, nonGoals: [], constraints: [], verification: [['node', '--test']], behaviors: ['B1'], acceptance: ['passes'], approach: 'minimal change', files: [`${id}.txt`], dependencies: [], interfaces: { provides: [], consumes: [] } });
export const init = (repo, input = {}) => execute(repo, 'init', { source: path.join(repo, 'seed'), tasks: [task('a')], confirmation: 'approved brief', ...input });
export const identity = t => ({ attempt: t.attempt, reservationId: t.reservationId, briefHash: t.briefHash, agentId: t.agent?.id, agentVersion: t.agent?.executionVersion });
let observationSequence = 0;
export const observation = (t, state) => ({ ...identity(t), agentVersion: t.agent?.revision, observationId: `obs${++observationSequence}`, state,
  observedAt: new Date(1800000000000 + observationSequence).toISOString(), source: 'host', evidence: 'simulated host state observation' });
export async function start(repo, runId, taskId = 'a', agentId = 'worker') {
  const reservation = await execute(repo, 'reserve-task', { runId, taskId });
  const bound = await execute(repo, 'bind-agent', { runId, taskId, ...identity(reservation), agentId });
  return execute(repo, 'start-task', { runId, taskId, ...identity(bound) });
}
