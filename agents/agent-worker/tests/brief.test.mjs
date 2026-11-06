import test from 'node:test';
import assert from 'node:assert/strict';
const api = await import('../scripts/lib/brief.mjs').catch(() => ({}));
const task = (id, extra = {}) => ({ id, kind: 'feature', goal: `implement ${id}`, nonGoals: [], constraints: [], verification: [['node', '--test']], behaviors: ['B1: behavior'], acceptance: ['passes'], approach: 'existing conventions', files: [`${id}.mjs`], dependencies: [], interfaces: { provides: [], consumes: [] }, ...extra });

test('checks interface producer, contract and transitive dependency before dispatch', () => {
  assert.equal(typeof api.validateBriefPlan, 'function');
  const a = task('a', { interfaces: { provides: [{ name: 'parse', contract: '(string) => Value' }], consumes: [] } });
  const b = task('b', { dependencies: ['a'] });
  const c = task('c', { dependencies: ['b'], interfaces: { provides: [], consumes: [{ from: 'a', name: 'parse', contract: '(string) => Value' }] } });
  assert.equal(api.validateBriefPlan([a, b, c]).length, 3);
  assert.throws(() => api.validateBriefPlan([a, { ...c, dependencies: [] }]), /depend/i);
  assert.throws(() => api.validateBriefPlan([a, { ...c, dependencies: ['a'], interfaces: { provides: [], consumes: [{ from: 'a', name: 'parse', contract: 'other' }] } }]), /contract/i);
});

test('brief digest binds confirmed task constraints and source without session history', () => {
  assert.equal(typeof api.createBrief, 'function');
  const run = { source: { sha256: 'source' }, globalConstraints: ['Node 22'], plan: [task('a')], tasks: { a: {} }, history: 'private conversation' };
  const brief = api.createBrief(run, 'a');
  assert.equal(JSON.stringify(brief).includes('private conversation'), false);
  assert.equal(brief.task.goal, 'implement a');
  assert.notEqual(api.createBrief({ ...run, globalConstraints: ['Node 24'] }, 'a').hash, brief.hash);
  assert.equal(api.createBrief(structuredClone(run), 'a').hash, brief.hash);
});

test('rejects incomplete briefs, empty execution plans and ambiguous interfaces', () => {
  assert.equal(typeof api.validateBriefPlan, 'function');
  assert.throws(() => api.validateBriefPlan([task('a', { goal: '' })]));
  assert.throws(() => api.validateBriefPlan([{ id: 'group', kind: 'group', files: [], dependencies: [] }]), /leaf|leaves/i);
  assert.throws(() => api.validateBriefPlan([task('a', { interfaces: { consumes: [], provides: [{ name: 'x', contract: 'a' }, { name: 'x', contract: 'b' }] } })]), /duplicate/i);
});
