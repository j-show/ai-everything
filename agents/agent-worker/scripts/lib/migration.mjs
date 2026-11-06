import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateBriefPlan, createBrief, digest } from './brief.mjs';
import { assertPlainPath } from './state.mjs';
import { requireValue, strings } from './validation.mjs';

function contract(t) {
  return { id: t.id, kind: t.kind, parent: t.parent ?? null, dependencies: t.dependencies,
    files: t.files, behaviors: t.behaviors ?? null, acceptance: t.acceptance ?? null, approach: t.approach ?? null };
}

export function upgradeRun(directory, run, input) {
  requireValue(run.schema === 1, 'Run already upgraded');
  strings([input.confirmation], 'upgrade confirmation');
  const plan = validateBriefPlan(input.tasks);
  requireValue(plan.length === run.plan.length && plan.every(t => {
    const old = run.plan.find(x => x.id === t.id);
    return old && digest(contract(old)) === digest(contract(t));
  }), 'Upgrade cannot alter confirmed behavior, scope or dependencies');
  const next = structuredClone(run);
  next.schema = 2; next.plan = plan; next.globalConstraints = strings(input.globalConstraints ?? [], 'global constraints', true);
  next.upgradeConfirmation = input.confirmation;
  for (const t of Object.values(next.tasks)) {
    t.legacyReports = t.reports; t.reports = {}; t.history = [];
    if (t.status === 'PENDING' || t.status === 'INTEGRATED') {
      t.history.push({ legacyAgentId: t.agentId ?? null, state: 'UNKNOWN' }); t.agent = null;
      continue;
    }
    t.reservationId = randomUUID(); t.briefHash = createBrief(next, t.id).hash;
    t.needsBriefAck = true; t.reservedAt = new Date().toISOString();
    t.agent = t.agentId ? { id: t.agentId, state: 'UNKNOWN', revision: 0, executionVersion: 0, observedAt: null, observations: {}, progressAt: null } : null;
    if (!t.agent) t.status = 'RECOVERY_REQUIRED';
  }
  const root = path.join(directory, run.id);
  const source = path.join(root, 'state.json'), backup = path.join(root, `schema1-backup-${randomUUID()}.json`);
  assertPlainPath(source); assertPlainPath(backup);
  fs.copyFileSync(source, backup, fs.constants.COPYFILE_EXCL);
  return next;
}
