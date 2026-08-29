import test from 'node:test';
import assert from 'node:assert/strict';
import { OperatorWorkspace } from '../logica/operator-workspace.js';
import { ToolErrorCode } from '../contratos/tool-errors.js';

test('ECA: invalid work plan does not mutate shared workspace', () => {
  const workspace = new OperatorWorkspace();
  const before = workspace.snapshot();

  assert.throws(
    () => workspace.createWorkPlan(['one', 42]),
    (error) => error.code === ToolErrorCode.INVALID_WORK_PLAN
  );

  assert.deepEqual(workspace.snapshot(), before);
});

test('ECA: customer update remains a bounded unsent local draft', () => {
  const workspace = new OperatorWorkspace();
  const result = workspace.prepareCustomerUpdate('We are checking the condenser fan and will update you shortly.');

  assert.equal(result.sent, false);
  assert.equal(workspace.snapshot().customerUpdate, result.draft);
  assert.throws(
    () => workspace.prepareCustomerUpdate('x'.repeat(1501)),
    (error) => error.code === ToolErrorCode.INVALID_CUSTOMER_UPDATE
  );
});

test('ECA: only a human approval unlocks one local application', () => {
  const workspace = new OperatorWorkspace();
  const proposal = workspace.requestSensitiveAction('Schedule technician visit', 'Physical inspection is needed.');

  assert.throws(
    () => workspace.applyApprovedAction(proposal.proposalId),
    (error) => error.code === ToolErrorCode.ACTION_DENIED
  );

  workspace.approveFromHuman(proposal.proposalId);
  assert.equal(workspace.applyApprovedAction(proposal.proposalId).approvalConsumed, true);
  assert.throws(
    () => workspace.applyApprovedAction(proposal.proposalId),
    (error) => error.code === ToolErrorCode.ACTION_DENIED
  );
});

test('ECA: read snapshot cannot mutate workspace state by reference', () => {
  const workspace = new OperatorWorkspace();
  const snapshot = workspace.readCaseContext();
  snapshot.case.title = 'Mutated outside';
  snapshot.sensitiveActions.push({ id: 'forged' });

  const current = workspace.readCaseContext();
  assert.equal(current.case.title, 'Cold room temperature rising');
  assert.equal(current.sensitiveActions.length, 0);
});
