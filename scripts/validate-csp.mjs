import { readFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');

const requiredDirectives = [
  "default-src 'none'",
  "script-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "form-action 'none'",
];

const missing = requiredDirectives.filter((directive) => !html.includes(directive));

if (!html.includes('http-equiv="Content-Security-Policy"')) {
  missing.push('Content-Security-Policy meta tag');
}

if (missing.length > 0) {
  console.error(`CSP validation failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('CSP validation passed.');
