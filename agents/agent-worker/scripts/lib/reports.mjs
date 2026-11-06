import { requireValue, strings, identifier } from './validation.mjs';
import { identity, requireAgent, resumeInstance, agentState } from './lifecycle.mjs';

export function classifyReport(t, input) {
  identity(t, input); identifier(input.reportId);
  requireValue(Number.isInteger(input.agentVersion) && input.agentVersion === t.agent.executionVersion, 'Stale report execution version');
  requireValue(['DONE', 'DONE_WITH_CONCERNS', 'NEEDS_CONTEXT', 'BLOCKED'].includes(input.kind), 'Unknown report kind');
  const partial = ['NEEDS_CONTEXT', 'BLOCKED'].includes(input.kind);
  requireAgent(t, partial ? ['CREATED', 'ACTIVE', 'WAITING'] : ['ACTIVE', 'WAITING']);
  requireValue((partial ? ['DISPATCHING', 'RUNNING', 'REBASING'] : ['RUNNING', 'REBASING']).includes(t.status), 'Resume task before a new report');
  if (input.kind === 'NEEDS_CONTEXT') strings(input.missingContext, 'missing context');
  if (input.kind === 'BLOCKED') {
    strings([input.reason], 'block reason'); strings(input.attempted, 'attempted actions', true);
  }
  if (input.kind === 'DONE_WITH_CONCERNS') {
    requireValue(Array.isArray(input.concerns) && input.concerns.length > 0, 'Concerns required');
    input.concerns.forEach(c => {
      requireValue(['correctness', 'scope', 'info'].includes(c?.category), 'Unknown concern category');
      strings([c.message], 'concern message');
    });
  }
  const next = structuredClone(t);
  next.status = input.kind === 'DONE' ? 'READY' : 'BLOCKED';
  next.agent = agentState(next.agent, 'WAITING');
  next.currentReport = structuredClone(input);
  return next;
}

export function resolveReport(t, input) {
  identity(t, input);
  requireValue(t.status === 'BLOCKED' && t.currentReport, 'No report awaiting resolution');
  requireValue(input.reportId === t.currentReport.reportId, 'Report resolution targets a stale report');
  strings([input.resolution], 'report resolution');
  if (input.action === 'continue') return resumeInstance(t, input);
  requireValue(input.action === 'acknowledge-info' && t.currentReport.kind === 'DONE_WITH_CONCERNS'
    && t.currentReport.concerns.every(c => c.category === 'info'), 'Only information concerns can be acknowledged; correctness requires work');
  requireAgent(t, ['WAITING']);
  return { ...structuredClone(t), status: 'READY', resolution: input.resolution };
}
