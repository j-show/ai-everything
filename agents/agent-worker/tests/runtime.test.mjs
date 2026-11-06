import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { start as startWorker, identity, observation } from './fixtures.mjs';

const api = await import('../scripts/runtime.mjs').catch(() => ({}));
const git = (repo, ...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orchestrator space-'));
  const repo = path.join(root, 'repo');
  fs.mkdirSync(repo);
  git(repo, 'init', '-b', 'main');
  git(repo, 'config', 'user.email', 'test@example.invalid');
  git(repo, 'config', 'user.name', 'Test');
  git(repo, 'config', 'core.autocrlf', 'false');
  fs.writeFileSync(path.join(repo, 'seed'), 'seed');
  git(repo, 'add', '.'); git(repo, 'commit', '-m', 'baseline');
  t.after(() => { fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); });
  return { root, repo };
}
const task = id => ({ id, kind: 'feature', goal: id, nonGoals: [], constraints: [], verification: [['node', '--test']], interfaces: { provides: [], consumes: [] }, behaviors: ['B1'], acceptance: ['file exists'], approach: 'create file', files: [`${id}.txt`], dependencies: [] });
const proof = (cwd, commit) => [{ command: ['node', '--version'], cwd, commit, exitCode: 0, passed: true, output: 'verified fixture' }];
const init = (repo, input) => api.execute(repo, 'init', { source: path.join(repo, 'seed'), ...input });
async function cleanup(repo, runId, taskId) {
  const state = await api.execute(repo, 'status', { runId });
  const worker = state.tasks[taskId];
  await api.execute(repo, 'agent-observation', { runId, taskId, ...observation(worker, 'STOPPED') });
  return api.execute(repo, 'cleanup', { runId, taskId });
}

test('runs parallel tasks through stale-base rebase, integration verification and cleanup', async t => {
  assert.equal(typeof api.execute, 'function', 'runtime must exist');
  const { repo } = fixture(t);
  const run = await init(repo, { confirmation: 'user approved tasks', tasks: [task('a'), task('b')] });
  const runId = run.id;
  const a = await startWorker(repo, runId, 'a', 'agent-a');
  const b = await startWorker(repo, runId, 'b', 'agent-b');
  async function report(worker, reportId) {
    fs.writeFileSync(path.join(worker.worktree, `${worker.id}.txt`), worker.id);
    git(worker.worktree, 'add', '.'); git(worker.worktree, 'commit', '-m', worker.id);
    const result = git(worker.worktree, 'rev-parse', 'HEAD');
    return api.execute(repo, 'report', { runId, taskId: worker.id, ...identity(worker), kind: 'DONE', reportId, base: worker.base, result, evidence: proof(worker.worktree, result) });
  }
  await report(a, 'a1'); await report(b, 'b1');
  assert.equal((await api.execute(repo, 'integrate', { runId, taskId: 'a' })).status, 'MERGED_PENDING_VALIDATION');
  const current = git(repo, 'rev-parse', 'HEAD');
  await api.execute(repo, 'record-validation', { runId, taskId: 'a', evidence: proof(repo, current) });
  await assert.rejects(api.execute(repo, 'cleanup', { runId, taskId: 'a', workerStopped: true }), /host observation/i);
  await cleanup(repo, runId, 'a');
  const stale = await api.execute(repo, 'integrate', { runId, taskId: 'b' });
  assert.equal(stale.status, 'REBASE_REQUIRED');
  const resumedB = await api.execute(repo, 'resume-task', { runId, taskId: 'b', ...identity(b), resolution: 'rebase onto latest target' });
  git(b.worktree, 'rebase', stale.base);
  const result = git(b.worktree, 'rev-parse', 'HEAD');
  await api.execute(repo, 'report', { runId, taskId: 'b', ...identity(resumedB), kind: 'DONE', reportId: 'b2', base: stale.base, result, evidence: proof(b.worktree, result) });
  await api.execute(repo, 'integrate', { runId, taskId: 'b' });
  await api.execute(repo, 'record-validation', { runId, taskId: 'b', evidence: proof(repo, result) });
  await cleanup(repo, runId, 'b');
  assert.equal(git(repo, 'status', '--porcelain'), '');
  assert.equal(fs.readFileSync(path.join(repo, 'a.txt'), 'utf8'), 'a');
  assert.equal(fs.readFileSync(path.join(repo, 'b.txt'), 'utf8'), 'b');
  const state = await api.execute(repo, 'resume', { runId });
  assert.equal(state.tasks.b.status, 'INTEGRATED');
  assert.equal(state.status, 'REVIEW_REQUIRED');
  assert.equal(fs.existsSync(b.worktree), false);
  assert.equal(state.events.length, state.version);
  const finished = await api.execute(repo, 'finish', { runId, reviewMode: 'main-self-review', issuesClosed: true, review: 'All behavior checks and review dispositions verified', evidence: proof(repo, result) });
  assert.equal(finished.status, 'DONE');
});

