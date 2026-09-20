import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  cleanupUpgradeWorkDirs,
  isUpgradeWorkDirName,
  syncSkillMirror,
  syncSkillsConcurrently,
} from './upgrade-skill.mjs';

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
          throw new Error('clone failed');
        },
      }),
      /clone failed/,
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
        [{ skill: 'grilling', url: 'https://example.com', groups: ['tool'] }],
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
