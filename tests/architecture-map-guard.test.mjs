import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const config = JSON.parse(readFileSync(resolve(projectRoot, '.sume'), 'utf8'));
const architecture = JSON.parse(readFileSync(resolve(projectRoot, 'mapa-global/arquitectura.yaml'), 'utf8'));

function listedModules(root) {
  const output = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '--', root],
    { cwd: projectRoot, encoding: 'utf8' }
  );
  return output.split(/\r?\n/).filter(Boolean).filter((file) =>
    config.map_guard.source_extensions.some((extension) => file.endsWith(extension))
  );
}

test('ECA: SUME map covers each configured source module exactly once with DOCBLOCK', () => {
  const tracked = config.map_guard.tracked_roots.flatMap(listedModules).sort();
  const mapped = architecture.modules.map((module) => module.file).sort();

  assert.deepEqual(mapped, tracked);
  assert.equal(new Set(mapped).size, mapped.length);
  for (const moduleFile of mapped) {
    const source = readFileSync(resolve(projectRoot, moduleFile), 'utf8');
    assert.match(source, /^\/\*\r?\nSUME DOCBLOCK/);
    assert.ok(
      source.trimEnd().split(/\r?\n/).length <= config.max_source_lines,
      `${moduleFile} exceeds the SUME ${config.max_source_lines}-line module limit`
    );
  }
});
