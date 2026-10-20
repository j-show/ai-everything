import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { Header } from 'tar';
import { createHttpsDownloader } from './upgrade-skill.mjs';
import * as upgrade from './upgrade-skill.mjs';

import {
  SKILL_SOURCES,
  cleanupUpgradeWorkDirs,
  formatHelp,
  isUpgradeWorkDirName,
  parseGitHubTreeUrl,
  syncSkillMirror,
  syncSkillsConcurrently,
} from './upgrade-skill.mjs';

test('split sources preserve upstream URLs for help and downloads', () => {
  const expectedUrls = [
    'https://github.com/openai/skills/tree/main/skills/.curated/hatch-pet',
    'https://github.com/sanyuan0704/sanyuan-skills/tree/main/skills/skill-forge',
    'https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling',
    'https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling',
    'https://github.com/anthropics/skills/tree/main/skills/frontend-design',
    'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/main/.claude/skills/ui-ux-pro-max',
    ...[
      'brainstorming', 'test-driven-development', 'systematic-debugging',
      'requesting-code-review', 'receiving-code-review', 'verification-before-completion',
    ].map((skill) => `https://github.com/obra/superpowers/tree/main/skills/${skill}`),
  ];

  const urls = SKILL_SOURCES.map(({ repo, path }) => `${repo}/tree/main/${path}`);
  assert.deepEqual(urls, expectedUrls);
  const help = formatHelp();
  for (const source of SKILL_SOURCES) {
    assert.deepEqual(Object.keys(source), ['skill', 'repo', 'path', 'groups']);
    const url = `${source.repo}/tree/main/${source.path}`;
    assert.ok(help.includes(url), source.skill);
    assert.deepEqual(parseGitHubTreeUrl(url), {
      repositoryUrl: `${source.repo}.git`,
      remotePath: source.path,
      ref: 'main',
    });
  }
});

const noopReporter = {
  start() {},
  detail() {},
  pass() {},
  fail() {},
  finish() {},
};

