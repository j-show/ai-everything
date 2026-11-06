import test from 'node:test';
import assert from 'node:assert/strict';

const api = await import('../scripts/lib/graph.mjs').catch(() => ({}));
const task = (id, extra = {}) => ({ id, kind: 'feature', behaviors: ['B1'], acceptance: ['works'], approach: 'small change', files: [`${id}.txt`], dependencies: [], ...extra });

test('validates dependency graph and immutable ready selection with capacity and file reservations', () => {
  assert.equal(typeof api.validatePlan, 'function', 'plan validation must exist');
  const tasks = [task('a'), task('b'), task('c', { files: ['a.txt'] }), task('d', { dependencies: ['b'] })];
  const plan = api.validatePlan(tasks);
  const before = JSON.stringify(plan);
  assert.deepEqual(api.readyTasks(plan, {}, 3).map(t => t.id), ['a', 'b']);
  assert.deepEqual(api.readyTasks(plan, { a: 'RUNNING' }, 3).map(t => t.id), ['b']);
  assert.deepEqual(api.readyTasks(plan, { a: 'INTEGRATED', b: 'INTEGRATED', c: 'INTEGRATED' }, 3).map(t => t.id), ['d']);
  assert.equal(JSON.stringify(plan), before);
});

test('rejects cycles, missing dependencies, path escapes and invalid task kinds', () => {
  assert.equal(typeof api.validatePlan, 'function');
  for (const tasks of [
    [task('a', { dependencies: ['b'] }), task('b', { dependencies: ['a'] })],
    [task('a', { dependencies: ['missing'] })],
    [task('a', { files: ['../outside'] })],
    [task('a', { kind: 'unknown' })],
    [task('a'), task('a')],
  ]) assert.throws(() => api.validatePlan(tasks));
});

test('reserves overlapping directory scopes and rejects parent-node dispatch', () => {
  assert.equal(typeof api.validatePlan, 'function');
  const plan = api.validatePlan([task('root', { kind: 'group', files: [] }), task('a', { parent: 'root', files: ['src/'] }), task('b', { parent: 'root', files: ['src/file.js'] })]);
  assert.deepEqual(api.readyTasks(plan, {}, 3).map(t => t.id), ['a']);
});

test('blocked workers reserve files without exhausting execution capacity for unrelated tasks', () => {
  const plan = api.validatePlan([task('a'), task('b'), task('c')]);
  assert.deepEqual(api.readyTasks(plan, { a: 'BLOCKED', b: 'BLOCKED' }, 2).map(t => t.id), ['c']);
});
