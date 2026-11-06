import path from 'node:path';

export function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

export function identifier(value) {
  requireValue(typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,95}$/.test(value), 'Invalid identifier');
  return value;
}

export function strings(value, label, allowEmpty = false) {
  requireValue(Array.isArray(value) && (allowEmpty || value.length > 0)
    && value.every(item => typeof item === 'string' && item.trim()), `Invalid ${label}`);
  return [...value];
}

export function scope(value) {
  requireValue(typeof value === 'string' && value.length > 0 && !value.includes('\\')
    && !value.includes(':') && !value.includes('\0') && !path.posix.isAbsolute(value)
    && !value.split('/').some(p => p === '..' || p === '.' || p === '.git')
    && !value.includes('//') && !/[?*\[\]]/.test(value), 'Files must be literal repository-relative paths');
  return value.replace(/\/$/, '');
}

export const overlaps = (a, b) => {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  return left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`);
};

export function evidence(value, commit) {
  requireValue(Array.isArray(value) && value.length > 0, 'Validation evidence required');
  return value.map(item => {
    requireValue(item && item.commit === commit && item.exitCode === 0
      && typeof item.cwd === 'string' && path.isAbsolute(item.cwd)
      && typeof item.output === 'string' && item.output.trim()
      && item.passed === true, 'Evidence must pass and match current commit');
    strings(item.command, 'command');
    return structuredClone(item);
  });
}