const exists = async (target) => {
  try {
    await fs.promises.access(target);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

test('isUpgradeWorkDirName matches mkdtemp skill work dirs only', () => {
  assert.equal(isUpgradeWorkDirName('.frontend-design-upgrade-oizzQ5'), true);
  assert.equal(isUpgradeWorkDirName('.grilling-upgrade-ARLKXi'), true);
  assert.equal(isUpgradeWorkDirName('.ui-ux-pro-max-upgrade-nsjsOw'), true);
  assert.equal(isUpgradeWorkDirName('frontend-design'), false);
  assert.equal(isUpgradeWorkDirName('.frontend-design'), false);
  assert.equal(isUpgradeWorkDirName('commit-helper'), false);
});

test('cleanupUpgradeWorkDirs removes leftover upgrade dirs and keeps skills', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-skill-cleanup-'));
  try {
    const leftover = path.join(root, '.frontend-design-upgrade-oizzQ5');
    const skill = path.join(root, 'frontend-design');
    await fs.promises.mkdir(path.join(leftover, 'repository'), { recursive: true });
    await fs.promises.mkdir(skill);
    await fs.promises.writeFile(path.join(skill, 'SKILL.md'), 'keep');

    await cleanupUpgradeWorkDirs(root);

    assert.equal(await exists(leftover), false);
    assert.equal(await exists(path.join(skill, 'SKILL.md')), true);
  } finally {
    await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});

test('syncSkillMirror removes the work dir after a failed download', async () => {
  const parent = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-skill-mirror-'));
  const localDir = path.join(parent, 'frontend-design');
  await fs.promises.mkdir(localDir);
  await fs.promises.writeFile(path.join(localDir, 'SKILL.md'), 'local');

  try {
    await assert.rejects(
      () => syncSkillMirror({
        localDir,
        download: async () => {
          throw new Error('download failed');
        },
      }),
      /download failed/,
    );

    const leftovers = (await fs.promises.readdir(parent))
      .filter((name) => name.startsWith('.frontend-design-upgrade-'));
    assert.deepEqual(leftovers, []);
    assert.equal(
      await fs.promises.readFile(path.join(localDir, 'SKILL.md'), 'utf8'),
      'local',
    );
  } finally {
    await fs.promises.rm(parent, { recursive: true, force: true, maxRetries: 5 });
  }
});

test('syncSkillsConcurrently still cleans leftover dirs after a failed skill', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-skill-sweep-'));
  const leftover = path.join(root, '.grilling-upgrade-ARLKXi');
  await fs.promises.mkdir(path.join(leftover, 'repository'), { recursive: true });

  try {
    await assert.rejects(
      () => syncSkillsConcurrently(
        [{ skill: 'grilling', repo: 'https://github.com/mattpocock/skills', path: 'skills/productivity/grilling', groups: ['grilling'] }],
        async () => {
          throw new Error('network');
        },
        noopReporter,
        { skillsRoot: root },
      ),
      /Upgrade failed/,
    );

    assert.equal(await exists(leftover), false);
  } finally {
    await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});

const sourceUrl = 'https://github.com/example/skills/tree/main/skills/demo';
const member = (name, content = 'demo', extra = {}) => ({
  path: `skills-main/skills/demo/${name}`, content, ...extra,
});
// Build actual gzip/TAR bytes, including malformed members that filesystem packing normalizes.
const archive = (entries) => gzipSync(Buffer.concat([
  ...entries.flatMap(({ content = '', ...fields }) => {
    const bytes = Buffer.from(content);
    const header = new Header({ type: 'File', mode: 0o644, ...fields, size: bytes.length });
    header.encode();
    assert.equal(header.needPax, false, 'fixture header must fit TAR fields');
    return [header.block, bytes, Buffer.alloc((512 - bytes.length % 512) % 512)];
  }),
  Buffer.alloc(1024),
]));
const archiveFetch = (bytes) => async (url, options) => {
  assert.equal(url, 'https://github.com/example/skills/archive/refs/heads/main.tar.gz');
  assert.equal(options.headers?.Authorization, undefined);
  assert.ok(options.signal instanceof AbortSignal);
  return new Response(bytes);
};

test('HTTPS archive extracts only the skill, including nested binary files and empty directories', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-archive-'));
  try {
    const binary = Buffer.from([0, 255, 128, 10]);
    const bytes = archive([
      member('SKILL.md'), member('assets/icon #1.bin', binary),
      member('scripts/run.sh', '#!/bin/sh\n', { mode: 0o755 }),
      member('empty/', '', { type: 'Directory' }),
      { path: 'skills-main/skills/demo-other/SKILL.md', content: 'excluded' },
      { path: 'skills-main/other-link', type: 'SymbolicLink', linkpath: '/outside' },
    ]);
    const stagingDir = path.join(root, 'staging');
    await fs.promises.mkdir(stagingDir);
    await createHttpsDownloader(sourceUrl, { fetchImpl: archiveFetch(bytes) })(stagingDir);
    assert.equal(await fs.promises.readFile(path.join(stagingDir, 'SKILL.md'), 'utf8'), 'demo');
    assert.deepEqual(await fs.promises.readFile(path.join(stagingDir, 'assets/icon #1.bin')), binary);
    assert.deepEqual((await fs.promises.readdir(stagingDir)).sort(), ['SKILL.md', 'assets', 'empty', 'scripts']);
    if (process.platform !== 'win32') {
      assert.ok((await fs.promises.stat(path.join(stagingDir, 'scripts/run.sh'))).mode & 0o111);
    }
    assert.deepEqual(await fs.promises.readdir(root), ['staging']);
  } finally {
    await fs.promises.rm(root, { recursive: true, force: true });
  }
});

for (const [name, bytes, error] of [
  ['missing skill', archive([{ path: 'skills-main/README.md', content: 'other' }]), /Missing.*SKILL.md/i],
  ['path traversal', archive([member('SKILL.md'), member('../escape')]), /Unsafe.*path/i],
  ['Windows path', archive([member('SKILL.md'), member('assets\\escape')]), /Unsafe.*path/i],
  ['symlink', archive([member('SKILL.md'), member('link', '', { type: 'SymbolicLink', linkpath: '/outside' })]), /Unsupported.*entry/i],
  ['hard link', archive([member('SKILL.md'), member('link', '', { type: 'Link', linkpath: 'skills-main/skills/demo/SKILL.md' })]), /Unsupported.*entry/i],
  ['invalid archive', Buffer.from('not a tar archive'), /archive|TAR/i],
  ['truncated gzip', archive([member('SKILL.md')]).subarray(0, -12), /unexpected|truncated|archive|TAR/i],
]) {
  test(`HTTPS archive ${name} preserves local files and cleans partial downloads`, async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-archive-failure-'));
    const localDir = path.join(root, 'demo');
    try {
      await fs.promises.mkdir(localDir);
      await fs.promises.writeFile(path.join(localDir, 'SKILL.md'), 'original');
      await assert.rejects(() => syncSkillMirror({ localDir,
        download: createHttpsDownloader(sourceUrl, { fetchImpl: archiveFetch(bytes) }),
      }), error);
      assert.equal(await fs.promises.readFile(path.join(localDir, 'SKILL.md'), 'utf8'), 'original');
      assert.deepEqual(await fs.promises.readdir(root), ['demo']);
    } finally {
      await fs.promises.rm(root, { recursive: true, force: true });
    }
  });
}

