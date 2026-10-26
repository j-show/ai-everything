import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  INSTALL_SOURCES,
  createNpxRunner,
  formatCommand,
  parseCatalog,
  runCli,
} from './init.mjs';

const catalog = [
  {
    skill: 'darwin-skill',
    repo: 'https://github.com/alchaincyf/darwin-skill',
    groups: ['darwin'],
  },
  {
    skill: 'huashu-nuwa',
    repo: 'https://github.com/alchaincyf/nuwa-skill',
    groups: ['nuwa', 'init'],
  },
];

const recorder = () => {
  const calls = [];
  return {
    calls,
    run: async (entry) => {
      calls.push(entry.skill);
    },
    log: () => {},
    error: () => {},
  };
};

test('formatCommand joins repo and skill into npx skills add', () => {
  assert.equal(
    formatCommand(catalog[0]),
    'npx skills add https://github.com/alchaincyf/darwin-skill --skill darwin-skill --agent universal --yes',
  );
  assert.equal(
    formatCommand({ skill: 'plain', name: 'owner/plain', groups: ['init'] }),
    'npx skills add owner/plain --agent universal --yes',
  );
  assert.equal(
    formatCommand({
      skill: 'both',
      repo: 'https://github.com/a/b',
      name: 'owner/ignored',
      groups: ['init'],
    }),
    'npx skills add https://github.com/a/b --skill both --agent universal --yes',
  );
  assert.equal(formatCommand({ skill: 'skip-me', groups: ['init'] }), null);
});

test('parseCatalog rejects entries that cannot form an install command', () => {
  assert.throws(() => parseCatalog({ skill: 'darwin-skill' }), /catalog must be an array/);
  assert.throws(
    () => parseCatalog([{ skill: '--evil', repo: 'https://github.com/a/b', groups: ['darwin'] }]),
    /skills\[0\]\.skill/,
  );
  assert.throws(
    () => parseCatalog([{ skill: 'ok', repo: 'https://github.com/a/b;touch', groups: ['darwin'] }]),
    /skills\[0\]\.repo/,
  );
  assert.throws(
    () => parseCatalog([{ skill: 'ok', name: 'owner/plain;calc', groups: ['darwin'] }]),
    /skills\[0\]\.name/,
  );
  assert.throws(
    () => parseCatalog([{ skill: 'ok', repo: 'https://github.com/a/b', groups: [] }]),
    /skills\[0\]\.groups/,
  );
  assert.throws(
    () => parseCatalog([
      { skill: 'ok', repo: 'https://github.com/a/b', groups: ['darwin'], extra: true },
    ]),
    /skills\[0\] unexpected field/,
  );
  assert.throws(
    () => parseCatalog([
      { skill: 'ok', repo: 'https://github.com/a/b', groups: ['darwin'] },
      { skill: 'ok', repo: 'owner/name', groups: ['other'] },
    ]),
    /duplicate skill: ok/,
  );
});

test('parseCatalog returns new entries and leaves the input unchanged', () => {
  const input = [{ skill: 'ok', repo: 'owner/name', groups: ['init'] }];
  const parsed = parseCatalog(input);
  parsed[0].skill = 'changed';
  parsed[0].groups.push('other');
  assert.deepEqual(input, [{ skill: 'ok', repo: 'owner/name', groups: ['init'] }]);
});

test('default run installs every catalog entry in order', async () => {
  const { calls, run } = recorder();
  const lines = [];
  await runCli([], { catalog, run, log: (line) => lines.push(line) });
  assert.deepEqual(calls, ['darwin-skill', 'huashu-nuwa']);
  assert.deepEqual(lines, [
    'npx skills add https://github.com/alchaincyf/darwin-skill --skill darwin-skill --agent universal --yes',
    'npx skills add https://github.com/alchaincyf/nuwa-skill --skill huashu-nuwa --agent universal --yes',
  ]);
});

test('group flags install the union and a named skill overrides groups', async () => {
  const grouped = recorder();
  await runCli(['--nuwa'], { catalog, run: grouped.run, log: grouped.log });
  assert.deepEqual(grouped.calls, ['huashu-nuwa']);

  const union = recorder();
  await runCli(['--nuwa', '--darwin'], { catalog, run: union.run, log: union.log });
  assert.deepEqual(union.calls, ['darwin-skill', 'huashu-nuwa']);

  const named = recorder();
  await runCli(['--skill', 'darwin-skill', '--nuwa'], {
    catalog,
    run: named.run,
    log: named.log,
  });
  assert.deepEqual(named.calls, ['darwin-skill']);
});

test('unknown skill, unknown argument, and empty selection do not install', async () => {
  for (const argv of [['--skill', 'missing'], ['--nope'], []]) {
    const { calls, run, log } = recorder();
    const target = argv.length === 0 ? [] : catalog;
    await assert.rejects(
      () => runCli(argv, { catalog: target, run, log }),
      argv[0] === '--skill'
        ? /unknown skill\(s\): missing/
        : argv[0] === '--nope'
          ? /Unknown argument: --nope/
          : /no skills selected/,
    );
    assert.deepEqual(calls, []);
  }
});

test('entries without repo or name are skipped and do not block later installs', async () => {
  const mixed = [
    { skill: 'skip-me', groups: ['init'] },
    { skill: 'named', repo: '', name: 'owner/named', groups: ['init'] },
    { skill: 'later', repo: 'https://github.com/a/later', groups: ['init'] },
  ];
  const { calls, run } = recorder();
  const lines = [];
  await runCli([], { catalog: mixed, run, log: (line) => lines.push(line) });
  assert.deepEqual(calls, ['named', 'later']);
  assert.deepEqual(lines, [
    'skip skip-me',
    'npx skills add owner/named --agent universal --yes',
    'npx skills add https://github.com/a/later --skill later --agent universal --yes',
  ]);
});

