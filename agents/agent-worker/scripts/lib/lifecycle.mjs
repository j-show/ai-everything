import { randomUUID } from 'node:crypto';
import { readyTasks } from './graph.mjs';
import { createBrief, digest } from './brief.mjs';
import { requireValue } from './validation.mjs';

export const terminal = state => ['STOPPED', 'FAILED'].includes(state);
export const agentState = (agent, state, execution = false) => ({ ...structuredClone(agent), state,
  revision: (agent.revision ?? 0) + 1, executionVersion: (agent.executionVersion ?? 0) + (execution ? 1 : 0) });
const agentStates = ['CREATED', 'ACTIVE', 'WAITING', 'STOP_REQUESTED', 'STOPPED', 'FAILED', 'UNKNOWN'];
export const live = t => t.status === 'DISPATCHING' || (t.status !== 'INTEGRATED' && t.agent && !terminal(t.agent.state));
export function readyForRun(run) {
  const states = Object.fromEntries(Object.entries(run.tasks).map(([id, t]) => [id, t.status]));
  return readyTasks(run.plan, states, run.limit, Object.values(run.tasks).filter(live).length);
}
export function identity(t, input, bound = true) {
  requireValue(input.attempt === t.attempt, 'Stale attempt');
  requireValue(typeof t.reservationId === 'string' && input.reservationId === t.reservationId, 'Reservation mismatch');
  requireValue(input.briefHash === t.briefHash, 'Brief hash mismatch');
  if (bound) requireValue(t.agent && input.agentId === t.agent.id, 'Bound instance required');
}
export function requireAgent(t, allowed) {
  requireValue(t.agent && allowed.includes(t.agent.state) && !t.needsBriefAck, 'Agent lifecycle/brief acknowledgement does not permit operation');
}
function archive(t) {
  if (!t.reservationId && !t.agent) return structuredClone(t.history ?? []);
  return [...(t.history ?? []), { attempt: t.attempt, reservationId: t.reservationId ?? null,
    agent: t.agent ? structuredClone(t.agent) : null, lastReport: structuredClone(t.currentReport ?? null), reports: structuredClone(t.reports ?? {}) }];
}
function reservation(run, t) {
  return { ...structuredClone(t), status: 'DISPATCHING', attempt: t.attempt + 1,
    reservationId: randomUUID(), briefHash: createBrief(run, t.id).hash, reservedAt: new Date().toISOString(),
    agent: null, currentReport: null, reports: {}, dispatchUncertain: false, needsBriefAck: false, history: archive(t) };
}
export function reserveTask(run, id) {
  requireValue(readyForRun(run).some(t => t.id === id), 'Task not ready: reserved/dependencies/capacity/conflict');
  return reservation(run, run.tasks[id]);
}
export function bindAgent(t, input) {
  identity(t, input, false);
  requireValue(typeof input.agentId === 'string' && input.agentId.trim(), 'Agent id required');
  if (t.agent) { requireValue(t.agent.id === input.agentId, 'Task already bound to another instance'); return structuredClone(t); }
  requireValue(t.status === 'DISPATCHING', 'Task is not reserved for binding');
  requireValue(!(t.history ?? []).some(old => old.agent?.id === input.agentId || old.legacyAgentId === input.agentId), 'Previous instance id cannot bind a new attempt');
  return { ...structuredClone(t), dispatchUncertain: false, agentId: input.agentId, agent: { id: input.agentId, state: 'CREATED', revision: 0, executionVersion: 0, observations: {}, observedAt: null, progressAt: null } };
}
export function agentObservation(t, input) {
  identity(t, input);
  requireValue(['host', 'user'].includes(input.source), 'Only host/user source can attest lifecycle');
  requireValue(agentStates.includes(input.state) && typeof input.observationId === 'string' && input.observationId.trim()
    && typeof input.evidence === 'string' && input.evidence.trim(), 'Lifecycle observation evidence required');
  const at = Date.parse(input.observedAt);
  requireValue(Number.isFinite(at), 'Invalid observedAt');
  const old = Object.hasOwn(t.agent.observations, input.observationId) ? t.agent.observations[input.observationId] : null;
  if (old) { requireValue(old.signature === digest(input), 'Observation id reused'); return structuredClone(t); }
  requireValue(Number.isInteger(input.agentVersion) && input.agentVersion === t.agent.revision, 'Stale agent revision: query host again after current transition');
  requireValue(!t.agent.observedAt || at > Date.parse(t.agent.observedAt), 'Stale lifecycle observation');
  requireValue(!terminal(t.agent.state) || input.state === t.agent.state, 'Terminal instance cannot be revived');
  const next = structuredClone(t);
  next.agent = agentState(next.agent, input.state); next.agent.observedAt = input.observedAt;
  next.agent.observations[input.observationId] = { ...structuredClone(input), signature: digest(input) };
  return next;
}
export function releaseDispatch(t, input) {
  requireValue(t.status === 'DISPATCHING', 'Only reserved dispatch can be released');
  requireValue(typeof input.reason === 'string' && input.reason.trim(), 'Dispatch disposition required');
  if (t.agent) requireValue(terminal(t.agent.state), 'Bound instance must have terminal/stopped evidence');
  else requireValue(input.noInstanceCreated === true && ['host', 'user'].includes(input.source)
    && typeof input.evidence === 'string' && input.evidence.trim(), 'Proof that no instance was created required');
  return { ...structuredClone(t), status: 'PENDING', history: archive(t), reservationId: null, briefHash: null, agent: null, agentId: null, reports: {} };
}
export function retryTask(run, t, input) {
  identity(t, input);
  requireValue(['BLOCKED', 'RECOVERY_REQUIRED'].includes(t.status), 'Task is not blocked for takeover');
  requireValue(t.agent && terminal(t.agent.state), 'Terminal old instance observation required before takeover');
  requireValue(typeof input.resolution === 'string' && input.resolution.trim(), 'New resolution evidence required');
  requireValue(Object.values(run.tasks).filter(live).length < run.limit, 'No capacity for takeover');
  return { ...reservation(run, t), takeover: true, resolution: input.resolution };
}
export function resumeInstance(t, input) {
  identity(t, input);
  requireValue(t.agent && !terminal(t.agent.state) && t.agent.state !== 'UNKNOWN' && t.agent.state !== 'STOP_REQUESTED', 'Known live instance required');
  requireValue(['BLOCKED', 'REBASING', 'RUNNING', 'READY', 'RECOVERY_REQUIRED'].includes(t.status), 'Task cannot resume');
  requireValue(typeof input.resolution === 'string' && input.resolution.trim(), 'Context or resolution required');
  const next = structuredClone(t);
  const started = t.creation === 'CREATED' || (t.worktree && t.creation !== 'INTENT');
  next.status = t.status === 'REBASING' ? 'REBASING' : (started ? 'RUNNING' : 'DISPATCHING');
  next.agent = agentState(next.agent, 'ACTIVE', true); next.needsBriefAck = false; next.resolution = input.resolution;
  return next;
}
