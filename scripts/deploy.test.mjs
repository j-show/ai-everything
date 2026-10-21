import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const sourceScript = fileURLToPath(new URL('./deploy.mjs', import.meta.url));

/** 用隔离资源测试真实 CLI，避免部署或清理触及用户的 harness 目录。 */
const fixture = (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-project-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scripts'));
  const script = path.join(root, 'scripts/deploy.mjs');
  fs.copyFileSync(sourceScript, script);
  fs.mkdirSync(path.join(root, 'skills/example'), { recursive: true });
  fs.writeFileSync(path.join(root, 'skills/example/SKILL.md'), 'fixture skill');
  return {
    root,
    run: (...args) => spawnSync(process.execPath, [script, ...args], {
      cwd: root,
      encoding: 'utf8',
    }),
  };
};

test('project deployment places existing resources directly under a project path with spaces', (t) => {
  const { root, run } = fixture(t);
  for (const name of ['commands', 'rules']) {
    fs.mkdirSync(path.join(root, name));
    fs.writeFileSync(path.join(root, name, 'example.md'), name);
  }
  const result = run('-t', 'project', 'target project');
  assert.equal(result.status, 0, result.stderr);
  const target = path.join(root, 'target project');
  for (const name of ['commands', 'rules', 'skills']) {
    assert.equal(fs.realpathSync(path.join(target, name)), fs.realpathSync(path.join(root, name)));
    assert.equal(fs.existsSync(path.join(target, '.agents', name)), false);
  }
  assert.equal(fs.existsSync(path.join(target, '.cursor')), false);
  assert.equal(run('-t', 'project', target).status, 0);
});

test('project deployment merges skills without replacing existing project content', (t) => {
  const { root, run } = fixture(t);
  const target = path.join(root, 'project');
  fs.mkdirSync(path.join(target, 'skills/example'), { recursive: true });
  fs.writeFileSync(path.join(target, 'skills/example/SKILL.md'), 'project-owned');
  fs.mkdirSync(path.join(root, 'skills/another'));
  fs.writeFileSync(path.join(root, 'skills/another/SKILL.md'), 'another skill');
  const result = run('-t', 'project', target);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(target, 'skills/example/SKILL.md'), 'utf8'), 'project-owned');
  assert.equal(fs.readFileSync(path.join(target, 'skills/another/SKILL.md'), 'utf8'), 'another skill');
  assert.equal(fs.existsSync(path.join(target, 'commands')), false);
  assert.equal(fs.existsSync(path.join(target, 'rules')), false);
  assert.equal(fs.existsSync(path.join(target, '.agents')), false);
});

test('project deployment rejects missing or extra paths, removed flags, and a file as target', (t) => {
  const { root, run } = fixture(t);
  for (const args of [[], ['project', 'extra']]) {
    const result = run('-t', 'project', ...args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /project dir/i);
  }
  for (const flag of ['--general', '--custom']) {
    const result = run('-t', 'project', 'project', flag);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unknown argument/i);
    assert.equal(fs.existsSync(path.join(root, 'project')), false);
  }
  const repeatedType = run('-t', 'project', '--type', 'cursor');
  assert.notEqual(repeatedType.status, 0);
  assert.match(repeatedType.stderr, /specified once/i);
  const unknown = run('-t', 'project', 'project', '--unknown');
  assert.notEqual(unknown.status, 0);
  assert.match(unknown.stderr, /unknown argument/i);
  fs.writeFileSync(path.join(root, 'file-target'), 'keep');
  const fileResult = run('-t', 'project', 'file-target');
  assert.notEqual(fileResult.status, 0);
  assert.match(fileResult.stderr, /not a directory/i);
  assert.equal(fs.readFileSync(path.join(root, 'file-target'), 'utf8'), 'keep');
  assert.equal(run('-t', 'project', '--help').status, 0);
});

test('existing local Codex deployment still places only skills in .codex', (t) => {
  const { root, run } = fixture(t);
  fs.mkdirSync(path.join(root, 'commands'));
  const result = run('--type', 'codex', '--mode', 'local');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.realpathSync(path.join(root, '.codex/skills')), fs.realpathSync(path.join(root, 'skills')));
  assert.equal(fs.existsSync(path.join(root, '.codex/commands')), false);
});

test('npm-shaped project invocation links resources directly under the project directory', (t) => {
  const { root } = fixture(t);
  const script = path.join(root, 'scripts/deploy.mjs');
  const target = path.join(root, 'target project');
  const invoke = () => spawnSync(process.execPath, [script, 'project', target], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, npm_config_t: 'true' },
  });
  const result = invoke();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.realpathSync(path.join(target, 'skills')), fs.realpathSync(path.join(root, 'skills')));
  assert.equal(fs.existsSync(path.join(target, '.agents')), false);
  assert.equal(invoke().status, 0);
});

test('package exposes deploy:project and deploy:agent', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts['deploy:project'], 'npm run deploy -t project');
  assert.equal(pkg.scripts['deploy:agent'], 'npm run deploy -t agent');
  assert.equal(pkg.scripts['deploy:current'], undefined);
});

const addFileResources = (root) => {
  for (const name of ['commands', 'rules']) {
    fs.mkdirSync(path.join(root, name));
    fs.writeFileSync(path.join(root, name, 'example.md'), name);
  }
};

test('agent local mode links resources under .agents and repeats cleanly', (t) => {
  const { root, run } = fixture(t);
  addFileResources(root);
  const result = run('-t', 'agent', '--mode', 'local');
  assert.equal(result.status, 0, result.stderr);
  for (const name of ['skills', 'commands', 'rules']) {
    assert.equal(fs.realpathSync(path.join(root, '.agents', name)), fs.realpathSync(path.join(root, name)));
  }
  assert.equal(run('-t', 'agent', '--mode', 'local').status, 0);
});

test('agent user mode links into the home .agents directory and keeps existing skills', (t) => {
  const { root } = fixture(t);
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-agent-home-'));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const env = { ...process.env, USERPROFILE: home, HOME: home };
  const probe = spawnSync(process.execPath, ['-e', 'process.stdout.write(require("node:os").homedir())'], {
    env,
    encoding: 'utf8',
  });
  assert.equal(path.resolve(probe.stdout), path.resolve(home));
  addFileResources(root);
  fs.mkdirSync(path.join(home, '.agents/skills/example'), { recursive: true });
  fs.writeFileSync(path.join(home, '.agents/skills/example/SKILL.md'), 'user-owned');
  fs.mkdirSync(path.join(root, 'skills/another'));
  fs.writeFileSync(path.join(root, 'skills/another/SKILL.md'), 'another skill');
  const script = path.join(root, 'scripts/deploy.mjs');
  const run = () => spawnSync(process.execPath, [script, '--type', 'agent'], {
    cwd: root,
    env,
    encoding: 'utf8',
  });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const target = path.join(home, '.agents');
  assert.ok(result.stdout.includes(`Target:  ${target}`));
  assert.equal(fs.readFileSync(path.join(target, 'skills/example/SKILL.md'), 'utf8'), 'user-owned');
  assert.equal(fs.readFileSync(path.join(target, 'skills/another/SKILL.md'), 'utf8'), 'another skill');
  for (const name of ['commands', 'rules']) {
    assert.equal(fs.realpathSync(path.join(target, name)), fs.realpathSync(path.join(root, name)));
  }
  assert.equal(fs.existsSync(path.join(root, '.agents')), false);
  assert.equal(run().status, 0);
});
