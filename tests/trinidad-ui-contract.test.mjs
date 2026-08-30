import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const app = readFileSync(resolve(root, 'app.js'), 'utf8');
const styles = readFileSync(resolve(root, 'styles.css'), 'utf8');

test('ECA: Trinidad remains a visible human-only boundary in the public page', () => {
  assert.match(html, /id="trinidad-boundary"/);
  assert.match(html, /data-capability-kind="human-only-boundary"/);
  assert.match(html, /data-human-only(?:\s|>)/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /TRINIDAD · HUMAN CONTROL/);
  assert.match(html, /Trinidad approval boundary/);
});

test('ECA: sensitive proposals explicitly draw human attention to Trinidad', () => {
  assert.match(app, /function revealTrinidad\(\)/);
  assert.match(app, /trinidadBoundary\.scrollIntoView\(\{ behavior: 'smooth', block: 'center' \}\)/);
  assert.match(app, /requestSensitiveAction\(action, reason\)[\s\S]*?renderApprovals\(\);[\s\S]*?revealTrinidad\(\);/);
  assert.match(styles, /\.trinidad-boundary\.trinidad-pulse/);
  assert.match(styles, /@keyframes trinidad-attention/);
});

test('ECA: Trinidad approve and reject controls are explicitly marked human-only', () => {
  const markers = app.match(/dataset\.humanOnly = 'true'/g) || [];
  assert.equal(markers.length, 2);
  assert.match(app, /approvalBoundary\.approve\(proposal\.id\)/);
  assert.match(app, /approvalBoundary\.reject\(proposal\.id\)/);
});
