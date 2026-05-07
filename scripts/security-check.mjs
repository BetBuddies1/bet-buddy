import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const forbiddenPatterns = [
  { label: 'dangerouslySetInnerHTML', pattern: /dangerouslySetInnerHTML/ },
  { label: 'innerHTML', pattern: /innerHTML/ },
  { label: 'outerHTML', pattern: /outerHTML/ },
  { label: 'insertAdjacentHTML', pattern: /insertAdjacentHTML/ },
  { label: 'document.write', pattern: /document\.write/ },
  { label: 'eval(', pattern: /eval\(/ },
  { label: 'new Function', pattern: /new Function/ },
  { label: 'setTimeout("', pattern: /setTimeout\("/ },
  { label: 'setInterval("', pattern: /setInterval\("/ },
  { label: 'http://', pattern: /http:\/\// },
  { label: 'window.open', pattern: /window\.open/ },
];

const sourceExtensions = new Set(['.ts', '.tsx', '.mjs', '.html']);
const scanTargets = ['src', 'scripts', 'index.html', 'vite.config.ts'];
const findings = [];

function shouldScanFile(path) {
  if (basename(path) === 'security-check.mjs') {
    return false;
  }

  return [...sourceExtensions].some((extension) => path.endsWith(extension));
}

function scanPath(path) {
  const stats = statSync(path);

  if (stats.isDirectory()) {
    scanDirectory(path);
    return;
  }

  scanFile(path);
}

function scanDirectory(directory) {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      scanDirectory(fullPath);
      continue;
    }

    scanFile(fullPath);
  }
}

function scanFile(path) {
  if (!shouldScanFile(path)) {
    return;
  }

  const lines = readFileSync(path, 'utf8').split(/\r?\n/);

  lines.forEach((line, index) => {
    forbiddenPatterns.forEach(({ label, pattern }) => {
      if (pattern.test(line)) {
        findings.push(`${path}:${index + 1}: forbidden pattern found: ${label}`);
      }
    });
  });
}

scanTargets.forEach(scanPath);

if (findings.length > 0) {
  findings.forEach((finding) => console.error(finding));
  process.exit(1);
}

console.log('Security pattern check passed.');
