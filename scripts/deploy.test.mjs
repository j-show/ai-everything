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

test('custom deployment places existing resources directly under a project path with spaces', (t) => {
  const { root, run } = fixture(t);
  for (const name of ['commands', 'rules']) {
    fs.mkdirSync(path.join(root, name));
    fs.writeFileSync(path.join(root, name, 'example.md'), name);
  }
  const result = run('--project', 'target project', '--custom');
  assert.equal(result.status, 0, result.stderr);
  const target = path.join(root, 'target project');
  for (const name of ['commands', 'rules', 'skills']) {
    assert.equal(fs.realpathSync(path.join(target, name)), fs.realpathSync(path.join(root, name)));
  }
  assert.equal(fs.existsSync(path.join(target, '.cursor')), false);
  assert.equal(run('--project', '--custom', target).status, 0);
});

test('custom deployment merges skills without replacing existing project content', (t) => {
  const { root, run } = fixture(t);
  const target = path.join(root, 'project');
  fs.mkdirSync(path.join(target, 'skills/example'), { recursive: true });
  fs.writeFileSync(path.join(target, 'skills/example/SKILL.md'), 'project-owned');
  fs.mkdirSync(path.join(root, 'skills/another'));
  fs.writeFileSync(path.join(root, 'skills/another/SKILL.md'), 'another skill');
  const result = run('--project', target, '--custom');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(target, 'skills/example/SKILL.md'), 'utf8'), 'project-owned');
  assert.equal(fs.readFileSync(path.join(target, 'skills/another/SKILL.md'), 'utf8'), 'another skill');
  assert.equal(fs.existsSync(path.join(target, 'commands')), false);
  assert.equal(fs.existsSync(path.join(target, 'rules')), false);
});

test('project deployment rejects missing or extra paths and a file as target', (t) => {
  const { root, run } = fixture(t);
  for (const args of [[], ['project', 'extra'], ['--type', 'cursor'], ['--general'], ['--custom'], ['project', '--unknown']]) {
    const result = run('--project', ...args);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /project dir/i);
  }
  fs.writeFileSync(path.join(root, 'file-target'), 'keep');
  assert.notEqual(run('--project', 'file-target').status, 0);
  assert.equal(fs.readFileSync(path.join(root, 'file-target'), 'utf8'), 'keep');
  assert.equal(run('--project', '--help').status, 0);
});

test('existing local Codex deployment still places only skills in .codex', (t) => {
  const { root, run } = fixture(t);
  fs.mkdirSync(path.join(root, 'commands'));
  const result = run('--type', 'codex', '--mode', 'local');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.realpathSync(path.join(root, '.codex/skills')), fs.realpathSync(path.join(root, 'skills')));
  assert.equal(fs.existsSync(path.join(root, '.codex/commands')), false);
});

test('default and explicit general modes deploy into .agents regardless of flag position', (t) => {
  const { root, run } = fixture(t);
  for (const name of ['commands', 'rules']) {
    fs.mkdirSync(path.join(root, name));
    fs.writeFileSync(path.join(root, name, 'example.md'), name);
  }
  for (const args of [['default project'], ['--general', 'first project'], ['second project', '--general']]) {
    const project = args.find((arg) => arg !== '--general');
    const target = path.join(root, project);
    const result = run('--project', ...args);
    assert.equal(result.status, 0, result.stderr);
    for (const name of ['skills', 'commands', 'rules']) {
      assert.equal(fs.realpathSync(path.join(target, '.agents', name)), fs.realpathSync(path.join(root, name)));
      assert.equal(fs.existsSync(path.join(target, name)), false);
    }
    assert.equal(run('--project', ...args).status, 0);
  }
});

test('general mode preserves existing .agents skills while merging new skills', (t) => {
  const { root, run } = fixture(t);
  const target = path.join(root, 'project');
  fs.mkdirSync(path.join(target, '.agents/skills/example'), { recursive: true });
  fs.writeFileSync(path.join(target, '.agents/skills/example/SKILL.md'), 'project-owned');
  fs.mkdirSync(path.join(root, 'skills/another'));
  fs.writeFileSync(path.join(root, 'skills/another/SKILL.md'), 'another skill');
  assert.equal(run('--project', target).status, 0);
  assert.equal(fs.readFileSync(path.join(target, '.agents/skills/example/SKILL.md'), 'utf8'), 'project-owned');
  assert.equal(fs.readFileSync(path.join(target, '.agents/skills/another/SKILL.md'), 'utf8'), 'another skill');
});

test('package exposes deploy:project instead of deploy:current', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.scripts['deploy:project'], 'node scripts/deploy.mjs --project');
  assert.equal(pkg.scripts['deploy:current'], undefined);
});

test('general and custom flags conflict without creating a target directory', (t) => {
  const { root, run } = fixture(t);
  for (const flags of [['--general', '--custom'], ['--custom', '--general']]) {
    const result = run('--project', 'project', ...flags);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /cannot.*together/i);
    assert.equal(fs.existsSync(path.join(root, 'project')), false);
  }
});
