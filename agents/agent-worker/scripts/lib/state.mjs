import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { requireValue, identifier } from './validation.mjs';

export function assertPlainPath(target) {
  let current = path.resolve(target);
  while (true) {
    if (fs.existsSync(current)) requireValue(!fs.lstatSync(current).isSymbolicLink(), 'Symbolic links/junctions are not allowed for managed paths');
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

export function atomicWrite(file, value) {
  assertPlainPath(file);
  const temp = `${file}.${randomUUID()}.tmp`;
  const fd = fs.openSync(temp, 'wx');
  try { fs.writeFileSync(fd, JSON.stringify(value, null, 2)); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(temp, file);
}

export async function locked(directory, operation, recover = false) {
  assertPlainPath(directory);
  fs.mkdirSync(directory, { recursive: true });
  const lock = path.join(directory, 'operation.lock');
  try { fs.mkdirSync(lock); }
  catch (error) {
    if (!recover) throw new Error(`Repository operation locked; use resume after inspecting owner: ${error.message}`);
    assertPlainPath(lock);
    const owner = JSON.parse(fs.readFileSync(path.join(lock, 'owner.json'), 'utf8'));
    requireValue(owner.hostname === hostname() && Number.isInteger(owner.pid) && owner.pid > 0, 'Unknown lock owner; manual recovery required');
    let dead = false;
    try { process.kill(owner.pid, 0); } catch (probe) { dead = probe.code === 'ESRCH'; }
    requireValue(dead, 'Lock owner may still be alive; preserve lock');
    const retired = `${lock}.${randomUUID()}.retired`;
    fs.renameSync(lock, retired);
    fs.unlinkSync(path.join(retired, 'owner.json')); fs.rmdirSync(retired);
    fs.mkdirSync(lock);
  }
  try {
    fs.writeFileSync(path.join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, hostname: hostname(), started: new Date().toISOString() }));
    return await operation();
  } finally {
    fs.unlinkSync(path.join(lock, 'owner.json'));
    fs.rmdirSync(lock);
  }
}

export function loadRun(directory, id) {
  identifier(id);
  const file = path.join(directory, id, 'state.json');
  assertPlainPath(file);
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  requireValue([1, 2].includes(state.schema) && state.id === id && Array.isArray(state.events)
    && state.tasks && Array.isArray(state.plan) && Number.isInteger(state.version), 'Invalid run state; preserve and recover manually');
  return state;
}

export function saveRun(directory, state, action, detail = {}) {
  const previous = fs.existsSync(path.join(directory, identifier(state.id), 'state.json'))
    ? loadRun(directory, state.id) : { version: 0, events: [] };
  const next = { ...state, version: previous.version + 1,
    events: [...previous.events, { sequence: previous.version + 1, action, detail, at: new Date().toISOString() }] };
  const root = path.join(directory, identifier(state.id));
  fs.mkdirSync(root, { recursive: true });
  atomicWrite(path.join(root, 'state.json'), next);
  return next;
}
