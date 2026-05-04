import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

const sourceExtensions = new Set(['.ts', '.tsx']);
const findings = [];

function scanDirectory(directory) {
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      scanDirectory(fullPath);
      continue;
    }

    if (![...sourceExtensions].some((extension) => fullPath.endsWith(extension))) {
      continue;
    }

    const lines = readFileSync(fullPath, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      forbiddenPatterns.forEach(({ label, pattern }) => {
        if (pattern.test(line)) {
          findings.push(`${fullPath}:${index + 1}: forbidden pattern found: ${label}`);
        }
      });
    });
  }
}

scanDirectory('src');

if (findings.length > 0) {
  findings.forEach((finding) => console.error(finding));
  process.exit(1);
}

console.log('Security pattern check passed.');
