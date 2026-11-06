import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execute } from '../scripts/runtime.mjs';
import { fixture, task, init, start, git, identity, observation } from './fixtures.mjs';

test('reserves before spawn, tolerates early start and binds exactly one instance', async t => {
  const repo = fixture(t), run = await init(repo);
  await assert.rejects(execute(repo, 'start-task', { runId: run.id, taskId: 'a', agentId: 'old-client' }), /reserv/i);
  const reserved = await execute(repo, 'reserve-task', { runId: run.id, taskId: 'a' });
  await assert.rejects(execute(repo, 'block', { runId: run.id, taskId: 'a', reason: 'spawn not returned' }), /dispatch|uncertain/i);
  assert.equal(reserved.status, 'DISPATCHING');
  const early = await execute(repo, 'start-task', { runId: run.id, taskId: 'a', ...identity(reserved) });
  assert.equal(early.status, 'WAITING_FOR_BINDING');
  assert.equal(git(repo, 'worktree', 'list', '--porcelain').includes('task-orchestrator/'), false);
  await assert.rejects(execute(repo, 'reserve-task', { runId: run.id, taskId: 'a' }), /ready|reserved/);
  const bound = await execute(repo, 'bind-agent', { runId: run.id, taskId: 'a', ...identity(reserved), agentId: 'first' });
  const worker = await execute(repo, 'start-task', { runId: run.id, taskId: 'a', ...identity(bound) });
  assert.equal(worker.attempt, reserved.attempt);
  assert.equal(worker.agent.state, 'ACTIVE');
  assert.equal(fs.existsSync(worker.worktree), true);
});

test('unknown spawn stays reserved until bound instance termination is proven', async t => {
  const repo = fixture(t), run = await init(repo, { tasks: [task('a'), task('b')], limit: 1 });
  const reserved = await execute(repo, 'reserve-task', { runId: run.id, taskId: 'a' });
  await execute(repo, 'dispatch-uncertain', { runId: run.id, taskId: 'a', ...identity(reserved), reason: 'spawn response lost' });
  assert.deepEqual((await execute(repo, 'status', { runId: run.id })).ready, []);
  await assert.rejects(execute(repo, 'dispatch-failed', { runId: run.id, taskId: 'a', ...identity(reserved), reason: 'timeout' }), /proof/i);
  const bound = await execute(repo, 'bind-agent', { runId: run.id, taskId: 'a', ...identity(reserved), agentId: 'late' });
  await execute(repo, 'agent-observation', { runId: run.id, taskId: 'a', ...observation(bound, 'STOPPED') });
  await execute(repo, 'dispatch-failed', { runId: run.id, taskId: 'a', ...identity(bound), reason: 'late instance stopped' });
  const next = await execute(repo, 'reserve-task', { runId: run.id, taskId: 'a' });
  assert.notEqual(next.reservationId, reserved.reservationId);
  assert.equal(next.attempt, reserved.attempt + 1);
});

test('partial reports need no fabricated commit; same-instance continuation preserves attempt', async t => {
  const repo = fixture(t), run = await init(repo), worker = await start(repo, run.id);
  const input = { runId: run.id, taskId: 'a', ...identity(worker), reportId: 'context', kind: 'NEEDS_CONTEXT', missingContext: ['interface value'] };
  assert.equal((await execute(repo, 'report', input)).status, 'BLOCKED');
  const continued = await execute(repo, 'resolve-report', { ...input, action: 'continue', resolution: 'confirmed value is 42' });
  assert.equal(continued.attempt, worker.attempt);
  assert.equal(continued.status, 'RUNNING');
  await execute(repo, 'report', { ...input, ...identity(continued), reportId: 'blocked', kind: 'BLOCKED', reason: 'test runner unavailable', attempted: ['used existing runner'] });
  await assert.rejects(execute(repo, 'retry', { ...input, resolution: 'new runner', workerStopped: true }), /terminal/i);
  const current = (await execute(repo, 'status', { runId: run.id })).tasks.a;
  await execute(repo, 'agent-observation', { runId: run.id, taskId: 'a', ...observation(current, 'STOPPED') });
  const retry = await execute(repo, 'retry', { ...input, resolution: 'runner installed by user' });
  assert.equal(retry.attempt, worker.attempt + 1);
  assert.equal(retry.agent, null);
  await assert.rejects(execute(repo, 'report', { ...input, reportId: 'late' }), /attempt/i);
});

test('a bound worker can ask for context before creating a worktree and then start normally', async t => {
  const repo = fixture(t), run = await init(repo);
  const reserved = await execute(repo, 'reserve-task', { runId: run.id, taskId: 'a' });
  const bound = await execute(repo, 'bind-agent', { runId: run.id, taskId: 'a', ...identity(reserved), agentId: 'early-worker' });
  const request = { runId: run.id, taskId: 'a', ...identity(bound), kind: 'NEEDS_CONTEXT', reportId: 'before-start', missingContext: ['test fixture location'] };
  assert.equal((await execute(repo, 'report', request)).status, 'BLOCKED');
  const continued = await execute(repo, 'resolve-report', { ...request, action: 'continue', resolution: 'fixture path supplied' });
  assert.equal(continued.status, 'DISPATCHING');
  const running = await execute(repo, 'start-task', { runId: run.id, taskId: 'a', ...identity(continued) });
  assert.equal(running.status, 'RUNNING');
  assert.equal(running.attempt, reserved.attempt);
});

test('legacy run upgrades with backup and an unknown instance, preserving attempt and worktree', async t => {
  const repo = fixture(t), run = await init(repo), worker = await start(repo, run.id);
  const file = path.join(git(repo, 'rev-parse', '--path-format=absolute', '--git-common-dir'), 'task-orchestrator', run.id, 'state.json');
  const legacy = JSON.parse(fs.readFileSync(file));
  legacy.schema = 1; delete legacy.tasks.a.agent; delete legacy.tasks.a.reservationId; delete legacy.tasks.a.briefHash;
  const bytes = JSON.stringify(legacy); fs.writeFileSync(file, bytes);
  const readOnly = await execute(repo, 'resume', { runId: run.id });
  assert.equal(readOnly.upgradeRequired, true);
  assert.equal(fs.readFileSync(file, 'utf8'), bytes);
  const upgraded = await execute(repo, 'upgrade-run', { runId: run.id, tasks: run.plan, confirmation: 'approved completed brief' });
  assert.equal(upgraded.schema, 2);
  assert.equal(upgraded.tasks.a.agent.state, 'UNKNOWN');
  assert.equal(upgraded.tasks.a.attempt, worker.attempt);
  assert.equal(upgraded.tasks.a.worktree, worker.worktree);
  assert.equal(fs.readdirSync(path.dirname(file)).some(n => n.startsWith('schema1-backup-')), true);
  const w = upgraded.tasks.a;
  await execute(repo, 'agent-observation', { runId: run.id, taskId: 'a', ...observation(w, 'ACTIVE') });
  const resumed = await execute(repo, 'resume-task', { runId: run.id, taskId: 'a', ...identity(w), resolution: 'same host instance received upgraded brief' });
  assert.equal(resumed.attempt, worker.attempt);
});
