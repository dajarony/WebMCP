import test from 'node:test';
import assert from 'node:assert/strict';
import { ApprovalBoundary } from '../logica/approval-boundary.js';
import { ToolErrorCode } from '../contratos/tool-errors.js';

function boundary() {
  let sequence = 0;
  let time = 1000;
  return new ApprovalBoundary({
    idFactory: () => `proposal-${++sequence}`,
    clock: () => ++time
  });
}

test('pending proposal cannot be applied', () => {
  const gate = boundary();
  const proposal = gate.request('Notify customer', 'Human must review the final wording.');

  assert.equal(proposal.status, 'pending');
  assert.throws(
    () => gate.apply(proposal.id),
    (error) => error.code === ToolErrorCode.ACTION_DENIED
  );
});

test('approved proposal executes exactly once', () => {
  const gate = boundary();
  const proposal = gate.request('Schedule technician visit', 'This commits staff time.');

  gate.approve(proposal.id);
  const executed = gate.apply(proposal.id);

  assert.equal(executed.status, 'executed');
  assert.equal(executed.consumed, true);
  assert.throws(
    () => gate.apply(proposal.id),
    (error) => error.code === ToolErrorCode.ACTION_DENIED
  );
});

test('rejected proposal cannot be applied', () => {
  const gate = boundary();
  const proposal = gate.request('Close case', 'Case closure changes operational state.');

  gate.reject(proposal.id);

  assert.equal(proposal.status, 'rejected');
  assert.throws(
    () => gate.apply(proposal.id),
    (error) => error.code === ToolErrorCode.ACTION_DENIED
  );
});

test('approval state cannot be changed twice', () => {
  const gate = boundary();
  const proposal = gate.request('Escalate case', 'Escalation affects another team.');

  gate.approve(proposal.id);

  assert.throws(() => gate.reject(proposal.id), (error) => error.code === ToolErrorCode.PROPOSAL_STATE_DENIED);
  assert.throws(() => gate.approve(proposal.id), (error) => error.code === ToolErrorCode.PROPOSAL_STATE_DENIED);
});

test('empty action or reason is rejected', () => {
  const gate = boundary();

  assert.throws(() => gate.request('', 'reason'), (error) => error.code === ToolErrorCode.INVALID_PROPOSAL);
  assert.throws(() => gate.request('action', '  '), (error) => error.code === ToolErrorCode.INVALID_PROPOSAL);
});