for (const [name, fetchImpl, error] of [
  ['HTTP failure', async () => new Response('missing', { status: 404 }), /HTTP 404/],
  ['interrupted body', async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array([31, 139])); controller.error(new Error('connection lost')); },
  })), /connection lost/],
]) {
  test(`HTTPS archive ${name} preserves existing files`, async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-archive-network-'));
    const localDir = path.join(root, 'demo');
    try {
      await fs.promises.mkdir(localDir);
      await fs.promises.writeFile(path.join(localDir, 'SKILL.md'), 'original');
      await assert.rejects(() => syncSkillMirror({ localDir,
        download: createHttpsDownloader(sourceUrl, { fetchImpl }),
      }), error);
      assert.equal(await fs.promises.readFile(path.join(localDir, 'SKILL.md'), 'utf8'), 'original');
      assert.deepEqual(await fs.promises.readdir(root), ['demo']);
    } finally {
      await fs.promises.rm(root, { recursive: true, force: true });
    }
  });
}

test('HTTPS archive mirror deletes obsolete files and repeat sync reports no changes', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-archive-mirror-'));
  const localDir = path.join(root, 'demo');
  try {
    await fs.promises.mkdir(localDir);
    await fs.promises.writeFile(path.join(localDir, 'SKILL.md'), 'original');
    await fs.promises.writeFile(path.join(localDir, 'obsolete.txt'), 'remove');
    const download = createHttpsDownloader(sourceUrl, { fetchImpl: archiveFetch(archive([member('SKILL.md')])) });
    await syncSkillMirror({ localDir, download });
    assert.equal(await fs.promises.readFile(path.join(localDir, 'SKILL.md'), 'utf8'), 'demo');
    assert.deepEqual(await fs.promises.readdir(localDir), ['SKILL.md']);
    const changes = [];
    await syncSkillMirror({ localDir, download, onDetail: (detail) => changes.push(detail) });
    assert.deepEqual(changes, []);
    assert.deepEqual(await fs.promises.readdir(root), ['demo']);
  } finally {
    await fs.promises.rm(root, { recursive: true, force: true });
  }
});

