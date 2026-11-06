import test from 'node:test';
import assert from 'node:assert/strict';
const api = await import('../scripts/lib/lifecycle.mjs').catch(() => ({}));
const { dispatchCommand } = await import('../scripts/lib/dispatch.mjs');
const { classifyReport } = await import('../scripts/lib/reports.mjs');
const task = id => ({ id, kind: 'feature', goal: id, nonGoals: [], constraints: [], verification: [['node', '--test']], behaviors: ['B1'], acceptance: ['pass'], approach: 'small change', files: [id], dependencies: [], interfaces: { provides: [], consumes: [] } });
const run = () => ({ limit: 1, source: { sha256: 'source' }, globalConstraints: [], plan: [task('a'), task('b')], tasks: { a: { id: 'a', status: 'PENDING', attempt: 0, reports: {} }, b: { id: 'b', status: 'PENDING', attempt: 0, reports: {} } } });
const identity = t => ({ attempt: t.attempt, reservationId: t.reservationId, briefHash: t.briefHash, agentId: t.agent?.id });
const observation = (t, state, seq = 1) => ({ ...identity(t), agentVersion: t.agent?.revision, observationId: `obs${seq}`, state, observedAt: new Date(1800000000000 + seq).toISOString(), source: 'host', evidence: 'host tool response' });

test('reservation blocks duplicate dispatch and consumes capacity before an agent exists', () => {
  assert.equal(typeof api.reserveTask, 'function');
  const r = run(), before = JSON.stringify(r);
  const a = api.reserveTask(r, 'a');
  assert.equal(JSON.stringify(r), before);
  assert.equal(a.status, 'DISPATCHING');
  r.tasks.a = a;
  assert.throws(() => api.reserveTask(r, 'a'), /ready|reserved/i);
  assert.throws(() => api.reserveTask(r, 'b'), /ready|capacity/i);
  assert.equal(api.bindAgent(a, { ...identity(a), agentId: 'one' }).agent.id, 'one');
});

test('a late host callback sampled before resume cannot stop the resumed instance', () => {
  let t = api.reserveTask(run(), 'a'); t = api.bindAgent(t, { ...identity(t), agentId: 'one' });
  t.status = 'BLOCKED';
  const old = observation(t, 'STOPPED', 1);
  const resumed = api.resumeInstance(t, { ...identity(t), resolution: 'new context delivered' });
  assert.throws(() => api.agentObservation(resumed, old), /revision|version/i);
  assert.equal(resumed.agent.state, 'ACTIVE');
});

test('a late dispatch timeout cannot resurrect a terminal binding', () => {
  const r = run(); let t = api.reserveTask(r, 'a'); t = api.bindAgent(t, { ...identity(t), agentId: 'one' });
  t = api.agentObservation(t, observation(t, 'STOPPED'));
  assert.throws(() => dispatchCommand(r, t, 'dispatch-uncertain', { ...identity(t), reason: 'late timeout' }), /terminal|live/i);
});

test('replacement attempts cannot rebind the terminated instance id', () => {
  const r = run(); let t = api.reserveTask(r, 'a'); t = api.bindAgent(t, { ...identity(t), agentId: 'old' });
  t.status = 'BLOCKED'; t = api.agentObservation(t, observation(t, 'STOPPED'));
  t.currentReport = { reportId: 'previous-attempt', kind: 'DONE_WITH_CONCERNS' };
  const next = api.retryTask(r, t, { ...identity(t), resolution: 'new implementation context' });
  assert.equal(next.currentReport, null);
  assert.throws(() => api.bindAgent(next, { ...identity(next), agentId: 'old' }), /previous|new instance/i);
});

test('one native instance cannot bind two different leaf tasks', () => {
  const r = run(); r.limit = 2;
  const a = api.reserveTask(r, 'a'); r.tasks.a = api.bindAgent(a, { ...identity(a), agentId: 'same' });
  const b = api.reserveTask(r, 'b'); r.tasks.b = b;
  assert.throws(() => dispatchCommand(r, b, 'bind-agent', { ...identity(b), agentId: 'same' }), /another task|instance/i);
});

test('ordinary host polling does not revoke the worker execution version', () => {
  let t = api.reserveTask(run(), 'a'); t = api.bindAgent(t, { ...identity(t), agentId: 'one' });
  t.status = 'RUNNING'; t.creation = 'CREATED'; t = api.resumeInstance(t, { ...identity(t), resolution: 'start confirmed work' });
  const version = t.agent.executionVersion ?? t.agent.revision;
  t = api.agentObservation(t, observation(t, 'ACTIVE'));
  assert.equal(classifyReport(t, { ...identity(t), agentVersion: version, kind: 'NEEDS_CONTEXT', reportId: 'ctx', missingContext: ['contract'] }).status, 'BLOCKED');
});

test('historical migrated instance ids cannot bind a different task', () => {
  const r = run(); r.tasks.a = { ...r.tasks.a, status: 'INTEGRATED', agent: null, history: [{ legacyAgentId: 'legacy' }] };
  const b = api.reserveTask(r, 'b');
  assert.throws(() => dispatchCommand(r, b, 'bind-agent', { ...identity(b), agentId: 'legacy' }), /another task|instance/i);
});

test('binding is idempotent, cannot switch instance and rejects stale reservations', () => {
  assert.equal(typeof api.bindAgent, 'function');
  const t = api.reserveTask(run(), 'a');
  const input = { ...identity(t), agentId: 'one' };
  const bound = api.bindAgent(t, input);
  assert.deepEqual(api.bindAgent(bound, input), bound);
  assert.throws(() => api.bindAgent(bound, { ...input, agentId: 'two' }), /bound|instance/i);
  assert.throws(() => api.bindAgent(bound, { ...input, reservationId: 'stale' }), /reservation/i);
});

test('uncertain creation stays reserved until identified instance has terminal host evidence', () => {
  assert.equal(typeof api.releaseDispatch, 'function');
  let t = api.reserveTask(run(), 'a');
  t = api.bindAgent(t, { ...identity(t), agentId: 'one' });
  assert.throws(() => api.releaseDispatch(t, { reason: 'timeout' }), /terminal|stopped/i);
  t = api.agentObservation(t, observation(t, 'STOPPED'));
  const released = api.releaseDispatch(t, { reason: 'host confirmed stopped' });
  assert.equal(released.status, 'PENDING');
  assert.throws(() => api.bindAgent(released, { ...identity(t), agentId: 'one' }));
});

test('terminal observations cannot be revived by stale callbacks and replays are idempotent', () => {
  assert.equal(typeof api.agentObservation, 'function');
  let t = api.reserveTask(run(), 'a');
  t = api.bindAgent(t, { ...identity(t), agentId: 'one' });
  const stopped = observation(t, 'STOPPED', 2);
  t = api.agentObservation(t, stopped);
  assert.deepEqual(api.agentObservation(t, stopped), t);
  assert.throws(() => api.agentObservation(t, observation(t, 'ACTIVE', 1)), /stale|terminal/i);
  assert.throws(() => api.agentObservation(t, observation(t, 'ACTIVE', 3)), /terminal/i);
  assert.throws(() => api.agentObservation(t, { ...observation(t, 'STOPPED', 4), source: 'worker' }), /host|source/i);
});