test('a failed install stops later entries', async () => {
  const calls = [];
  await assert.rejects(
    () => runCli([], {
      catalog,
      log: () => {},
      run: async (entry) => {
        calls.push(entry.skill);
        throw new Error('install failed');
      },
    }),
    /install failed/,
  );
  assert.deepEqual(calls, ['darwin-skill']);
});

test('help lists commands and does not install', async () => {
  const { calls, run } = recorder();
  const lines = [];
  await runCli(['--help'], { catalog, run, log: (line) => lines.push(line) });
  assert.deepEqual(calls, []);
  assert.match(lines.join('\n'), /--darwin/);
  assert.match(lines.join('\n'), /npx skills add <repo> --skill <skill> --agent universal --yes/);
  assert.match(lines.join('\n'), /npx skills add <name> --agent universal --yes/);
});

test('npx runner spawns skills add with the catalog repo and skill', async () => {
  const spawned = [];
  const spawnImpl = (command, args, options) => {
    spawned.push({ command, args, options });
    const child = new EventEmitter();
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };
  await createNpxRunner(spawnImpl)(catalog[0]);
  assert.equal(spawned.length, 1);
  if (process.platform === 'win32') {
    assert.equal(spawned[0].command, process.env.ComSpec || 'cmd.exe');
    assert.deepEqual(spawned[0].args, [
      '/d',
      '/s',
      '/c',
      'npx skills add https://github.com/alchaincyf/darwin-skill --skill darwin-skill --agent universal --yes',
    ]);
  } else {
    assert.equal(spawned[0].command, 'npx');
    assert.deepEqual(spawned[0].args, [
      'skills',
      'add',
      'https://github.com/alchaincyf/darwin-skill',
      '--skill',
      'darwin-skill',
      '--agent',
      'universal',
      '--yes',
    ]);
  }
  assert.equal(spawned[0].options.shell, false);
  assert.equal(spawned[0].options.stdio, 'inherit');
});

test('npx runner spawns a name source without a repo skill flag', async () => {
  const spawned = [];
  const spawnImpl = (command, args, options) => {
    spawned.push({ command, args, options });
    const child = new EventEmitter();
    process.nextTick(() => child.emit('close', 0, null));
    return child;
  };
  await createNpxRunner(spawnImpl)({ skill: 'plain', name: 'owner/plain', groups: ['init'] });
  assert.equal(spawned.length, 1);
  if (process.platform === 'win32') {
    assert.deepEqual(spawned[0].args.slice(0, 3), ['/d', '/s', '/c']);
    assert.equal(spawned[0].args[3], 'npx skills add owner/plain --agent universal --yes');
  } else {
    assert.deepEqual(spawned[0].args, [
      'skills',
      'add',
      'owner/plain',
      '--agent',
      'universal',
      '--yes',
    ]);
  }
  assert.equal(spawned[0].options.shell, false);
});

test('npx runner does not spawn an entry with neither repo nor name', async () => {
  let spawned = 0;
  const spawnImpl = () => {
    spawned += 1;
    return new EventEmitter();
  };
  await assert.rejects(
    () => createNpxRunner(spawnImpl)({ skill: 'skip-me', groups: ['init'] }),
    /no install command: skip-me/,
  );
  assert.equal(spawned, 0);
});

test('npx runner rejects an install command that fails catalog checks', async () => {
  let spawned = 0;
  const spawnImpl = () => {
    spawned += 1;
    return new EventEmitter();
  };
  await assert.rejects(
    () => createNpxRunner(spawnImpl)({
      skill: 'ok',
      repo: 'https://github.com/a/b;calc',
      groups: ['darwin'],
    }),
    /skills\[0\]\.repo/,
  );
  assert.equal(spawned, 0);
});

test('npx runner rejects a non-zero exit without hiding the command', async () => {
  const spawnImpl = () => {
    const child = new EventEmitter();
    process.nextTick(() => child.emit('close', 3, null));
    return child;
  };
  await assert.rejects(
    () => createNpxRunner(spawnImpl)(catalog[0]),
    /npx skills add https:\/\/github\.com\/alchaincyf\/darwin-skill --skill darwin-skill --agent universal --yes exit 3/,
  );
});

test('checked-in catalog installs the configured project skills', () => {
  const parsed = parseCatalog(INSTALL_SOURCES);
  assert.deepEqual(parsed.map(formatCommand), [
    'npx skills add https://github.com/alchaincyf/darwin-skill --skill darwin-skill --agent universal --yes',
    'npx skills add https://github.com/alchaincyf/nuwa-skill --skill huashu-nuwa --agent universal --yes',
    'npx skills add https://github.com/alchaincyf/huashu-design --skill huashu-design --agent universal --yes',
  ]);
  assert.deepEqual(parsed.map((entry) => entry.groups), [
    ['alchaincyf'],
    ['alchaincyf'],
    ['alchaincyf'],
  ]);
});

test('cli help exits 0 without launching an install', () => {
  const script = fileURLToPath(new URL('./init.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script, '--help'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /npx skills add <repo> --skill <skill> --agent universal --yes/);
  assert.match(result.stdout, /npx skills add <name> --agent universal --yes/);
  assert.equal(result.stderr, '');
});

test('checked-in catalog is scripts/init.json', () => {
  const catalogPath = fileURLToPath(new URL('../init.json', import.meta.url));
  assert.equal(path.basename(path.dirname(catalogPath)), 'scripts');
  assert.equal(path.basename(catalogPath), 'init.json');
  assert.deepEqual(JSON.parse(fs.readFileSync(catalogPath, 'utf8')), INSTALL_SOURCES);
});
