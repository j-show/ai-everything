#!/usr/bin/env node
import fs from 'node:fs';
import { execute } from './runtime.mjs';

const commands = ['preflight', 'check-plan', 'init', 'status', 'task-brief', 'reserve-task', 'bind-agent', 'dispatch-failed', 'dispatch-uncertain', 'agent-observation', 'heartbeat', 'resume-task', 'resolve-report', 'upgrade-run', 'retire-agent', 'start-task', 'report', 'rebase-target', 'integrate', 'record-validation', 'cleanup', 'block', 'retry', 'resume', 'finish'];
try {
  const [command, repo, inputFile, ...extra] = process.argv.slice(2);
  if (command === '--help') {
    process.stdout.write(`Usage: node orchestrator.mjs <command> <repo> [input.json]\nCommands: ${commands.join(', ')}\nJSON input from file or stdin. No model calls or automatic agent spawning.\n`);
  } else {
    if (!commands.includes(command) || !repo || extra.length) throw new Error('Invalid arguments; use --help');
    const input = inputFile ? fs.readFileSync(inputFile, 'utf8') : fs.readFileSync(0, 'utf8');
    const result = await execute(repo, command, input.trim() ? JSON.parse(input) : {});
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    if (result.status === 'REBASE_REQUIRED') process.exitCode = 2;
  }
} catch (error) {
  process.stderr.write(JSON.stringify({ status: 'BLOCKED', error: error.message }) + '\n');
  process.exitCode = 1;
}
