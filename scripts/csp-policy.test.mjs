import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { validateCsp } from './csp-policy.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const meta = html.match(/<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/)[0];

test('accepts the actual production policy and harmless whitespace', () => {
  assert.doesNotThrow(() => validateCsp(html));
  assert.doesNotThrow(() => validateCsp(html.replace("script-src 'self';", "script-src   'self' ;")));
});

for (const source of ["'unsafe-inline'", "'unsafe-eval'", '*', 'https:', 'data:']) {
  test(`rejects extra script source ${source} after self`, () => {
    assert.throws(() => validateCsp(html.replace("script-src 'self';", `script-src 'self' ${source};`)));
  });
}

test('rejects a policy present only in a comment or template', () => {
  assert.throws(() => validateCsp(html.replace(meta, `<!-- ${meta} -->`)));
  assert.throws(() => validateCsp(html.replace(meta, `<template>${meta}</template>`)));
});

test('rejects missing, repeated and unexpected directives', () => {
  assert.throws(() => validateCsp(html.replace("object-src 'none';", '')));
  assert.throws(() => validateCsp(html.replace("script-src 'self';", "script-src 'self'; script-src *;")));
  assert.throws(() => validateCsp(html.replace("script-src 'self';", "script-src 'self'; script-src-elem *;")));
});

test('rejects duplicate policy elements and policy placed in the body', () => {
  assert.throws(() => validateCsp(html.replace(meta, meta + meta)));
  assert.throws(() => validateCsp(html.replace(meta, '').replace('<body>', `<body>${meta}`)));
});

test('rejects policy after an executable resource', () => {
  assert.throws(() => validateCsp(html.replace(meta, `<script src="/early.js"></script>${meta}`)));
});
