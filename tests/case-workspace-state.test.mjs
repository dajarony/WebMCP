import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWorkPlanSteps } from '../case-workspace-state.js';

test('ECA: work plan enforces business bounds even without host schema validation', () => {
  assert.throws(() => normalizeWorkPlanSteps([]), /between 1 and 8/);
  assert.throws(() => normalizeWorkPlanSteps(Array(9).fill('step')), /between 1 and 8/);
  assert.throws(() => normalizeWorkPlanSteps(['   ']), /cannot be empty/);
  assert.throws(() => normalizeWorkPlanSteps([42]), /must be text/);
  assert.throws(() => normalizeWorkPlanSteps(['x'.repeat(241)]), /cannot exceed 240/);
});

test('ECA: valid work plan is normalized without changing its meaning', () => {
  assert.deepEqual(
    normalizeWorkPlanSteps(['  Check condenser fan  ', 'Inspect compressor current']),
    ['Check condenser fan', 'Inspect compressor current']
  );
});
