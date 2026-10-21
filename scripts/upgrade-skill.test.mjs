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
  syncSkillMirror,
  syncSkillsConcurrently,
} from './upgrade-skill.mjs';

test('configured sources carry a branch ref and help shows the tree URL', () => {
  const expectedUrls = [
    'https://github.com/openai/skills/tree/main/skills/.curated/hatch-pet',
    'https://github.com/sanyuan0704/sanyuan-skills/tree/main/skills/skill-forge',
    'https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling',
    'https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling',
    'https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-for-agents',
    'https://github.com/anthropics/skills/tree/main/skills/frontend-design',
    'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/main/.claude/skills/ui-ux-pro-max',
    ...[
      'brainstorming', 'writing-plans', 'test-driven-development', 'systematic-debugging',
      'requesting-code-review', 'receiving-code-review', 'verification-before-completion',
    ].map((skill) => `https://github.com/obra/superpowers/tree/main/skills/${skill}`),
  ];

  const urls = SKILL_SOURCES.map(({ repo, path, ref }) => `${repo}/tree/${ref}/${path}`);
  assert.deepEqual(urls, expectedUrls);
  const help = formatHelp();
  for (const source of SKILL_SOURCES) {
    assert.deepEqual(Object.keys(source), ['skill', 'repo', 'ref', 'path', 'groups']);
    assert.ok(help.includes(`${source.repo}/tree/${source.ref}/${source.path}`), source.skill);
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

test('superpower post-processing normalizes nested Markdown before comparison and is repeatable', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-postprocess-'));
  const localDir = path.join(root, 'demo');
  const source = { groups: ['other', 'superpower'] };
  const download = async (stagingDir) => {
    await fs.promises.mkdir(path.join(stagingDir, 'references'));
    for (const [name, content] of [
      ['SKILL.md', 'use superpowers:one and superpowers:two\r\n中文'],
      ['references/guide.md', '[superpowers:three](superpowers:four)'],
      ['references/plain.md', 'unchanged\n'],
      ['script.txt', 'superpowers:keep'],
    ]) await fs.promises.writeFile(path.join(stagingDir, name), content);
  };
  try {
    const options = { localDir, download,
      postProcess: (dir) => upgrade.postProcessSkill(dir, source) };
    await syncSkillMirror(options);
    assert.equal(await fs.promises.readFile(path.join(localDir, 'SKILL.md'), 'utf8'),
      'use one and two\r\n中文');
    assert.equal(await fs.promises.readFile(path.join(localDir, 'references/guide.md'), 'utf8'),
      '[three](four)');
    assert.equal(await fs.promises.readFile(path.join(localDir, 'references/plain.md'), 'utf8'), 'unchanged\n');
    assert.equal(await fs.promises.readFile(path.join(localDir, 'script.txt'), 'utf8'), 'superpowers:keep');
    const changes = [];
    await syncSkillMirror({ ...options, onDetail: (detail) => changes.push(detail) });
    assert.deepEqual(changes, []);

    await syncSkillMirror({ ...options,
      postProcess: (dir) => upgrade.postProcessSkill(dir, { groups: ['other'] }) });
    assert.equal(await fs.promises.readFile(path.join(localDir, 'SKILL.md'), 'utf8'),
      'use superpowers:one and superpowers:two\r\n中文');

    await assert.rejects(() => syncSkillMirror({ ...options,
      postProcess: async () => { throw new Error('post-process failed'); } }), /post-process failed/);
    assert.equal(await fs.promises.readFile(path.join(localDir, 'SKILL.md'), 'utf8'),
      'use superpowers:one and superpowers:two\r\n中文');
    assert.deepEqual(await fs.promises.readdir(root), ['demo']);
  } finally {
    await fs.promises.rm(root, { recursive: true, force: true });
  }
});

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

const demoSource = {
  repo: 'https://github.com/example/skills',
  path: 'skills/demo',
  ref: 'main',
};
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
    await createHttpsDownloader(demoSource, { fetchImpl: archiveFetch(bytes) })(stagingDir);
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
        download: createHttpsDownloader(demoSource, { fetchImpl: archiveFetch(bytes) }),
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
        download: createHttpsDownloader(demoSource, { fetchImpl }),
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
    const download = createHttpsDownloader(demoSource, { fetchImpl: archiveFetch(archive([member('SKILL.md')])) });
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
        path: `repository-main/${source.path}/SKILL.md`, content: `fixture superpowers:${source.skill}`,
      })));
      const preload = path.join(root, 'offline-fetch.mjs');
      await fs.promises.writeFile(preload, `
        import fs from 'node:fs';
        globalThis.fetch = async (url) => {
          if (new URL(url).hostname !== 'github.com' || !url.includes('/archive/refs/heads/')) {
            throw new Error('Unexpected network request: ' + url);
          }
          fs.appendFileSync('fetch-calls.jsonl', JSON.stringify(url) + '\\n');
          return new Response(Buffer.from('${bytes.toString('base64')}', 'base64'));
        };
      `);
      if (useGit) {
        const upstream = path.join(root, 'upstream');
        await fs.promises.mkdir(upstream);
        for (const source of SKILL_SOURCES) {
          const directory = path.join(upstream, ...source.path.split('/'));
          await fs.promises.mkdir(directory, { recursive: true });
          await fs.promises.writeFile(path.join(directory, 'SKILL.md'), 'fixture superpowers:' + source.skill);
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
          import fs from 'node:fs';
          import { syncBuiltinESMExports } from 'node:module';
          import { pathToFileURL } from 'node:url';
          const spawn = childProcess.spawn;
          childProcess.spawn = (command, args, options) => {
            if (command !== 'git') throw new Error('Unexpected executable: ' + command);
            fs.appendFileSync('git-calls.jsonl', JSON.stringify(args) + '\\n');
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
      const repositories = [...new Map(SKILL_SOURCES.map((source) => [`${source.repo}\0${source.ref}`, source])).values()];
      if (useGit) {
        const calls = (await fs.promises.readFile(path.join(root, 'git-calls.jsonl'), 'utf8'))
          .trim().split('\n').map(line => JSON.parse(line));
        const clones = calls.filter(args => args[0] === 'clone');
        assert.equal(clones.length, repositories.length, 'clone each repository exactly once');
        for (const source of repositories) {
          const matching = clones.filter(args => args.includes(source.repo + '.git') && args.includes(source.ref));
          assert.equal(matching.length, 1, `${source.repo}@${source.ref}`);
          const checkout = calls.find(args => args[0] === '-C' && args[1] === matching[0].at(-1));
          assert.ok(checkout, source.repo);
          for (const peer of SKILL_SOURCES.filter(peer => peer.repo === source.repo && peer.ref === source.ref)) {
            assert.ok(checkout.includes(peer.path), peer.path);
          }
        }
      } else {
        const fetches = (await fs.promises.readFile(path.join(root, 'fetch-calls.jsonl'), 'utf8'))
          .trim().split('\n').map(line => JSON.parse(line));
        assert.equal(fetches.length, repositories.length, 'fetch each repository archive exactly once');
        for (const source of repositories) {
          const archiveUrl = `${source.repo}/archive/refs/heads/${encodeURIComponent(source.ref)}.tar.gz`;
          assert.equal(fetches.filter(url => url === archiveUrl).length, 1, `${source.repo}@${source.ref}`);
        }
      }
      for (const source of SKILL_SOURCES) {
        assert.ok(result.stdout.includes(`[${source.skill}] RUN  github.com/`));
        assert.ok(result.stdout.includes(`[${source.skill}] PASS`));
        assert.equal(await fs.promises.readFile(path.join(root, 'skills', source.skill, 'SKILL.md'), 'utf8'),
          source.groups.includes('superpower') ? `fixture ${source.skill}` : `fixture superpowers:${source.skill}`);
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
    const download = upgrade.createGitSparseDownloader(demoSource, {
      run: async () => { throw new Error('Git clone failed: fixture'); },
    });
    await assert.rejects(() => syncSkillMirror({ localDir, download }), /Git clone failed/);
    assert.equal(await fs.promises.readFile(path.join(localDir, 'SKILL.md'), 'utf8'), 'original');
    assert.deepEqual(await fs.promises.readdir(root), ['demo']);
  } finally {
    await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});

const sharedPeerSources = (...skills) => skills.map(skill => ({
  skill, repo: 'https://github.com/example/shared', path: `skills/${skill}`, ref: 'main', groups: [],
}));

test('shared HTTPS archive download fetches each repository once and extracts peers', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-shared-fetch-'));
  const sources = sharedPeerSources('one', 'two');
  const bytes = archive([
    { path: 'shared-main/skills/one/SKILL.md', content: 'downloaded one' },
    { path: 'shared-main/skills/two/SKILL.md', content: 'downloaded two' },
  ]);
  let attempts = 0;
  let session;
  try {
    session = await upgrade.createHttpsDownloadSession(sources, {
      root,
      fetchImpl: async (url, options) => {
        attempts++;
        assert.equal(url, 'https://github.com/example/shared/archive/refs/heads/main.tar.gz');
        assert.ok(options.signal instanceof AbortSignal);
        return new Response(bytes);
      },
    });
    const results = await Promise.all(sources.map(source => syncSkillMirror({
      localDir: path.join(root, source.skill),
      download: dir => session.download(source, dir),
    })));
    assert.equal(attempts, 1);
    assert.equal(results.length, 2);
    await session.cleanup();
    assert.equal(await fs.promises.readFile(path.join(root, 'one', 'SKILL.md'), 'utf8'), 'downloaded one');
    assert.equal(await fs.promises.readFile(path.join(root, 'two', 'SKILL.md'), 'utf8'), 'downloaded two');
    assert.deepEqual((await fs.promises.readdir(root)).sort(), ['one', 'two']);
  } finally {
    await session?.cleanup();
    await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});

for (const [label, createSession, failureMessage] of [
  ['HTTPS archive', (sources, root, attempts) => upgrade.createHttpsDownloadSession(sources, {
    root,
    fetchImpl: async () => {
      attempts.value++;
      throw new Error('shared archive failed');
    },
  }), /shared archive failed/],
  ['Git clone', (sources, root, attempts) => upgrade.createGitDownloadSession(sources, {
    root,
    run: async () => {
      attempts.value++;
      throw new Error('shared clone failed');
    },
  }), /shared clone failed/],
]) {
  test(`shared ${label} failure preserves all peer skills and is not retried`, async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-shared-failure-'));
    const sources = sharedPeerSources('one', 'two');
    const attempts = { value: 0 };
    let session;
    try {
      session = await createSession(sources, root, attempts);
      for (const source of sources) {
        await fs.promises.mkdir(path.join(root, source.skill));
        await fs.promises.writeFile(path.join(root, source.skill, 'SKILL.md'), 'original ' + source.skill);
      }
      const results = await Promise.allSettled(sources.map(source => syncSkillMirror({
        localDir: path.join(root, source.skill),
        download: dir => session.download(source, dir),
      })));
      for (const result of results) {
        assert.equal(result.status, 'rejected');
        assert.match(result.reason.message, failureMessage);
      }
      await assert.rejects(() => syncSkillMirror({ localDir: path.join(root, 'one'),
        download: dir => session.download(sources[0], dir) }), failureMessage);
      assert.equal(attempts.value, 1);
      await session.cleanup();
      for (const source of sources) {
        assert.equal(await fs.promises.readFile(path.join(root, source.skill, 'SKILL.md'), 'utf8'),
          'original ' + source.skill);
      }
      assert.deepEqual((await fs.promises.readdir(root)).sort(), ['one', 'two']);
    } finally {
      await session?.cleanup();
      await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });
}

for (const [label, prepareSession] of [
  ['HTTPS archive', async (sources, skillRoot) => {
    const bytes = archive([{ path: 'shared-main/skills/valid/SKILL.md', content: 'downloaded' }]);
    return upgrade.createHttpsDownloadSession(sources, {
      root: skillRoot,
      fetchImpl: async () => new Response(bytes),
    });
  }],
  ['Git checkout', async (sources, skillRoot, root) => {
    const upstream = path.join(root, 'upstream');
    await fs.promises.mkdir(path.join(upstream, 'skills', 'valid'), { recursive: true });
    await fs.promises.writeFile(path.join(upstream, 'skills', 'valid', 'SKILL.md'), 'downloaded');
    for (const args of [
      ['init', '--initial-branch=main'], ['add', '.'],
      ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-m', 'fixture'],
    ]) {
      const result = spawnSync('git', args, { cwd: upstream, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    }
    return upgrade.createGitDownloadSession(sources, {
      root: skillRoot,
      run: args => upgrade.runGit(args.map(arg =>
        arg === 'https://github.com/example/shared.git' ? upstream : arg)),
    });
  }],
]) {
  test(`missing skill in shared ${label} preserves its local files while a valid peer succeeds`, async () => {
    const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-shared-missing-'));
    const skillRoot = path.join(root, 'skills');
    const sources = sharedPeerSources('valid', 'missing');
    let session;
    try {
      await fs.promises.mkdir(path.join(skillRoot, 'missing'), { recursive: true });
      await fs.promises.writeFile(path.join(skillRoot, 'missing', 'SKILL.md'), 'original');
      session = await prepareSession(sources, skillRoot, root);
      const results = await Promise.allSettled(sources.map(source => syncSkillMirror({
        localDir: path.join(skillRoot, source.skill), download: dir => session.download(source, dir),
      })));
      assert.equal(results[0].status, 'fulfilled');
      assert.equal(results[1].status, 'rejected');
      assert.match(results[1].reason.message, /Missing upstream SKILL.md: skills\/missing/);
      await session.cleanup();
      assert.equal(await fs.promises.readFile(path.join(skillRoot, 'valid', 'SKILL.md'), 'utf8'), 'downloaded');
      assert.equal(await fs.promises.readFile(path.join(skillRoot, 'missing', 'SKILL.md'), 'utf8'), 'original');
      assert.deepEqual((await fs.promises.readdir(skillRoot)).sort(), ['missing', 'valid']);
    } finally {
      await session?.cleanup();
      await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
    }
  });
}

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

test('git and help do not load tar; fetch reports a missing tar package', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-no-tar-'));
  const scriptsDir = path.join(root, 'scripts');
  const scriptUrl = new URL('./upgrade-skill.mjs', import.meta.url);
  await fs.promises.mkdir(scriptsDir);
  await fs.promises.copyFile(fileURLToPath(scriptUrl), path.join(scriptsDir, 'upgrade-skill.mjs'));
  await fs.promises.copyFile(
    fileURLToPath(new URL('./upgrade-skill-reporter.mjs', import.meta.url)),
    path.join(scriptsDir, 'upgrade-skill-reporter.mjs'),
  );
  await fs.promises.writeFile(path.join(root, 'hide-tar-hook.mjs'), `
    export async function resolve(specifier, context, nextResolve) {
      if (specifier === 'tar') {
        const error = new Error("Cannot find package 'tar'");
        error.code = 'ERR_MODULE_NOT_FOUND';
        throw error;
      }
      return nextResolve(specifier, context);
    }
  `);
  await fs.promises.writeFile(path.join(root, 'register-hide-tar.mjs'), `
    import { register } from 'node:module';
    register('./hide-tar-hook.mjs', import.meta.url);
  `);
  const stage = path.join(root, 'stage');
  await fs.promises.writeFile(path.join(root, 'git-only.mjs'), `
    import { createGitSparseDownloader } from './scripts/upgrade-skill.mjs';
    const download = createGitSparseDownloader({
      repo: 'https://github.com/example/skills',
      path: 'skills/demo',
      ref: 'main',
    }, { run: async () => { throw new Error('git invoked'); } });
    try {
      await download(${JSON.stringify(stage)});
      throw new Error('git was not invoked');
    } catch (error) {
      if (!String(error?.message).includes('git invoked')) throw error;
    }
  `);
  await fs.promises.writeFile(path.join(root, 'fetch-only.mjs'), `
    import { createHttpsDownloader } from './scripts/upgrade-skill.mjs';
    const download = createHttpsDownloader({
      repo: 'https://github.com/example/skills',
      path: 'skills/demo',
      ref: 'main',
    }, { fetchImpl: async () => new Response(Uint8Array.from([1])) });
    await download(${JSON.stringify(stage)});
  `);
  const node = (args) => spawnSync(process.execPath, ['--import', './register-hide-tar.mjs', ...args], {
    cwd: root, encoding: 'utf8',
  });
  try {
    const help = node(['scripts/upgrade-skill.mjs', '--help']);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /--fetch/);
    const git = node(['git-only.mjs']);
    assert.equal(git.status, 0, git.stderr);
    const fetched = node(['fetch-only.mjs']);
    assert.notEqual(fetched.status, 0);
    assert.match(fetched.stderr, /Missing tar package/);
  } finally {
    await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});

test('download sessions keep the same repository on different refs apart', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-ref-split-'));
  const sources = [
    { skill: 'one', repo: 'https://github.com/example/shared', path: 'skills/one', ref: 'main', groups: [] },
    { skill: 'two', repo: 'https://github.com/example/shared', path: 'skills/two', ref: 'release', groups: [] },
  ];
  const urls = [];
  let session;
  try {
    session = await upgrade.createHttpsDownloadSession(sources, {
      root,
      fetchImpl: async (url) => {
        urls.push(url);
        const ref = url.includes('/heads/release.tar.gz') ? 'release' : 'main';
        const skill = ref === 'main' ? 'one' : 'two';
        return new Response(archive([{
          path: `shared-${ref}/skills/${skill}/SKILL.md`,
          content: skill,
        }]));
      },
    });
    for (const source of sources) {
      const stagingDir = path.join(root, source.skill);
      await fs.promises.mkdir(stagingDir);
      await session.download(source, stagingDir);
      assert.equal(await fs.promises.readFile(path.join(stagingDir, 'SKILL.md'), 'utf8'), source.skill);
    }
    assert.deepEqual(urls.sort(), [
      'https://github.com/example/shared/archive/refs/heads/main.tar.gz',
      'https://github.com/example/shared/archive/refs/heads/release.tar.gz',
    ]);
    const workDirs = (await fs.promises.readdir(root)).filter((name) => name.startsWith('.archives-upgrade-'));
    assert.equal(workDirs.length, 1);
    assert.deepEqual(
      (await fs.promises.readdir(path.join(root, workDirs[0]))).sort(),
      ['example-shared', 'example-shared-release'],
    );
  } finally {
    await session?.cleanup();
    await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});

test('repository work dir names use owner-repo rather than skill or numeric ids', () => {
  assert.equal(
    upgrade.repositoryWorkDirName({
      repositoryUrl: 'https://github.com/obra/superpowers.git',
      ref: 'main',
    }),
    'obra-superpowers',
  );
  assert.equal(
    upgrade.repositoryWorkDirName({
      repositoryUrl: 'https://github.com/example/shared.git',
      ref: 'feature/x',
    }),
    'example-shared-feature-x',
  );
});

test('shared download session materializes under a repository-named work dir', async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'upgrade-repo-workdir-'));
  const sources = sharedPeerSources('one', 'two');
  const bytes = archive([
    { path: 'shared-main/skills/one/SKILL.md', content: 'one' },
    { path: 'shared-main/skills/two/SKILL.md', content: 'two' },
  ]);
  let session;
  try {
    session = await upgrade.createHttpsDownloadSession(sources, {
      root,
      fetchImpl: async () => new Response(bytes),
    });
    const stagingDir = path.join(root, 'staging-one');
    await fs.promises.mkdir(stagingDir);
    await session.download(sources[0], stagingDir);

    const workDirs = (await fs.promises.readdir(root))
      .filter((name) => name.startsWith('.archives-upgrade-'));
    assert.equal(workDirs.length, 1);
    const children = (await fs.promises.readdir(path.join(root, workDirs[0]))).sort();
    assert.deepEqual(children, ['example-shared']);
    assert.equal(
      await fs.promises.readFile(path.join(stagingDir, 'SKILL.md'), 'utf8'),
      'one',
    );
  } finally {
    await session?.cleanup();
    await fs.promises.rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});

test('TTY reporter keeps every finished file detail even when many skills squeeze the live window', async () => {
  const { createUpgradeReporter } = await import('./upgrade-skill-reporter.mjs');
  let output = '';
  const stream = {
    isTTY: true,
    columns: 80,
    rows: 24,
    write(chunk) {
      output += chunk;
    },
  };
  const sources = Array.from({ length: 12 }, (_, index) => ({
    skill: `skill-${index}`,
    repo: 'https://github.com/example/shared',
  }));
  const tokens = [];
  const reporter = createUpgradeReporter(sources, {
    stream,
    now: () => 0,
    schedule: (callback) => {
      const token = { callback };
      tokens.push(token);
      return token;
    },
    cancel: (token) => {
      const index = tokens.indexOf(token);
      if (index >= 0) tokens.splice(index, 1);
    },
    color: false,
  });

  reporter.start('skill-0');
  for (const relativePath of ['SKILL.md', 'references/a.md', 'scripts/run.sh']) {
    reporter.detail('skill-0', { mode: 'M', path: relativePath });
  }
  reporter.pass('skill-0', { durationMs: 10, fileCount: 3 });
  while (tokens.length > 0) tokens.shift().callback();
  reporter.finish();

  assert.match(output, /M SKILL\.md/);
  assert.match(output, /M references\/a\.md/);
  assert.match(output, /M scripts\/run\.sh/);
});
