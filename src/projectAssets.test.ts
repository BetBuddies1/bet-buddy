import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('project assets and metadata', () => {
  it('exposes a document meta description for sharing and indexing', () => {
    const html = readFileSync('index.html', 'utf8');

    expect(html).toContain('<meta name="description"');
    expect(html).toContain('Bet Buddy');
  });

  it('defines the warning color token used by setup warnings', () => {
    const css = readFileSync('src/index.css', 'utf8');

    expect(css).toMatch(/--yellow:\s*#[0-9A-Fa-f]{6};/);
    expect(css).toContain('color: var(--yellow);');
  });

  it('pre-caches PWA icons referenced by the manifest', () => {
    const viteConfig = readFileSync('vite.config.ts', 'utf8');

    expect(viteConfig).toContain("src: 'icons/buddy-mark-192.png'");
    expect(viteConfig).toContain("src: 'icons/buddy-mark-512.png'");
    expect(viteConfig).not.toContain("globIgnores: ['**/icons/*.png']");
  });

  it('lazy-loads physical challenge illustrations', () => {
    const challengeIllustration = readFileSync('src/components/ChallengeIllustration.tsx', 'utf8');

    expect(challengeIllustration).toContain('loading="lazy"');
  });

  it('does not keep unused Tailwind build tooling installed', () => {
    const packageJson = readFileSync('package.json', 'utf8');
    const viteConfig = readFileSync('vite.config.ts', 'utf8');

    expect(packageJson).not.toContain('tailwindcss');
    expect(packageJson).not.toContain('@tailwindcss/vite');
    expect(viteConfig).not.toContain('@tailwindcss/vite');
    expect(viteConfig).not.toContain('tailwindcss()');
  });
});
