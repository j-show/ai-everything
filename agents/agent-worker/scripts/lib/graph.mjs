import { identifier, requireValue, strings, scope, overlaps } from './validation.mjs';

export function validatePlan(input) {
  requireValue(Array.isArray(input) && input.length > 0, 'Tasks required');
  const tasks = input.map(t => {
    requireValue(t && typeof t === 'object', 'Invalid task');
    identifier(t.id);
    requireValue(['feature', 'bugfix', 'group'].includes(t.kind), 'Invalid task kind');
    const dependencies = strings(t.dependencies, 'dependencies', true);
    dependencies.forEach(identifier);
    const files = strings(t.files, 'files', t.kind === 'group').map(scope);
    if (t.parent) identifier(t.parent);
    if (t.kind !== 'group') {
      strings(t.behaviors, 'behaviors');
      strings(t.acceptance, 'acceptance');
      requireValue(typeof t.approach === 'string' && t.approach.trim(), 'Confirmed approach required');
    }
    return { ...structuredClone(t), dependencies, files };
  });
  const byId = new Map(tasks.map(t => [t.id, t]));
  requireValue(byId.size === tasks.length, 'Duplicate task id');
  const walk = (id, chain, parents = false) => {
    requireValue(byId.has(id), 'Unknown dependency or parent');
    requireValue(!chain.includes(id), 'Cyclic task graph');
    const t = byId.get(id);
    for (const next of parents ? (t.parent ? [t.parent] : []) : t.dependencies) walk(next, [...chain, id], parents);
  };
  for (const t of tasks) {
    walk(t.id, []);
    walk(t.id, [], true);
    if (t.parent) requireValue(byId.get(t.parent)?.kind === 'group', 'Only groups may have children');
    for (const dep of t.dependencies) requireValue(byId.get(dep)?.kind !== 'group', 'Dependencies must reference leaves');
  }
  return tasks;
}

export function readyTasks(tasks, statuses, limit = 3, occupancy = null) {
  requireValue(Number.isInteger(limit) && limit > 0, 'Invalid concurrency');
  const active = tasks.filter(t => statuses[t.id] && !['PENDING', 'INTEGRATED'].includes(statuses[t.id]));
  const executing = occupancy ?? active.filter(t => ['RUNNING', 'REBASING'].includes(statuses[t.id])).length;
  const selected = [];
  for (const t of tasks) {
    if (executing + selected.length >= limit) break;
    if (t.kind === 'group' || (statuses[t.id] && statuses[t.id] !== 'PENDING')) continue;
    if (!t.dependencies.every(id => statuses[id] === 'INTEGRATED')) continue;
    if ([...active, ...selected].some(other => t.files.some(a => other.files.some(b => overlaps(a, b))))) continue;
    selected.push(t);
  }
  return selected;
}