async function readyFixture(t) {
  const { repo } = fixture(t);
  const run = await init(repo, { confirmation: 'yes', tasks: [task('a')] });
  const worker = await startWorker(repo, run.id, 'a', 'worker');
  fs.writeFileSync(path.join(worker.worktree, 'a.txt'), 'task');
  git(worker.worktree, 'add', '.'); git(worker.worktree, 'commit', '-m', 'task');
  const result = git(worker.worktree, 'rev-parse', 'HEAD');
  const report = { runId: run.id, taskId: 'a', ...identity(worker), kind: 'DONE', reportId: 'r1', base: worker.base, result, evidence: proof(worker.worktree, result) };
  await api.execute(repo, 'report', report);
  return { repo, run, worker, result, report };
}

test('duplicate reports are idempotent; stale attempts and reused report ids fail', async t => {
  const f = await readyFixture(t);
  assert.equal((await api.execute(f.repo, 'report', f.report)).status, 'READY');
  await assert.rejects(api.execute(f.repo, 'report', { ...f.report, attempt: 0 }), /attempt/);
  await assert.rejects(api.execute(f.repo, 'report', { ...f.report, result: f.worker.base }), /reused/);
  await assert.rejects(init(f.repo, { confirmation: 'again', tasks: [task('b')] }), /active run/);
});

test('cleanup preserves dirty worktrees and changed branches; retry cleanup is idempotent', async t => {
  const f = await readyFixture(t);
  await api.execute(f.repo, 'integrate', { runId: f.run.id, taskId: 'a' });
  await api.execute(f.repo, 'record-validation', { runId: f.run.id, taskId: 'a', evidence: proof(f.repo, f.result) });
  fs.writeFileSync(path.join(f.worker.worktree, 'user-note'), 'preserve');
  await assert.rejects(cleanup(f.repo, f.run.id, 'a'), /changed/);
  assert.equal(fs.readFileSync(path.join(f.worker.worktree, 'user-note'), 'utf8'), 'preserve');
  fs.unlinkSync(path.join(f.worker.worktree, 'user-note'));
  await cleanup(f.repo, f.run.id, 'a');
  assert.equal((await cleanup(f.repo, f.run.id, 'a')).status, 'INTEGRATED');
});

test('resume recognizes committed transactions without replaying integration', async t => {
  const f = await readyFixture(t);
  await api.execute(f.repo, 'integrate', { runId: f.run.id, taskId: 'a' });
  const common = git(f.repo, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  const stateFile = path.join(common, 'task-orchestrator', f.run.id, 'state.json');
  const state = JSON.parse(fs.readFileSync(stateFile));
  state.tasks.a.status = 'MERGING'; // Inject interruption after reference commit but before final snapshot.
  fs.writeFileSync(stateFile, JSON.stringify(state));
  const resumed = await api.execute(f.repo, 'resume', { runId: f.run.id });
  assert.equal(resumed.tasks.a.status, 'MERGED_PENDING_VALIDATION');
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.result);
});

test('a live operation lock and an uncommitted user edit block integration safely', async t => {
  const f = await readyFixture(t);
  const common = git(f.repo, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  const lock = path.join(common, 'task-orchestrator', 'operation.lock');
  fs.mkdirSync(lock); fs.writeFileSync(path.join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, hostname: os.hostname() }));
  await assert.rejects(api.execute(f.repo, 'resume', { runId: f.run.id }), /alive/);
  fs.unlinkSync(path.join(lock, 'owner.json')); fs.rmdirSync(lock);
  fs.writeFileSync(path.join(f.repo, 'seed'), 'user edit');
  await assert.rejects(api.execute(f.repo, 'integrate', { runId: f.run.id, taskId: 'a' }), /source changed|changed after report/);
  assert.equal(fs.readFileSync(path.join(f.repo, 'seed'), 'utf8'), 'user edit');
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.worker.base);
});

