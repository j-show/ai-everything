import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { git, head, tree, clean, ancestor, oid, idle, referenceTransaction } from './lib/git.mjs';
import { locked, loadRun, saveRun, assertPlainPath } from './lib/state.mjs';
import { validatePlan } from './lib/graph.mjs';
import { validateBriefPlan, createBrief, digest } from './lib/brief.mjs';
import { identity, requireAgent, readyForRun, terminal, agentState } from './lib/lifecycle.mjs';
import { dispatchCommands, dispatchCommand } from './lib/dispatch.mjs';
import { classifyReport } from './lib/reports.mjs';
import { upgradeRun } from './lib/migration.mjs';
import { identifier, requireValue, evidence, overlaps, strings } from './lib/validation.mjs';

const taskStates = new Set(['PENDING', 'DISPATCHING', 'RUNNING', 'READY', 'REBASING', 'MERGING', 'MERGED_PENDING_VALIDATION', 'CLEANUP_PENDING', 'INTEGRATED', 'BLOCKED', 'RECOVERY_REQUIRED']);
const now = () => new Date().toISOString();

function context(cwd) {
  const repo = fs.realpathSync(git(cwd, ['rev-parse', '--show-toplevel']));
  const common = git(repo, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
  return { repo, directory: path.join(common, 'task-orchestrator') };
}

function checkRun(ctx, run) {
  requireValue(run.repo === ctx.repo && /^refs\/heads\//.test(run.branch), 'Run repository mismatch');
  validatePlan(run.plan);
  if (run.schema === 2) validateBriefPlan(run.plan);
  requireValue(run.confirmation && Number.isInteger(run.limit) && run.limit > 0, 'Invalid run confirmation/concurrency');
  requireValue(run.source && typeof run.source.path === 'string'
    && createHash('sha256').update(fs.readFileSync(run.source.path)).digest('hex') === run.source.sha256, 'Requirement source changed; confirmation must be revisited');
  for (const t of Object.values(run.tasks)) {
    identifier(t.id);
    requireValue(taskStates.has(t.status), 'Invalid task state');
    if (t.worktree) {
      requireValue(t.worktree === path.join(run.worktreeRoot, run.id, t.id)
        && t.branch === `refs/heads/task-orchestrator/${run.id}/${t.id}`, 'Managed resource mismatch');
      assertPlainPath(t.worktree);
    }
  }
  requireValue(git(ctx.repo, ['symbolic-ref', 'HEAD']) === run.branch, 'Target branch changed; recovery required');
}

function initialize(ctx, input) {
  idle(ctx.repo);
  requireValue(clean(ctx.repo), 'Start requires a clean working tree and index');
  const plan = validateBriefPlan(input.tasks);
  requireValue(typeof input.source === 'string' && path.isAbsolute(input.source), 'Absolute confirmed requirement source required');
  const source = { path: fs.realpathSync(input.source), sha256: createHash('sha256').update(fs.readFileSync(input.source)).digest('hex') };
  requireValue(typeof input.confirmation === 'string' && input.confirmation.trim(), 'User task-tree confirmation required');
  const limit = input.limit ?? 3;
  requireValue(Number.isInteger(limit) && limit > 0 && limit <= 128, 'Invalid concurrency');
  const branch = git(ctx.repo, ['symbolic-ref', 'HEAD']);
  const base = head(ctx.repo);
  // A second run cannot claim a branch whose previous run remains unfinished.
  for (const entry of fs.readdirSync(ctx.directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'operation.lock') continue;
    const old = loadRun(ctx.directory, entry.name);
    requireValue(old.branch !== branch || old.status === 'DONE', 'Target branch already has an active run; use resume');
  }
  const worktreeRoot = path.resolve(input.worktreeRoot ?? path.join(path.dirname(ctx.repo), `.${path.basename(ctx.repo)}-task-worktrees`));
  assertPlainPath(worktreeRoot);
  requireValue(worktreeRoot !== ctx.repo && !worktreeRoot.startsWith(ctx.repo + path.sep), 'Worktrees must be outside the product checkout');
  const run = { schema: 2, id: randomUUID(), version: 0, events: [], repo: ctx.repo, branch,
    initial: base, source, confirmation: input.confirmation, limit, worktreeRoot,
    status: 'EXECUTING', created: now(), plan, globalConstraints: strings(input.globalConstraints ?? [], 'global constraints', true),
    tasks: Object.fromEntries(plan.filter(t => t.kind !== 'group').map(t => [t.id, { id: t.id, status: 'PENDING', attempt: 0, reports: {} }])) };
  return saveRun(ctx.directory, run, 'INIT');
}

function resourceCheck(run, t) {
  assertPlainPath(t.worktree);
  const entries = git(run.repo, ['worktree', 'list', '--porcelain', '-z']).split('\0');
  requireValue(entries.includes(`worktree ${t.worktree.replaceAll('\\', '/')}`)
    || entries.includes(`worktree ${t.worktree}`), 'Worktree is not registered');
  requireValue(git(t.worktree, ['symbolic-ref', 'HEAD']) === t.branch, 'Task branch changed');
  idle(t.worktree);
}

function start(ctx, run, input) {
  const t = run.tasks[identifier(input.taskId)];
  requireValue(t && t.status === 'DISPATCHING', 'Task reservation required before start');
  identity(t, input, false);
  if (!t.agent) return { status: 'WAITING_FOR_BINDING', taskId: t.id, attempt: t.attempt };
  identity(t, input); requireAgent(t, ['CREATED', 'ACTIVE']);
  requireValue(!Object.values(run.tasks).some(x => ['MERGING', 'MERGED_PENDING_VALIDATION', 'RECOVERY_REQUIRED'].includes(x.status)), 'Integration requires verification/recovery');
  requireValue(clean(ctx.repo), 'Target must be clean');
  requireValue(typeof input.agentId === 'string' && input.agentId.trim(), 'Agent id required');
  const worktree = path.join(run.worktreeRoot, run.id, t.id);
  assertPlainPath(worktree);
  if (t.takeover && t.worktree && fs.existsSync(worktree)) {
    resourceCheck(run, t); t.status = 'RUNNING'; t.agent = agentState(t.agent, 'ACTIVE', true); t.takeover = false;
    saveRun(ctx.directory, run, 'TASK_TAKEN_OVER', { taskId: t.id }); return t;
  }
  requireValue(!fs.existsSync(worktree), 'Task worktree already exists; recover instead');
  Object.assign(t, { status: 'RUNNING', creation: 'INTENT', base: head(ctx.repo), worktree, branch: `refs/heads/task-orchestrator/${run.id}/${t.id}` });
  saveRun(ctx.directory, run, 'CREATE_WORKTREE_INTENT', { taskId: t.id });
  fs.mkdirSync(path.dirname(worktree), { recursive: true });
  git(ctx.repo, ['worktree', 'add', '-b', t.branch.slice(11), worktree, t.base]);
  t.creation = 'CREATED'; t.agent = agentState(t.agent, 'ACTIVE', true); t.takeover = false;
  saveRun(ctx.directory, run, 'TASK_STARTED', { taskId: t.id });
  return t;
}

function report(ctx, run, t, input) {
  identifier(input.reportId);
  identity(t, input);
  requireValue(t.briefHash === createBrief(run, t.id).hash, 'Confirmed brief changed');
  const signature = digest(input);
  if (Object.hasOwn(t.reports, input.reportId)) {
    requireValue(t.reports[input.reportId].signature === signature, 'Report id reused with different content');
    return t.reports[input.reportId].response;
  }
  const next = classifyReport(t, input);
  if (!['DONE', 'DONE_WITH_CONCERNS'].includes(input.kind)) {
    Object.assign(t, next); t.failureCount = (t.failureCount ?? 0) + (input.kind === 'BLOCKED' ? 1 : 0);
    const response = { status: t.status, taskId: t.id, kind: input.kind };
    t.reports[input.reportId] = { signature, response, input: structuredClone(input) };
    saveRun(ctx.directory, run, 'REPORTED', { taskId: t.id, kind: input.kind }); return response;
  }
  resourceCheck(run, t);
  const base = oid(t.worktree, input.base), result = oid(t.worktree, input.result);
  requireValue(ancestor(ctx.repo, base, result) && base !== result, 'Result must contain task commits');
  requireValue(head(t.worktree) === result && clean(t.worktree), 'Result must match clean worktree HEAD');
  const files = git(ctx.repo, ['diff', '--name-only', '--no-renames', '-z', base, result]).split('\0').filter(Boolean);
  const allowed = run.plan.find(x => x.id === t.id).files;
  requireValue(files.every(file => allowed.some(s => file === s || file.startsWith(s + '/'))), 'Result changes files outside task scope');
  const checks = evidence(input.evidence, result);
  Object.assign(t, next, { base, result, evidence: checks });
  const response = { status: t.status, taskId: t.id, result };
  t.reports[input.reportId] = { signature, response, input: structuredClone(input) };
  saveRun(ctx.directory, run, 'REPORTED', { taskId: t.id, reportId: input.reportId });
  return response;
}

async function integrate(ctx, run, t) {
  requireValue(t.status === 'READY', 'Task must be READY');
  requireAgent(t, ['WAITING']);
  requireValue(!Object.values(run.tasks).some(x => x.id !== t.id && ['MERGING', 'MERGED_PENDING_VALIDATION', 'RECOVERY_REQUIRED', 'BLOCKED'].includes(x.status) && x.transaction), 'Previous integration is unresolved');
  resourceCheck(run, t);
  requireValue(clean(ctx.repo) && clean(t.worktree) && head(t.worktree) === t.result, 'Worktree changed after report');
  idle(ctx.repo);
  if (head(ctx.repo) !== t.base) {
    t.status = 'REBASING';
    saveRun(ctx.directory, run, 'REBASE_REQUIRED', { taskId: t.id });
    return { status: 'REBASE_REQUIRED', base: head(ctx.repo) };
  }
  requireValue(ancestor(ctx.repo, t.base, t.result), 'Result ancestry changed');
  const protectUntracked = () => {
    const untracked = git(ctx.repo, ['ls-files', '--others', '-z']).split('\0').filter(Boolean);
    const targetFiles = git(ctx.repo, ['ls-tree', '-r', '--name-only', '-z', t.result]).split('\0').filter(Boolean);
    requireValue(!untracked.some(file => targetFiles.some(target => overlaps(file, target))), 'Untracked/ignored user files collide with task result; preserve them');
  };
  protectUntracked();
  t.transaction = { base: t.base, result: t.result, phase: 'INTENT', oldTree: tree(ctx.repo, t.base), newTree: tree(ctx.repo, t.result) };
  t.status = 'MERGING';
  saveRun(ctx.directory, run, 'MERGE_INTENT', { taskId: t.id });
  const tx = referenceTransaction(ctx.repo);
  let synced = false;
  try {
    await tx.prepare(run.branch, t.base, t.result);
    requireValue(clean(ctx.repo) && git(ctx.repo, ['symbolic-ref', 'HEAD']) === run.branch, 'Target changed while preparing integration');
    protectUntracked();
    git(ctx.repo, ['read-tree', '-m', '-u', t.base, t.result]);
    synced = true;
    requireValue(git(ctx.repo, ['write-tree']) === t.transaction.newTree
      && git(ctx.repo, ['diff-files', '--name-only']) === ''
      && git(ctx.repo, ['ls-files', '--others', '--exclude-standard']) === '', 'User changes during integration');
    t.transaction.phase = 'WORKTREE_SYNCED';
    saveRun(ctx.directory, run, 'WORKTREE_SYNCED', { taskId: t.id });
    requireValue(git(ctx.repo, ['symbolic-ref', 'HEAD']) === run.branch, 'Target checkout changed');
    await tx.commit();
    requireValue(git(ctx.repo, ['symbolic-ref', 'HEAD']) === run.branch && head(ctx.repo) === t.result && clean(ctx.repo), 'Post-transaction verification failed');
    t.status = 'MERGED_PENDING_VALIDATION';
    t.transaction.phase = 'COMMITTED';
    saveRun(ctx.directory, run, 'MERGED', { taskId: t.id });
    return t;
  } catch (error) {
    try { await tx.abort(); } catch { /* Preserve original failure and require recovery below. */ }
    if (!synced && head(ctx.repo) !== t.base && clean(ctx.repo)
      && git(ctx.repo, ['symbolic-ref', 'HEAD']) === run.branch) {
      t.status = 'REBASING'; delete t.transaction;
      saveRun(ctx.directory, run, 'REBASE_REQUIRED', { taskId: t.id });
      return { status: 'REBASE_REQUIRED', base: head(ctx.repo) };
    }
    if (synced && git(ctx.repo, ['symbolic-ref', 'HEAD']) === run.branch && head(ctx.repo) === t.base
      && git(ctx.repo, ['write-tree']) === t.transaction.newTree
      && git(ctx.repo, ['diff-files', '--name-only']) === ''
      && git(ctx.repo, ['ls-files', '--others']) === '') {
      git(ctx.repo, ['read-tree', '-m', '-u', t.result, t.base]);
    }
    t.status = 'RECOVERY_REQUIRED';
    t.error = error.message;
    saveRun(ctx.directory, run, 'MERGE_FAILED', { taskId: t.id, error: error.message });
    throw error;
  }
}

function validateIntegrated(ctx, run, t, input) {
  requireValue(t.status === 'MERGED_PENDING_VALIDATION', 'No integration awaiting validation');
  requireValue(head(ctx.repo) === t.result && clean(ctx.repo), 'Target changed; rerun validation for current version');
  t.integrationEvidence = evidence(input.evidence, t.result);
  t.status = 'CLEANUP_PENDING';
  saveRun(ctx.directory, run, 'INTEGRATION_VALIDATED', { taskId: t.id });
  return t;
}

function cleanup(ctx, run, t, input) {
  if (t.status === 'INTEGRATED') return t;
  requireValue(t.status === 'CLEANUP_PENDING', 'Integration validation required before cleanup');
  requireValue(t.agent && terminal(t.agent.state), 'Terminal host observation required before cleanup');
  requireValue(ancestor(ctx.repo, t.result, head(ctx.repo)), 'Integrated result no longer in target history');
  if (fs.existsSync(t.worktree)) {
    resourceCheck(run, t);
    requireValue(clean(t.worktree) && head(t.worktree) === t.result, 'Task worktree changed; preserve it');
    requireValue(git(t.worktree, ['ls-files', '--others', '-z']) === '', 'Untracked/ignored task files must be preserved before cleanup');
    git(ctx.repo, ['worktree', 'remove', t.worktree]);
  }
  const refs = git(ctx.repo, ['for-each-ref', '--format=%(objectname)', t.branch]);
  if (refs) {
    requireValue(refs === t.result, 'Task branch advanced; preserve it');
    git(ctx.repo, ['update-ref', '-d', t.branch, t.result]);
  }
  t.status = 'INTEGRATED';
  if (Object.values(run.tasks).every(x => x.status === 'INTEGRATED')) run.status = 'REVIEW_REQUIRED';
  saveRun(ctx.directory, run, 'CLEANED', { taskId: t.id });
  return t;
}

function resume(ctx, run) {
  for (const t of Object.values(run.tasks)) {
    if (t.status === 'MERGING' || t.status === 'RECOVERY_REQUIRED') {
      if (t.transaction && head(ctx.repo) === t.transaction.result && clean(ctx.repo)) t.status = 'MERGED_PENDING_VALIDATION';
      else if (t.transaction && head(ctx.repo) === t.transaction.base && clean(ctx.repo)) t.status = 'READY';
      else t.status = 'RECOVERY_REQUIRED';
    }
    if (t.worktree && !['INTEGRATED', 'CLEANUP_PENDING', 'DISPATCHING'].includes(t.status)) {
      try { resourceCheck(run, t); }
      catch (error) { t.error = error.message; t.status = 'RECOVERY_REQUIRED'; }
    }
  }
  return saveRun(ctx.directory, run, 'RESUMED');
}

/** Commands are invoked by agents; this API never creates an agent or calls a model. */
export async function execute(cwd, command, input = {}) {
  const ctx = context(cwd);
  return locked(ctx.directory, async () => {
    if (command === 'preflight') { idle(ctx.repo); return { repo: ctx.repo, clean: clean(ctx.repo), git: git(ctx.repo, ['--version']), node: process.version }; }
    if (command === 'init') return initialize(ctx, input);
    if (command === 'check-plan') return { plan: validateBriefPlan(input.tasks), interfacesChecked: true };
    const run = loadRun(ctx.directory, input.runId);
    checkRun(ctx, run);
    if (run.schema === 1) {
      if (command === 'status' || command === 'resume') return { ...run, upgradeRequired: true, ready: [] };
      requireValue(command === 'upgrade-run', 'Legacy run requires explicit upgrade-run');
      return saveRun(ctx.directory, upgradeRun(ctx.directory, run, input), 'UPGRADED');
    }
    if (command === 'status') return { ...run, ready: readyForRun(run).map(t => t.id) };
    if (command === 'resume') return resume(ctx, run);
    if (command === 'start-task') return start(ctx, run, input);
    if (command === 'finish') {
      requireValue(run.status === 'REVIEW_REQUIRED' && input.reviewMode === 'main-self-review' && input.issuesClosed === true, 'Main review and all tasks must be complete');
      requireValue(clean(ctx.repo), 'Final target must be clean');
      run.finalEvidence = evidence(input.evidence, head(ctx.repo));
      requireValue(typeof input.review === 'string' && input.review.trim(), 'Review disposition required');
      run.review = input.review; run.status = 'DONE'; run.final = head(ctx.repo);
      return saveRun(ctx.directory, run, 'DONE');
    }
    const t = run.tasks[identifier(input.taskId)];
    requireValue(t, 'Unknown leaf task');
    if (command === 'task-brief') return createBrief(run, t.id);
    if (dispatchCommands.has(command)) {
      const next = dispatchCommand(run, t, command, input);
      run.tasks[t.id] = next;
      saveRun(ctx.directory, run, command.toUpperCase(), { taskId: t.id });
      return next;
    }
    if (command === 'report') return report(ctx, run, t, input);
    if (command === 'integrate') return integrate(ctx, run, t);
    if (command === 'rebase-target') return { base: head(ctx.repo), attempt: t.attempt };
    if (command === 'record-validation') return validateIntegrated(ctx, run, t, input);
    if (command === 'cleanup') return cleanup(ctx, run, t, input);
    if (command === 'block') {
      requireValue(t.status !== 'DISPATCHING', 'Dispatch must remain reserved; use dispatch-uncertain/dispatch-failed');
      requireValue(typeof input.reason === 'string' && input.reason.trim(), 'Reason required');
      requireValue(!['INTEGRATED', 'CLEANUP_PENDING'].includes(t.status), 'Cannot block completed task');
      t.status = 'BLOCKED'; t.error = input.reason; t.currentReport = null;
      return saveRun(ctx.directory, run, 'BLOCKED', { taskId: t.id });
    }
    throw new Error('Unknown command');
  }, command === 'resume');
}
