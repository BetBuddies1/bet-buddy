import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const config = readFileSync(new URL('../.github/dependabot.yml', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// Split into one text block per update entry, keyed by ecosystem.
const entries = Object.fromEntries(
  config
    .split(/\n(?=  - package-ecosystem: )/)
    .slice(1)
    .map((block) => [block.match(/package-ecosystem: (\S+)/)[1], block]),
);

test('has exactly the npm and github-actions entries', () => {
  assert.deepEqual(Object.keys(entries).sort(), ['github-actions', 'npm']);
});

for (const ecosystem of ['npm', 'github-actions']) {
  test(`${ecosystem}: waits 7 days before proposing new versions`, () => {
    assert.match(entries[ecosystem], /\n    cooldown:\n      default-days: 7\n/);
  });

  test(`${ecosystem}: keeps weekly schedule and PR limit`, () => {
    assert.match(entries[ecosystem], /\n    schedule:\n      interval: weekly\n/);
    assert.match(entries[ecosystem], /\n    open-pull-requests-limit: 5\n/);
  });
}

test('npm: keeps the security group and the @types/node major ignore', () => {
  assert.match(entries.npm, /\n      security:\n        applies-to: security-updates\n        patterns: \['\*'\]\n/);
  assert.match(entries.npm, /- dependency-name: '@types\/node'\n        update-types: \['version-update:semver-major'\]/);
});
