import { createBrief } from './brief.mjs';
import { identity, terminal, reserveTask, bindAgent, agentObservation, releaseDispatch, resumeInstance, retryTask, agentState } from './lifecycle.mjs';
import { resolveReport } from './reports.mjs';
import { requireValue } from './validation.mjs';

export const dispatchCommands = new Set(['reserve-task', 'bind-agent', 'dispatch-failed', 'dispatch-uncertain', 'agent-observation', 'heartbeat', 'resume-task', 'resolve-report', 'retry']);

/** Return a new task record. The runtime persists it under its repository lock. */
export function dispatchCommand(run, t, command, input) {
  if (command === 'reserve-task') return reserveTask(run, t.id);
  requireValue(t.briefHash === createBrief(run, t.id).hash, 'Confirmed brief changed; re-confirm before dispatch');
  if (command === 'bind-agent') {
    requireValue(!Object.values(run.tasks).some(other => other.id !== t.id
      && (other.agent?.id === input.agentId || (other.history ?? []).some(old => old.agent?.id === input.agentId || old.legacyAgentId === input.agentId))), 'Instance already belongs to another task');
    return bindAgent(t, input);
  }
  if (command === 'agent-observation') return agentObservation(t, input);
  if (command === 'retry') return retryTask(run, t, input);
  if (command === 'resolve-report') return resolveReport(t, input);
  if (command === 'resume-task') return resumeInstance(t, input);
  identity(t, input, command === 'heartbeat');
  if (command === 'dispatch-failed') return releaseDispatch(t, input);
  if (command === 'dispatch-uncertain') {
    requireValue(!t.agent || !terminal(t.agent.state), 'Terminal instance cannot become uncertain');
    requireValue(t.status === 'DISPATCHING' || (t.agent && !terminal(t.agent.state)), 'No live dispatch to reconcile');
    requireValue(typeof input.reason === 'string' && input.reason.trim(), 'Uncertainty reason required');
    const next = structuredClone(t);
    next.dispatchUncertain = true; next.error = input.reason;
    if (next.agent) next.agent = agentState(next.agent, 'UNKNOWN');
    return next;
  }
  requireValue(t.agent && !terminal(t.agent.state), 'Terminal instance cannot heartbeat');
  return { ...structuredClone(t), needsBriefAck: false,
    agent: { ...structuredClone(t.agent), progressAt: new Date().toISOString() } };
}
