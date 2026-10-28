import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { evaluateAudit } from './audit-policy.mjs';

// Run through "npm run security:audit": npm then provides its own CLI path,
// so no shell is needed on any platform.
const npmCli = process.env.npm_execpath;
if (!npmCli || !/\.c?js$/.test(npmCli)) {
  console.error('Run this check via "npm run security:audit".');
  process.exit(1);
}

function runAudit(extraArgs) {
  const result = spawnSync(process.execPath, [npmCli, 'audit', '--json', ...extraArgs], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}

let exceptions = null;
try {
  exceptions = JSON.parse(readFileSync(new URL('./audit-exceptions.json', import.meta.url), 'utf8')).exceptions;
} catch {
  exceptions = null;
}

const { errors, warnings, covered } = evaluateAudit({
  fullReport: runAudit([]),
  prodReport: runAudit(['--omit=dev']),
  exceptions,
  today: new Date().toISOString().slice(0, 10),
});

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));

if (errors.length > 0) {
  errors.forEach((error) => console.error(error));
  process.exitCode = 1;
} else {
  console.log(`Audit passed.${covered.length > 0 ? ` Covered by exceptions: ${covered.join(', ')}` : ''}`);
}
