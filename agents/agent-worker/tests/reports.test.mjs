import test from 'node:test';
import assert from 'node:assert/strict';
const api = await import('../scripts/lib/reports.mjs').catch(() => ({}));
const worker = () => ({ id: 'a', creation: 'CREATED', status: 'RUNNING', attempt: 1, reservationId: 'lease', briefHash: 'brief', agent: { id: 'agent', state: 'ACTIVE', revision: 0, executionVersion: 0 } });
const input = (kind, extra = {}) => ({ kind, reportId: 'r', attempt: 1, reservationId: 'lease', briefHash: 'brief', agentId: 'agent', agentVersion: 0, ...extra });

test('context/block reports preserve incomplete work without inventing successful commits', () => {
  assert.equal(typeof api.classifyReport, 'function');
  const context = api.classifyReport(worker(), input('NEEDS_CONTEXT', { missingContext: ['API response contract'] }));
  assert.equal(context.status, 'BLOCKED');
  assert.equal(context.agent.state, 'WAITING');
  assert.equal(context.result, undefined);
  assert.equal(api.classifyReport(worker(), input('BLOCKED', { reason: 'runner missing', attempted: [] })).status, 'BLOCKED');
  assert.throws(() => api.classifyReport(worker(), input('unknown')));
});

test('a delayed success from before resume cannot override newer work', () => {
  const t = worker(); t.agent.revision = 2; t.agent.executionVersion = 2;
  assert.throws(() => api.classifyReport(t, input('DONE')), /version|revision/i);
});

test('concerns require disposition, and correctness concerns cannot be acknowledged away', () => {
  assert.equal(typeof api.resolveReport, 'function');
  const info = api.classifyReport(worker(), input('DONE_WITH_CONCERNS', { concerns: [{ category: 'info', message: 'follow-up observation' }] }));
  assert.equal(info.status, 'BLOCKED');
  const ack = { ...input(''), action: 'acknowledge-info', resolution: 'reviewed; no defect' };
  assert.equal(api.resolveReport(info, ack).status, 'READY');
  const wrong = api.classifyReport(worker(), input('DONE_WITH_CONCERNS', { concerns: [{ category: 'correctness', message: 'race possible' }] }));
  assert.throws(() => api.resolveReport(wrong, ack), /correctness|information/i);
  const resumed = api.resolveReport(wrong, { ...ack, action: 'continue', resolution: 'fix with supplied ordering contract' });
  assert.equal(resumed.status, 'RUNNING');
  assert.equal(resumed.attempt, 1);
});
