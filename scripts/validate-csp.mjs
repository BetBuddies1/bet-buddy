import { readFileSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8').replace(/\s+/g, ' ');

const requiredDirectives = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "media-src 'self'",
  "font-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
];
const forbiddenDirectives = [
  "script-src 'unsafe-inline'",
  "script-src 'unsafe-eval'",
  'http:',
  'https:',
  'data:',
];

const missing = requiredDirectives.filter((directive) => !html.includes(directive));
const forbidden = forbiddenDirectives.filter((directive) => html.includes(directive));

if (!html.includes('http-equiv="Content-Security-Policy"')) {
  missing.push('Content-Security-Policy meta tag');
}

if (missing.length > 0) {
  console.error(`CSP validation failed. Missing: ${missing.join(', ')}`);
  process.exit(1);
}

if (forbidden.length > 0) {
  console.error(`CSP validation failed. Forbidden directive found: ${forbidden.join(', ')}`);
  process.exit(1);
}

console.log('CSP validation passed.');
