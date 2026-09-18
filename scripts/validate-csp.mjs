import { readFileSync } from 'node:fs';
import { validateCsp } from './csp-policy.mjs';

try {
  validateCsp(readFileSync('dist/index.html', 'utf8'));
  console.log('CSP validation passed.');
} catch (error) {
  console.error(`CSP validation failed: ${error.message}`);
  process.exitCode = 1;
}
