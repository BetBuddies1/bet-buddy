import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { evaluateAudit } from './audit-policy.mjs';

const ID = 'GHSA-gcqx-w48m-w2h4';
const advisory = (id = ID, severity = 'low', name = 'deepmerge') => ({
  name,
  severity,
  url: `https://github.com/advisories/${id}`,
});
const report = (vulnerabilities = {}) => ({ auditReportVersion: 2, vulnerabilities });
const chain = () =>
  report({
    deepmerge: { severity: 'low', via: [advisory()] },
    '@rollup/plugin-node-resolve': { severity: 'low', via: ['deepmerge'] },
    'workbox-build': { severity: 'low', via: ['@rollup/plugin-node-resolve'] },
    'vite-plugin-pwa': { severity: 'low', via: ['workbox-build'] },
  });
const exception = (overrides = {}) => ({
  advisory: ID,
  packages: ['deepmerge', '@rollup/plugin-node-resolve', 'workbox-build', 'vite-plugin-pwa'],
  maxSeverity: 'low',
  expires: '2026-12-31',
  ...overrides,
});
const run = (overrides = {}) =>
  evaluateAudit({
    fullReport: chain(),
    prodReport: report(),
    exceptions: [exception()],
    today: '2026-10-28',
    ...overrides,
  });

test('accepts the committed exception file for the known dev-only chain', () => {
  const { exceptions } = JSON.parse(readFileSync(new URL('./audit-exceptions.json', import.meta.url), 'utf8'));
  const result = run({ exceptions });
  assert.deepEqual(result.errors, []);
  assert.equal(result.covered.length, 4);
});

test('passes a clean audit and flags the unused exception', () => {
  const result = run({ fullReport: report() });
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 1);
});

test('fails on any finding without an exception, even low severity', () => {
  assert.notDeepEqual(run({ exceptions: [] }).errors, []);
});

test('fails on a different advisory in an excepted package', () => {
  const fullReport = report({ deepmerge: { severity: 'low', via: [advisory('GHSA-aaaa-bbbb-cccc')] } });
  assert.notDeepEqual(run({ fullReport }).errors, []);
});

test('fails on a package outside the exception scope', () => {
  const fullReport = report({
    ...chain().vulnerabilities,
    vite: { severity: 'low', via: ['deepmerge'] },
  });
  assert.notDeepEqual(run({ fullReport }).errors, []);
});

test('fails when the advisory is rated above the allowed severity', () => {
  const fullReport = report({ deepmerge: { severity: 'moderate', via: [advisory(ID, 'moderate')] } });
  assert.notDeepEqual(run({ fullReport }).errors, []);
});

test('fails after the exception expires', () => {
  assert.notDeepEqual(run({ today: '2027-01-01' }).errors, []);
});

test('never excepts production dependencies', () => {
  assert.notDeepEqual(run({ prodReport: chain() }).errors, []);
});

test('fails on missing or broken reports and invalid exceptions', () => {
  assert.notDeepEqual(run({ fullReport: null }).errors, []);
  assert.notDeepEqual(run({ prodReport: { error: { code: 'ENOAUDIT' } } }).errors, []);
  assert.notDeepEqual(run({ exceptions: null }).errors, []);
  assert.notDeepEqual(run({ exceptions: [exception({ advisory: 'CVE-x' })] }).errors, []);
  assert.notDeepEqual(run({ exceptions: [exception({ packages: [] })] }).errors, []);
  assert.notDeepEqual(run({ exceptions: [exception({ expires: 'never' })] }).errors, []);
  assert.notDeepEqual(run({ exceptions: [exception({ maxSeverity: 'any' })] }).errors, []);
});