test('integration preserves ignored user files which collide with task results', async t => {
  const f = await readyFixture(t);
  const common = git(f.repo, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  fs.appendFileSync(path.join(common, 'info', 'exclude'), '\na.txt\n');
  fs.writeFileSync(path.join(f.repo, 'a.txt'), 'USER LOCAL VALUE');
  assert.equal(git(f.repo, 'status', '--porcelain'), '');
  await assert.rejects(api.execute(f.repo, 'integrate', { runId: f.run.id, taskId: 'a' }), /untracked|ignored/i);
  assert.equal(fs.readFileSync(path.join(f.repo, 'a.txt'), 'utf8'), 'USER LOCAL VALUE');
  assert.equal(git(f.repo, 'rev-parse', 'HEAD'), f.worker.base);
});

test('confirmed takeover recovers an interrupted creation intent without touching unknown resources', async t => {
  const { repo } = fixture(t);
  const run = await init(repo, { confirmation: 'yes', tasks: [task('a')] });
  const worker = await startWorker(repo, run.id, 'a', 'old');
  git(repo, 'worktree', 'remove', worker.worktree);
  git(repo, 'update-ref', '-d', worker.branch, worker.base);
  const stateFile = path.join(git(repo, 'rev-parse', '--path-format=absolute', '--git-common-dir'), 'task-orchestrator', run.id, 'state.json');
  const state = JSON.parse(fs.readFileSync(stateFile));
  state.tasks.a.creation = 'INTENT';
  fs.writeFileSync(stateFile, JSON.stringify(state));
  const interrupted = await api.execute(repo, 'resume', { runId: run.id });
  assert.equal(interrupted.tasks.a.status, 'RECOVERY_REQUIRED');
  await api.execute(repo, 'agent-observation', { runId: run.id, taskId: 'a', ...observation(worker, 'STOPPED') });
  const retry = await api.execute(repo, 'retry', { runId: run.id, taskId: 'a', ...identity(worker), resolution: 'old instance stopped; creation interrupted' });
  const bound = await api.execute(repo, 'bind-agent', { runId: run.id, taskId: 'a', ...identity(retry), agentId: 'new' });
  const taken = await api.execute(repo, 'start-task', { runId: run.id, taskId: 'a', ...identity(bound) });
  assert.equal(taken.status, 'RUNNING');
  assert.equal(fs.existsSync(worker.worktree), true);
  assert.equal(taken.attempt, 2);
});

test('cleanup preserves ignored private files in task worktrees', async t => {
  const f = await readyFixture(t);
  await api.execute(f.repo, 'integrate', { runId: f.run.id, taskId: 'a' });
  await api.execute(f.repo, 'record-validation', { runId: f.run.id, taskId: 'a', evidence: proof(f.repo, f.result) });
  const common = git(f.repo, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  fs.appendFileSync(path.join(common, 'info', 'exclude'), '\nprivate.local\n');
  fs.writeFileSync(path.join(f.worker.worktree, 'private.local'), 'KEEP');
  await assert.rejects(cleanup(f.repo, f.run.id, 'a'), /ignored|untracked|changed/);
  assert.equal(fs.readFileSync(path.join(f.worker.worktree, 'private.local'), 'utf8'), 'KEEP');
});

test('rejects dirty initialization and invalid/overlapping task dispatch without changing user files', async t => {
  assert.equal(typeof api.execute, 'function');
  const { repo } = fixture(t);
  fs.writeFileSync(path.join(repo, 'user.txt'), 'keep');
  await assert.rejects(init(repo, { confirmation: 'yes', tasks: [task('a')] }), /clean/);
  fs.unlinkSync(path.join(repo, 'user.txt'));
  const run = await init(repo, { confirmation: 'yes', tasks: [task('a'), { ...task('b'), files: ['a.txt'] }] });
  await startWorker(repo, run.id, 'a', 'a');
  await assert.rejects(startWorker(repo, run.id, 'b', 'b'), /ready/);
  await assert.rejects(api.execute(repo, 'status', { runId: '../escape' }), /identifier/);
});

test('failed validation and stale evidence preserve task resources', async t => {
  assert.equal(typeof api.execute, 'function');
  const { repo } = fixture(t);
  const run = await init(repo, { confirmation: 'yes', tasks: [task('a')] });
  const worker = await startWorker(repo, run.id, 'a', 'a');
  await assert.rejects(api.execute(repo, 'report', { runId: run.id, taskId: 'a', ...identity(worker), kind: 'DONE', reportId: 'r', base: worker.base, result: worker.base, evidence: [] }), /evidence|commit|result/i);
  await assert.rejects(cleanup(repo, run.id, 'a'), /validation|cleanup/i);
  assert.equal(fs.existsSync(worker.worktree), true);
});