for (const transportFlag of [undefined, '--fetch', '--git']) {
  const useGit = transportFlag !== '--fetch';
  test(`full upgrade CLI completes every skill using ${transportFlag || 'default Git'}`, async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-cli-'));
    const projectRoot = fileURLToPath(new URL('../', import.meta.url));
    try {
      await fs.promises.mkdir(path.join(root, 'scripts'));
      for (const name of ['upgrade-skill.mjs', 'upgrade-skill-reporter.mjs']) {
        await fs.promises.copyFile(path.join(projectRoot, 'scripts', name), path.join(root, 'scripts', name));
      }
      await fs.promises.symlink(path.join(projectRoot, 'node_modules'), path.join(root, 'node_modules'),
        process.platform === 'win32' ? 'junction' : 'dir');
      const bytes = archive(SKILL_SOURCES.map((source) => ({
        path: `repository-main/${source.path}/SKILL.md`, content: `fixture ${source.skill}`,
      })));
      const preload = path.join(root, 'offline-fetch.mjs');
      await fs.promises.writeFile(preload, `
        globalThis.fetch = async (url) => {
          if (new URL(url).hostname !== 'github.com' || !url.endsWith('/archive/refs/heads/main.tar.gz')) {
            throw new Error('Unexpected network request: ' + url);
          }
          return new Response(Buffer.from('${bytes.toString('base64')}', 'base64'));
        };
      `);
      if (useGit) {
        const upstream = path.join(root, 'upstream');
        await fs.promises.mkdir(upstream);
        for (const source of SKILL_SOURCES) {
          const directory = path.join(upstream, ...source.path.split('/'));
          await fs.promises.mkdir(directory, { recursive: true });
          await fs.promises.writeFile(path.join(directory, 'SKILL.md'), 'fixture ' + source.skill);
        }
        for (const args of [
          ['init', '--initial-branch=main'], ['add', '.'],
          ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-m', 'fixture'],
        ]) {
          const result = spawnSync('git', args, { cwd: upstream, encoding: 'utf8' });
          assert.equal(result.status, 0, result.stderr);
        }
        await fs.promises.writeFile(preload, `
          import childProcess from 'node:child_process';
          import { syncBuiltinESMExports } from 'node:module';
          import { pathToFileURL } from 'node:url';
          const spawn = childProcess.spawn;
          childProcess.spawn = (command, args, options) => {
            if (command !== 'git') throw new Error('Unexpected executable: ' + command);
            const mapped = args.map(value => value.startsWith('https://github.com/')
              ? pathToFileURL(${JSON.stringify(upstream)}).href : value);
            return spawn(command, mapped, options);
          };
          syncBuiltinESMExports();
          globalThis.fetch = () => { throw new Error('Git mode must not use fetch'); };
        `);
      }
      const result = spawnSync(process.execPath, ['--import', './offline-fetch.mjs', 'scripts/upgrade-skill.mjs', ...(transportFlag ? [transportFlag] : [])], {
        cwd: root, encoding: 'utf8', timeout: 30_000,
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.match(result.stdout, /Upgrade skills done/);
      for (const source of SKILL_SOURCES) {
        assert.ok(result.stdout.includes(`[${source.skill}] RUN  github.com/`));
        assert.ok(result.stdout.includes(`[${source.skill}] PASS`));
        assert.equal(await fs.promises.readFile(path.join(root, 'skills', source.skill, 'SKILL.md'), 'utf8'),
          `fixture ${source.skill}`);
      }
      assert.equal((await fs.promises.readdir(path.join(root, 'skills'))).length, SKILL_SOURCES.length);
    } finally {
      await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });

}

test('--git selects transport independently of skill/group selection and argument order', () => {
  assert.deepEqual(upgrade.parseArgs([]), { help: false, git: true, skills: [], groups: [] });
  for (const args of [['--git', '--design'], ['--design', '--git']]) {
    const parsed = upgrade.parseArgs(args);
    assert.equal(parsed.git, true);
    assert.deepEqual(upgrade.selectSources(parsed).map(source => source.skill), ['frontend-design', 'ui-ux-pro-max']);
  }
  const parsed = upgrade.parseArgs(['--git', '--design', '--skill', 'grilling']);
  assert.equal(parsed.git, true);
  assert.deepEqual(upgrade.selectSources(parsed).map(source => source.skill), ['grilling']);
});

test('Git download failure leaves local content intact without switching transport', async () => {
  assert.equal(typeof upgrade.createGitSparseDownloader, 'function');
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-git-failure-'));
  const localDir = path.join(root, 'demo');
  try {
    await fs.promises.mkdir(localDir);
    await fs.promises.writeFile(path.join(localDir, 'SKILL.md'), 'original');
    const download = upgrade.createGitSparseDownloader(sourceUrl, {
      run: async () => { throw new Error('Git clone failed: fixture'); },
    });
    await assert.rejects(() => syncSkillMirror({ localDir, download }), /Git clone failed/);
    assert.equal(await fs.promises.readFile(path.join(localDir, 'SKILL.md'), 'utf8'), 'original');
    assert.deepEqual(await fs.promises.readdir(root), ['demo']);
  } finally {
    await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});

test('Git runner reports missing executable with installation guidance', async () => {
  await assert.rejects(() => upgrade.runGit(['--version'], {
    spawnImpl: (_command, args, options) => spawn('upgrade-test-missing-git-executable', args, options),
  }), /Git executable not found; install Git/);
});

test('Git runner rejects nonzero exit with Git diagnostics', async () => {
  await assert.rejects(() => upgrade.runGit(['--upgrade-test-invalid-option']),
    /Git --upgrade-test-invalid-option failed with exit code \d+:.*unknown option/s);
});

test('--fetch overrides the Git default and preserves skill selection', () => {
  assert.deepEqual(upgrade.parseArgs(['--git']), upgrade.parseArgs([]));
  assert.equal(upgrade.parseArgs(['--fetch']).git, false);
  for (const args of [['--fetch', '--design'], ['--design', '--fetch']]) {
    const parsed = upgrade.parseArgs(args);
    assert.equal(parsed.git, false);
    assert.deepEqual(upgrade.selectSources(parsed).map(source => source.skill), ['frontend-design', 'ui-ux-pro-max']);
  }
  assert.deepEqual(upgrade.parseArgs(['--fetch', '--skill', 'grilling']),
    { ...upgrade.parseArgs(['--skill', 'grilling']), git: false });
});

test('--fetch and --git are mutually exclusive regardless of order', () => {
  for (const args of [['--fetch', '--git'], ['--git', '--fetch']]) {
    assert.throws(() => upgrade.parseArgs(args), /--fetch.*--git.*mutually exclusive/);
  }
  assert.deepEqual(upgrade.parseArgs(['--fetch', '--fetch']), upgrade.parseArgs(['--fetch']));
});
