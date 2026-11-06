import { createHash } from 'node:crypto';
import { validatePlan } from './graph.mjs';
import { requireValue, strings } from './validation.mjs';

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
export const digest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

export function validateBriefPlan(input) {
  const plan = validatePlan(input);
  requireValue(plan.some(t => t.kind !== 'group'), 'At least one leaf required');
  for (const t of plan.filter(x => x.kind !== 'group')) {
    requireValue(typeof t.goal === 'string' && t.goal.trim(), 'Brief goal required');
    strings(t.nonGoals, 'nonGoals', true); strings(t.constraints, 'constraints', true);
    requireValue(Array.isArray(t.verification) && t.verification.length > 0, 'Brief verification commands required');
    t.verification.forEach(v => strings(v, 'verification command'));
    requireValue(t.interfaces && Array.isArray(t.interfaces.provides) && Array.isArray(t.interfaces.consumes), 'Brief interfaces required');
    const names = new Set();
    for (const item of t.interfaces.provides) {
      strings([item?.name, item?.contract], 'provided interface');
      requireValue(!names.has(item.name), 'Duplicate provided interface'); names.add(item.name);
    }
    const dependencies = new Set();
    function visit(id) {
      if (dependencies.has(id)) return;
      dependencies.add(id);
      plan.find(x => x.id === id).dependencies.forEach(visit);
    }
    t.dependencies.forEach(visit);
    for (const item of t.interfaces.consumes) {
      strings([item?.from, item?.name, item?.contract], 'consumed interface');
      requireValue(dependencies.has(item.from), 'Interface producer must be an explicit or transitive dependency');
      const producer = plan.find(x => x.id === item.from);
      requireValue(producer?.kind !== 'group' && producer?.interfaces?.provides?.some(p => p.name === item.name && p.contract === item.contract), 'Interface contract does not match producer');
    }
  }
  return plan;
}

export function createBrief(run, id) {
  const task = run.plan.find(t => t.id === id && t.kind !== 'group');
  requireValue(task, 'Unknown leaf brief');
  const content = { task: structuredClone(task), source: structuredClone(run.source), globalConstraints: [...(run.globalConstraints ?? [])] };
  return { ...content, hash: digest(content), dependencyResults: Object.fromEntries(task.dependencies.map(dep => [dep, run.tasks[dep]?.result ?? null])) };
}
