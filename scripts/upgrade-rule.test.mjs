import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { Header } from 'tar';

import {
  createGitDownloadSession,
  createHttpsDownloadSession,
  runGit,
  syncConfiguredItem,
} from './common-download.mjs';
import * as rules from './upgrade-rule.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

const archive = (entries) => gzipSync(Buffer.concat([
  ...entries.flatMap(({ content = '', ...fields }) => {
    const bytes = Buffer.from(content);
    const header = new Header({ type: 'File', mode: 0o644, ...fields, size: bytes.length });
    header.encode();
    return [header.block, bytes, Buffer.alloc((512 - bytes.length % 512) % 512)];
  }),
  Buffer.alloc(1024),
]));

test('rule CLI parses transport and names without a skill-specific flag', () => {
  assert.deepEqual(rules.parseArgs([]), { help: false, git: true, rules: [], groups: [] });
  assert.equal(rules.parseArgs(['--fetch']).git, false);
  assert.deepEqual(rules.parseArgs(['--rule', 'demo', '--rule=other']).rules, ['demo', 'other']);
  assert.throws(() => rules.parseArgs(['--fetch', '--git']), /mutually exclusive/);
  assert.throws(() => rules.parseArgs(['--rule']), /Missing value for --rule/);
  assert.throws(() => rules.parseArgs(['--skill', 'grilling']), /Unknown argument: --skill/);
  assert.deepEqual(rules.RULE_SOURCES, []);
  assert.deepEqual(rules.selectSources(rules.parseArgs([])), []);
  assert.throws(
    () => rules.selectSources(rules.parseArgs(['--rule', 'demo'])),
    /unknown rule\(s\): demo/,
  );
  const help = rules.formatHelp();
  assert.match(help, /node scripts\/upgrade-rule\.mjs/);
  assert.match(help, /--fetch/);
  assert.match(help, /--rule <name>/);
});

test('rule help exits 0 and an empty catalog exits before creating rules/', () => {
  const help = spawnSync(process.execPath, ['scripts/upgrade-rule.mjs', '--help'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /all configured rules are updated/);
  assert.match(help.stdout, /--fetch/);

  const empty = spawnSync(process.execPath, ['scripts/upgrade-rule.mjs'], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  assert.equal(empty.status, 1, empty.stdout);
  assert.match(empty.stderr, /no rules selected/);
  assert.equal(fs.existsSync(path.join(projectRoot, 'rules')), false);
});

test('skill and rule entry points delegate download and reporting', async () => {
  const skill = await fs.promises.readFile(new URL('./upgrade-skill.mjs', import.meta.url), 'utf8');
  const rule = await fs.promises.readFile(new URL('./upgrade-rule.mjs', import.meta.url), 'utf8');
  for (const source of [skill, rule]) {
    assert.match(source, /from '\.\/common-download\.mjs'/);
    assert.match(source, /from '\.\/common-report\.mjs'/);
    assert.doesNotMatch(source, /import\('tar'\)/);
    assert.doesNotMatch(source, /sparse-checkout/);
  }
  assert.match(rule, /requiredFile: null/);
  assert.match(skill, /requiredFile: 'SKILL\.md'/);
});

const demoRule = {
  rule: 'demo',
  repo: 'https://github.com/example/rules',
  path: 'rules/demo',
  ref: 'main',
  groups: [],
};

test('rule archive download copies a directory that has no SKILL.md', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-rule-fetch-'));
  const bytes = archive([{ path: 'rules-main/rules/demo/demo.mdc', content: 'rule body' }]);
  let session;
  try {
    session = await createHttpsDownloadSession([demoRule], {
      root,
      requiredFile: null,
      noun: 'rule',
      nameKey: 'rule',
      fetchImpl: async (url) => {
        assert.equal(url, 'https://github.com/example/rules/archive/refs/heads/main.tar.gz');
        return new Response(bytes);
      },
    });
    await syncConfiguredItem(demoRule, () => {}, {
      rootDir: root,
      nameKey: 'rule',
      noun: 'Rule',
      download: (stagingDir) => session.download(demoRule, stagingDir),
    });
    assert.equal(await fs.promises.readFile(path.join(root, 'demo', 'demo.mdc'), 'utf8'), 'rule body');
    assert.equal(fs.existsSync(path.join(root, 'demo', 'SKILL.md')), false);
  } finally {
    await session?.cleanup();
    await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});

test('rule git download copies a directory that has no SKILL.md', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-rule-git-'));
  const upstream = path.join(root, 'upstream');
  const rulesRoot = path.join(root, 'rules');
  await fs.promises.mkdir(path.join(upstream, 'rules', 'demo'), { recursive: true });
  await fs.promises.writeFile(path.join(upstream, 'rules', 'demo', 'demo.mdc'), 'from git');
  for (const args of [
    ['init', '--initial-branch=main'],
    ['add', '.'],
    ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-m', 'fixture'],
  ]) {
    const result = spawnSync('git', args, { cwd: upstream, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
  let session;
  try {
    session = await createGitDownloadSession([demoRule], {
      root: rulesRoot,
      requiredFile: null,
      noun: 'rule',
      nameKey: 'rule',
      run: (args) => runGit(args.map((arg) =>
        arg === 'https://github.com/example/rules.git' ? upstream : arg)),
    });
    await syncConfiguredItem(demoRule, () => {}, {
      rootDir: rulesRoot,
      nameKey: 'rule',
      noun: 'Rule',
      download: (stagingDir) => session.download(demoRule, stagingDir),
    });
    assert.equal(
      await fs.promises.readFile(path.join(rulesRoot, 'demo', 'demo.mdc'), 'utf8'),
      'from git',
    );
  } finally {
    await session?.cleanup();
    await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});
